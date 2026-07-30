from sqlmodel import create_engine, SQLModel, Session, text

from config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False)

# create_all() only creates missing tables — it will never ALTER an existing one.
# The `game` table predates the Steam integration, so new columns have to be added
# explicitly. ADD COLUMN IF NOT EXISTS makes this safe to run on every startup.
_GAME_COLUMNS = [
    ("steam_appid", "INTEGER"),
    ("playtime_minutes", "INTEGER"),
    ("playtime_2weeks", "INTEGER"),
    ("last_played_at", "TIMESTAMP"),
    ("achievement_pct", "DOUBLE PRECISION"),
    ("achievements_unlocked", "INTEGER"),
    ("achievements_total", "INTEGER"),
    ("status_locked", "BOOLEAN NOT NULL DEFAULT FALSE"),
]


def get_session():
    with Session(engine) as session:
        yield session


def run_migrations():
    with engine.begin() as conn:
        for name, coltype in _GAME_COLUMNS:
            conn.execute(text(f'ALTER TABLE game ADD COLUMN IF NOT EXISTS {name} {coltype}'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS ix_game_steam_appid ON game (steam_appid)'))


def create_db_and_tables():
    # create_all only emits tables registered on SQLModel.metadata, which happens
    # as a side effect of importing the model classes. Importing here means the
    # call is correct no matter who invokes it (app startup, a script, a cron job).
    import models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    run_migrations()
