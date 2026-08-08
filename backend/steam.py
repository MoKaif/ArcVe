"""Steam Web API client.

Docs: https://developer.valvesoftware.com/wiki/Steam_Web_API

Two things to know before reading this:

1. If the profile's "Game details" privacy setting is not Public, GetOwnedGames
   returns `{"response": {}}` with a 200 OK — not an error. `OwnedGamesUnavailable`
   turns that silent failure into a loud one.
2. Games without stats support return 400 from GetPlayerAchievements. That is
   normal, not a fault, so achievement lookups degrade to None rather than raise.
"""

import httpx

from config import STEAM_API_KEY

BASE = "https://api.steampowered.com"
TIMEOUT = httpx.Timeout(20.0)


class SteamError(RuntimeError):
    pass


class OwnedGamesUnavailable(SteamError):
    """Steam returned an empty response — almost always a private profile."""


class AchievementsPrivate(SteamError):
    """Achievement visibility is restricted, independently of the games list.

    Steam gates these separately: a profile can expose its full library and
    playtime while still returning 403 for per-player achievements. Treating
    that as "this game has no achievements" would silently zero out every
    completion percentage, so it is raised rather than swallowed.
    """


def _require_key() -> str:
    if not STEAM_API_KEY:
        raise SteamError("STEAM_API_KEY is not set in .env")
    return STEAM_API_KEY


async def _get(client: httpx.AsyncClient, path: str, params: dict) -> dict:
    resp = await client.get(f"{BASE}/{path}", params=params, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


async def resolve_vanity(vanity: str) -> str:
    """Turn a steamcommunity.com/id/<vanity> name into a SteamID64."""
    async with httpx.AsyncClient() as client:
        data = await _get(client, "ISteamUser/ResolveVanityURL/v1/", {
            "key": _require_key(),
            "vanityurl": vanity,
        })
    response = data.get("response", {})
    if response.get("success") != 1:
        raise SteamError(f"Could not resolve vanity URL '{vanity}'")
    return response["steamid"]


async def get_owned_games(steamid: str) -> list[dict]:
    """Full library with playtime. One call, no pagination."""
    async with httpx.AsyncClient() as client:
        data = await _get(client, "IPlayerService/GetOwnedGames/v1/", {
            "key": _require_key(),
            "steamid": steamid,
            "include_appinfo": 1,
            "include_played_free_games": 1,
            "format": "json",
        })

    response = data.get("response", {})
    if "games" not in response:
        raise OwnedGamesUnavailable(
            "Steam returned no games. Set your profile's 'Game details' privacy "
            "to Public at https://steamcommunity.com/my/edit/settings, then retry."
        )
    return response["games"]


async def get_player_summary(steamid: str) -> dict:
    """Profile state. Includes `gameextrainfo`/`gameid` when currently in-game."""
    async with httpx.AsyncClient() as client:
        data = await _get(client, "ISteamUser/GetPlayerSummaries/v2/", {
            "key": _require_key(),
            "steamids": steamid,
        })
    players = data.get("response", {}).get("players", [])
    if not players:
        raise SteamError(f"No profile found for SteamID {steamid}")
    return players[0]


async def get_recently_played(steamid: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        data = await _get(client, "IPlayerService/GetRecentlyPlayedGames/v1/", {
            "key": _require_key(),
            "steamid": steamid,
        })
    return data.get("response", {}).get("games", [])


async def get_player_achievements(
    client: httpx.AsyncClient, steamid: str, appid: int
) -> list[dict] | None:
    """Unlocked state per achievement, or None if the game has no stats."""
    try:
        resp = await client.get(
            f"{BASE}/ISteamUserStats/GetPlayerAchievements/v1/",
            params={"key": _require_key(), "steamid": steamid, "appid": appid, "l": "english"},
            timeout=TIMEOUT,
        )
    except httpx.RequestError:
        return None

    if resp.status_code == 403:
        raise AchievementsPrivate(
            "Steam is refusing achievement data for this profile (403). Set "
            "'Game details' to Public at "
            "https://steamcommunity.com/my/edit/settings — and if it already is, "
            "toggle it to Private and back, as the setting is known to stick."
        )
    # 400 means this app genuinely has no stats/achievements, which is normal.
    if resp.status_code != 200:
        return None

    stats = resp.json().get("playerstats", {})
    if not stats.get("success"):
        return None
    return stats.get("achievements", [])


async def get_global_achievement_pct(appid: int) -> dict[str, float]:
    """Global unlock rarity per achievement. Needs no API key."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
                params={"gameid": appid},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            return {}

    rows = resp.json().get("achievementpercentages", {}).get("achievements", [])
    return {row["name"]: row["percent"] for row in rows}


async def get_schema_for_game(appid: int) -> dict[str, dict]:
    """Achievement display names/icons/descriptions, keyed by internal API name."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{BASE}/ISteamUserStats/GetSchemaForGame/v2/",
                params={"key": _require_key(), "appid": appid},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            return {}

    rows = (
        resp.json()
        .get("game", {})
        .get("availableGameStats", {})
        .get("achievements", [])
    )
    return {row["name"]: row for row in rows}


def cover_url(appid: int) -> str:
    """Steam's CDN vertical capsule. Used as a fallback when IGDB has no cover."""
    return f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg"
