"""Steam -> ArcVe synchronisation.

Design notes:

* Snapshots are written for *every* owned app, including ones IGDB cannot match.
  Playtime history is keyed on `steam_appid`, not on a Game row, so history keeps
  accruing for unmatched titles and is already there if you link them later.
* `status` is only inferred for games you have not pinned. Steam cannot know you
  rolled credits, so a manual "Finished" always wins.
"""

from datetime import datetime, timedelta

import httpx
from sqlmodel import Session, select

from config import ABANDONED_AFTER_DAYS
from igdb_link import cover_from_igdb, fetch_game_details, resolve_appids
from models import Game, PlaytimeSnapshot
import steam

# Steam allows ~100k calls/day, but achievement lookups are one call per game.
# Cap a single pass so a 1000-game library cannot stall the request.
ACHIEVEMENT_BATCH_LIMIT = 60


def _infer_status(game: Game, playtime: int, last_played: datetime | None) -> str:
    if game.status_locked or game.status == "Finished":
        return game.status or "Backlog"
    if playtime == 0:
        return "Backlog"
    if game.playtime_2weeks:
        return "Active"
    if last_played and datetime.utcnow() - last_played > timedelta(days=ABANDONED_AFTER_DAYS):
        return "Abandoned"
    return "Active"


def _write_snapshot(session: Session, appid: int, playtime: int) -> int:
    previous = session.exec(
        select(PlaytimeSnapshot)
        .where(PlaytimeSnapshot.steam_appid == appid)
        .order_by(PlaytimeSnapshot.captured_at.desc())
    ).first()

    delta = playtime - previous.playtime_forever if previous else 0
    # Only record a row when something changed, otherwise a nightly job would
    # write thousands of identical rows per year.
    if previous and delta == 0:
        return 0

    session.add(PlaytimeSnapshot(
        steam_appid=appid,
        playtime_forever=playtime,
        delta_minutes=max(delta, 0),
    ))
    return delta


async def sync_library(session: Session, steamid: str) -> dict:
    owned = await steam.get_owned_games(steamid)

    appids = [g["appid"] for g in owned]
    names = {g["appid"]: g.get("name", "") for g in owned}
    mapping = await resolve_appids(session, appids, names)

    matched_ids = [igdb_id for igdb_id in mapping.values() if igdb_id]
    existing = session.exec(select(Game).where(Game.igdb_id.in_(matched_ids))).all()
    by_igdb = {g.igdb_id: g for g in existing}

    # Only fetch IGDB metadata for games not already in the library.
    new_igdb_ids = [i for i in matched_ids if i not in by_igdb]
    details = await fetch_game_details(new_igdb_ids)

    created = updated = unmatched = minutes_gained = 0

    for entry in owned:
        appid = entry["appid"]
        playtime = entry.get("playtime_forever", 0)

        delta = _write_snapshot(session, appid, playtime)
        minutes_gained += max(delta, 0)

        igdb_id = mapping.get(appid)
        if not igdb_id:
            unmatched += 1
            continue

        last_played = (
            datetime.utcfromtimestamp(entry["rtime_last_played"])
            if entry.get("rtime_last_played")
            else None
        )

        game = by_igdb.get(igdb_id)
        if game is None:
            meta = details.get(igdb_id, {})
            release = meta.get("first_release_date")
            game = Game(
                igdb_id=igdb_id,
                title=meta.get("name") or entry.get("name") or f"App {appid}",
                cover_image=cover_from_igdb(meta) or steam.cover_url(appid),
                release_year=datetime.utcfromtimestamp(release).year if release else None,
                genres=",".join(g["name"] for g in meta.get("genres", [])) or None,
                platforms=",".join(p["name"] for p in meta.get("platforms", [])) or None,
                description=meta.get("summary"),
            )
            by_igdb[igdb_id] = game
            created += 1
        else:
            updated += 1

        game.steam_appid = appid
        game.playtime_minutes = playtime
        game.playtime_2weeks = entry.get("playtime_2weeks", 0)
        game.last_played_at = last_played
        if last_played:
            game.last_engaged = last_played.date().isoformat()
        game.status = _infer_status(game, playtime, last_played)

        session.add(game)

    session.commit()

    return {
        "owned": len(owned),
        "created": created,
        "updated": updated,
        "unmatched": unmatched,
        "minutes_gained_since_last_sync": minutes_gained,
    }


async def sync_achievements(session: Session, steamid: str, limit: int = ACHIEVEMENT_BATCH_LIMIT) -> dict:
    """Refresh achievement completion, most-recently-played games first."""
    games = session.exec(
        select(Game)
        .where(Game.steam_appid.is_not(None))
        .where(Game.playtime_minutes > 0)
        .order_by(Game.last_played_at.desc())
        .limit(limit)
    ).all()

    checked = with_stats = 0
    async with httpx.AsyncClient() as client:
        for game in games:
            achievements = await steam.get_player_achievements(client, steamid, game.steam_appid)
            checked += 1
            if achievements is None:
                game.achievements_total = 0
                game.achievement_pct = None
                session.add(game)
                continue

            total = len(achievements)
            unlocked = sum(1 for a in achievements if a.get("achieved"))
            game.achievements_total = total
            game.achievements_unlocked = unlocked
            game.achievement_pct = round(unlocked / total * 100, 1) if total else None
            with_stats += 1
            session.add(game)

    session.commit()
    return {"checked": checked, "with_stats": with_stats}
