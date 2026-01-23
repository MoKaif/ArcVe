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
