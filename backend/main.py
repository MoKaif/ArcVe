from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables, get_session
from models import Game
from contextlib import asynccontextmanager

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
