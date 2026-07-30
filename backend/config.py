import os
from pathlib import Path

from dotenv import load_dotenv

# .env lives at the project root, one level above backend/.
# In Docker the file is injected via env_file, so a missing file is not an error.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/arcve")

STEAM_API_KEY = os.getenv("STEAM_API_KEY", "")
STEAM_ID = os.getenv("STEAM_ID", "")

IGDB_CLIENT_ID = os.getenv("IGDB_CLIENT_ID", "")
IGDB_CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET", "")

# A game untouched for this long that was started but not finished is treated as Abandoned.
ABANDONED_AFTER_DAYS = int(os.getenv("ABANDONED_AFTER_DAYS", "180"))
