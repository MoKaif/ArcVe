"""Resolves Steam appids to IGDB game ids.

Title matching is not viable — editions, remasters, trademark symbols and
punctuation differences make it wrong often enough to corrupt the library. IGDB
publishes the authoritative mapping on its `external_games` endpoint, where
category 1 is Steam and `uid` is the appid as a string.

The mapping never changes once established, so results are cached permanently in
SteamAppMapping, including negative results (IGDB genuinely has no entry for many
tools, demos and delisted titles).
"""

import asyncio
import time

import httpx
from sqlmodel import Session, select

from config import IGDB_CLIENT_ID, IGDB_CLIENT_SECRET
from models import SteamAppMapping

IGDB_BASE = "https://api.igdb.com/v4"
# IGDB has migrated from `category` to `external_game_source`; Steam rows no longer
# carry `category` at all, so filtering on it silently matches nothing. The filter
# is also load-bearing for correctness, not just efficiency: `uid` is only unique
# *within* a source, and appid "440" resolves to Team Fortress 2 on Steam but to
# unrelated games on Giant Bomb, Twitch and Utomik.
STEAM_SOURCE = 1
# IGDB caps a query at 500 rows and rate limits to ~4 requests/second.
BATCH_SIZE = 400
BATCH_PAUSE_SECONDS = 0.3

_token: str | None = None
_token_expiry: float = 0.0


class IGDBError(RuntimeError):
    pass


async def _get_token() -> str:
    global _token, _token_expiry
    if _token and time.time() < _token_expiry:
        return _token

    if not IGDB_CLIENT_ID or not IGDB_CLIENT_SECRET:
        raise IGDBError("IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are not set in .env")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://id.twitch.tv/oauth2/token",
            params={
                "client_id": IGDB_CLIENT_ID,
                "client_secret": IGDB_CLIENT_SECRET,
                "grant_type": "client_credentials",
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        data = resp.json()

    _token = data["access_token"]
    _token_expiry = time.time() + data["expires_in"] - 300
    return _token


async def _query(endpoint: str, body: str) -> list[dict]:
    token = await _get_token()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{IGDB_BASE}/{endpoint}",
            headers={
                "Client-ID": IGDB_CLIENT_ID,
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            },
            content=body,
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()


async def resolve_appids(
    session: Session, appids: list[int], names: dict[int, str] | None = None
) -> dict[int, int | None]:
    """Map Steam appids to IGDB ids, using and populating the local cache."""
    names = names or {}

    cached_rows = session.exec(
        select(SteamAppMapping).where(SteamAppMapping.steam_appid.in_(appids))
    ).all()
    resolved: dict[int, int | None] = {row.steam_appid: row.igdb_id for row in cached_rows}

    unknown = [appid for appid in appids if appid not in resolved]
    if not unknown:
        return resolved

    for start in range(0, len(unknown), BATCH_SIZE):
        batch = unknown[start:start + BATCH_SIZE]
        uid_list = ",".join(f'"{appid}"' for appid in batch)
        body = (
            f"fields game,uid; "
            f"where external_game_source = {STEAM_SOURCE} & uid = ({uid_list}); "
            f"limit {len(batch)};"
        )
        rows = await _query("external_games", body)

        found = {int(row["uid"]): row["game"] for row in rows if row.get("game")}

        for appid in batch:
            igdb_id = found.get(appid)
            resolved[appid] = igdb_id
            session.add(SteamAppMapping(
                steam_appid=appid,
                igdb_id=igdb_id,
                steam_name=names.get(appid),
            ))

        session.commit()
        if start + BATCH_SIZE < len(unknown):
            await asyncio.sleep(BATCH_PAUSE_SECONDS)

    return resolved


async def fetch_game_details(igdb_ids: list[int]) -> dict[int, dict]:
    """Metadata for the resolved games, keyed by IGDB id."""
    if not igdb_ids:
        return {}

    details: dict[int, dict] = {}
    for start in range(0, len(igdb_ids), BATCH_SIZE):
        batch = igdb_ids[start:start + BATCH_SIZE]
        body = (
            f"fields id,name,cover.url,first_release_date,genres.name,"
            f"platforms.name,summary; "
            f"where id = ({','.join(str(i) for i in batch)}); "
            f"limit {len(batch)};"
        )
        for row in await _query("games", body):
            details[row["id"]] = row

        if start + BATCH_SIZE < len(igdb_ids):
            await asyncio.sleep(BATCH_PAUSE_SECONDS)

    return details


def cover_from_igdb(row: dict) -> str | None:
    url = row.get("cover", {}).get("url")
    if not url:
        return None
    return f"https:{url.replace('t_thumb', 't_cover_big')}"
