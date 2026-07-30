from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    igdb_id: int = Field(index=True, unique=True)
    title: str
    user_rating: Optional[float] = None
    status: Optional[str] = "Backlog"
    playthrough_video_url: Optional[str] = None
    notes: Optional[str] = None

    # Cached IGDB data
    cover_image: Optional[str] = None
    release_year: Optional[int] = None
    platforms: Optional[str] = None # comma separated
    genres: Optional[str] = None # comma separated
    description: Optional[str] = None
    last_engaged: Optional[str] = None

    # Steam-derived data
    steam_appid: Optional[int] = Field(default=None, index=True)
    playtime_minutes: Optional[int] = None
    playtime_2weeks: Optional[int] = None
    last_played_at: Optional[datetime] = None
    achievement_pct: Optional[float] = None
    achievements_unlocked: Optional[int] = None
    achievements_total: Optional[int] = None
    # When true, sync will not overwrite `status` — lets you pin "Finished",
    # which Steam has no way of knowing.
    status_locked: bool = Field(default=False)


class PlaytimeSnapshot(SQLModel, table=True):
    """One row per game per sync.

    Steam exposes only a cumulative `playtime_forever` and a rolling two-week
    window; there is no endpoint for historical play sessions. Diffing
    consecutive snapshots is the only way to reconstruct a play history, so
    these rows are the raw material for every time-series chart.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    steam_appid: int = Field(index=True)
    captured_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    playtime_forever: int  # cumulative minutes, as reported by Steam
    delta_minutes: int = 0  # minutes played since the previous snapshot


class SteamAppMapping(SQLModel, table=True):
    """Cache of the Steam appid -> IGDB id bridge.

    Resolved via IGDB's external_games endpoint. The mapping is immutable once
    established, so this is written once and read forever. `igdb_id` is null for
    apps IGDB has no record of (delisted titles, tools, some indies).
    """
    steam_appid: int = Field(primary_key=True)
    igdb_id: Optional[int] = Field(default=None, index=True)
    steam_name: Optional[str] = None
    resolved_at: datetime = Field(default_factory=datetime.utcnow)
    # Set when you manually link an app IGDB could not match automatically.
    manual: bool = Field(default=False)
