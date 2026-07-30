from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables, get_session
from models import Game, PlaytimeSnapshot, SteamAppMapping
from contextlib import asynccontextmanager

import steam
import sync as steam_sync
from config import STEAM_ID

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# CORS configuration
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to ArcVe Backend"}

@app.post("/games")
def create_or_update_game(game: Game, session: Session = Depends(get_session)):
    existing_game = session.exec(select(Game).where(Game.igdb_id == game.igdb_id)).first()
    if existing_game:
        # Update mutable fields
        existing_game.user_rating = game.user_rating
        existing_game.status = game.status
        existing_game.playthrough_video_url = game.playthrough_video_url
        existing_game.notes = game.notes
        existing_game.last_engaged = game.last_engaged

        # A status set by hand outranks anything the Steam sync would infer.
        existing_game.status_locked = True

        # Update cached fields (optional, but good to keep fresh)
        existing_game.title = game.title
        existing_game.cover_image = game.cover_image
        existing_game.release_year = game.release_year
        existing_game.platforms = game.platforms
        existing_game.genres = game.genres
        existing_game.description = game.description

        session.add(existing_game)
        session.commit()
        session.refresh(existing_game)
        return existing_game
    else:
        session.add(game)
        session.commit()
        session.refresh(game)
        return game

@app.get("/games")
def list_games(session: Session = Depends(get_session)):
    return session.exec(select(Game)).all()

@app.get("/games/{igdb_id}")
def get_game(igdb_id: int, session: Session = Depends(get_session)):
    game = session.exec(select(Game).where(Game.igdb_id == igdb_id)).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@app.delete("/games/{igdb_id}")
def delete_game(igdb_id: int, session: Session = Depends(get_session)):
    game = session.exec(select(Game).where(Game.igdb_id == igdb_id)).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    session.delete(game)
    session.commit()
    return {"ok": True}


# --- Steam integration ------------------------------------------------------

def _steam_id(override: str | None = None) -> str:
    steamid = override or STEAM_ID
    if not steamid:
        raise HTTPException(
            status_code=400,
            detail="STEAM_ID is not set in .env. Look it up via GET /steam/resolve/{vanity}.",
        )
    return steamid


@app.get("/steam/resolve/{vanity}")
async def resolve_steam_vanity(vanity: str):
    """Turn a steamcommunity.com/id/<vanity> name into the SteamID64 for .env."""
    try:
        return {"steamid": await steam.resolve_vanity(vanity)}
    except steam.SteamError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/steam/sync")
async def run_steam_sync(steamid: str | None = None, session: Session = Depends(get_session)):
    """Import the Steam library, refresh playtime, and snapshot history."""
    try:
        return await steam_sync.sync_library(session, _steam_id(steamid))
    except steam.OwnedGamesUnavailable as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except steam.SteamError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/steam/sync/achievements")
async def run_achievement_sync(
    limit: int = 60, steamid: str | None = None, session: Session = Depends(get_session)
):
    try:
        return await steam_sync.sync_achievements(session, _steam_id(steamid), limit)
    except steam.AchievementsPrivate as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except steam.SteamError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.get("/steam/status")
async def steam_now_playing(steamid: str | None = None):
    """Live profile state — powers a 'Now Playing' banner."""
    try:
        player = await steam.get_player_summary(_steam_id(steamid))
    except steam.SteamError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        "persona": player.get("personaname"),
        "avatar": player.get("avatarfull"),
        "online": player.get("personastate", 0) != 0,
        "playing": player.get("gameextrainfo"),
        "playing_appid": int(player["gameid"]) if player.get("gameid") else None,
    }


@app.get("/steam/history")
def playtime_history(days: int = 30, session: Session = Depends(get_session)):
    """Minutes played per day, reconstructed by diffing snapshots.

    Steam has no historical playtime endpoint — this series only contains days
    since the first sync, and grows from here.
    """
    since = datetime.utcnow() - timedelta(days=days)
    rows = session.exec(
        select(PlaytimeSnapshot)
        .where(PlaytimeSnapshot.captured_at >= since)
        .where(PlaytimeSnapshot.delta_minutes > 0)
    ).all()

    titles = {
        g.steam_appid: g.title
        for g in session.exec(select(Game).where(Game.steam_appid.is_not(None))).all()
    }

    by_day: dict[str, int] = defaultdict(int)
    by_game: dict[int, int] = defaultdict(int)
    for row in rows:
        by_day[row.captured_at.date().isoformat()] += row.delta_minutes
        by_game[row.steam_appid] += row.delta_minutes

    top = sorted(by_game.items(), key=lambda kv: kv[1], reverse=True)[:10]
    return {
        "days": days,
        "total_minutes": sum(by_day.values()),
        "series": [{"date": d, "minutes": m} for d, m in sorted(by_day.items())],
        "top_games": [
            {"steam_appid": appid, "title": titles.get(appid, f"App {appid}"), "minutes": m}
            for appid, m in top
        ],
    }


