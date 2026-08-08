# Changelog

All notable changes to ArcVe are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH`). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added
- Steam Web API integration: library auto-import with objective playtime,
  derived play status, and achievement completion tracking.
- `PlaytimeSnapshot` table plus `GET /steam/history`. Steam exposes no historical
  playtime, only a cumulative total, so history is reconstructed by diffing
  snapshots — it accrues from the first sync onward and cannot be backfilled.
- `SteamAppMapping` table caching the Steam appid to IGDB id bridge, resolved via
  IGDB `external_games`, with `GET /steam/unmatched` and `POST /steam/link` for
  titles IGDB cannot match automatically.
- `GET /steam/backlog` (never-launched and abandoned-mid-progress triage) and
  `GET /steam/status` (live "now playing").
- Next.js proxy routes under `app/api/steam/` so the LAN relative-path model holds.

### Fixed
- `.env` used YAML-style `KEY: "value"`, which dotenv and docker-compose `env_file`
  both ignore; converted to `KEY=value`. The backend now loads it via `config.py`.
- `create_db_and_tables()` did not import the models module, so `create_all()`
  registered no tables when called outside the app (scripts, cron).
- SQLAlchemy `echo=True` was writing every statement to a tracked `backend.log`.

### Changed
- `backend.log`, `__pycache__/` and `backend/venv/` are now git-ignored and untracked.
- Setting a status through `POST /games` marks it `status_locked` so Steam sync
  will not overwrite a manual "Finished".

## [0.1.0] - 2026-07-11

Versioning baseline. Establishes the changelog + SemVer/Conventional-Commits
convention for ArcVe going forward. (`.env`, `node_modules`, and `.next` are
already git-ignored; IGDB credentials are read from environment variables.)