@app.get("/steam/backlog")
def backlog_triage(session: Session = Depends(get_session)):
    """Never-launched games and ones abandoned mid-progress."""
    games = session.exec(select(Game).where(Game.steam_appid.is_not(None))).all()

    never_played = [
        {"igdb_id": g.igdb_id, "title": g.title, "cover_image": g.cover_image}
        for g in games
        if not g.playtime_minutes
    ]
    abandoned = [
        {
            "igdb_id": g.igdb_id,
            "title": g.title,
            "cover_image": g.cover_image,
            "hours": round((g.playtime_minutes or 0) / 60, 1),
            "achievement_pct": g.achievement_pct,
            "last_played": g.last_played_at.date().isoformat() if g.last_played_at else None,
        }
        for g in games
        if g.status == "Abandoned" and g.achievement_pct and 20 <= g.achievement_pct <= 80
    ]

    return {
        "never_played": sorted(never_played, key=lambda g: g["title"]),
        "never_played_count": len(never_played),
        "unfinished": sorted(abandoned, key=lambda g: g["achievement_pct"], reverse=True),
    }


@app.get("/steam/overview")
def steam_overview(session: Session = Depends(get_session)):
    """Everything the Steam panel renders, in one call."""
    games = session.exec(
        select(Game).where(Game.steam_appid.is_not(None))
    ).all()

    total_minutes = sum(g.playtime_minutes or 0 for g in games)
    played = [g for g in games if (g.playtime_minutes or 0) > 0]
    rated = [g.achievement_pct for g in games if g.achievement_pct is not None]

    return {
        "total_games": len(games),
        "total_hours": round(total_minutes / 60, 1),
        "played_count": len(played),
        "never_played_count": len(games) - len(played),
        "active_count": sum(1 for g in games if g.status == "Active"),
        # Null across the board means Steam is withholding achievements, which the
        # panel surfaces as a hint rather than as a row of empty progress bars.
        "achievements_available": bool(rated),
        "avg_completion": round(sum(rated) / len(rated), 1) if rated else None,
        "games": [
            {
                "igdb_id": g.igdb_id,
                "steam_appid": g.steam_appid,
                "title": g.title,
                "cover_image": g.cover_image,
                "status": g.status,
                "hours": round((g.playtime_minutes or 0) / 60, 1),
                "minutes": g.playtime_minutes or 0,
                "playtime_2weeks": g.playtime_2weeks or 0,
                "last_played": g.last_played_at.date().isoformat() if g.last_played_at else None,
                "achievement_pct": g.achievement_pct,
                "achievements_unlocked": g.achievements_unlocked,
                "achievements_total": g.achievements_total,
            }
            for g in sorted(games, key=lambda g: g.playtime_minutes or 0, reverse=True)
        ],
    }


@app.get("/steam/unmatched")
def unmatched_apps(session: Session = Depends(get_session)):
    """Owned apps IGDB could not resolve — candidates for manual linking."""
    rows = session.exec(
        select(SteamAppMapping).where(SteamAppMapping.igdb_id.is_(None))
    ).all()
    return [{"steam_appid": r.steam_appid, "name": r.steam_name} for r in rows]


@app.post("/steam/link")
def link_app_manually(steam_appid: int, igdb_id: int, session: Session = Depends(get_session)):
    """Manually bridge an app IGDB could not match automatically."""
    row = session.get(SteamAppMapping, steam_appid)
    if row is None:
        row = SteamAppMapping(steam_appid=steam_appid)
    row.igdb_id = igdb_id
    row.manual = True
    session.add(row)
    session.commit()
    return {"ok": True, "steam_appid": steam_appid, "igdb_id": igdb_id}
