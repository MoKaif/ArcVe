#!/bin/bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"

"$project_dir/backend/venv/bin/python" -m uvicorn main:app \
    --app-dir "$project_dir/backend" --host 127.0.0.1 --port 18000 &
backend_pid=$!

INTERNAL_BACKEND_URL=http://127.0.0.1:18000 HOSTNAME=127.0.0.1 PORT=13000 \
    /usr/bin/npm --prefix "$project_dir" run start -- --hostname 127.0.0.1 --port 13000 &
frontend_pid=$!

cleanup() {
    exit_code=$?
    trap - EXIT INT TERM
    kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
    wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
    exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 0' INT TERM

wait -n "$backend_pid" "$frontend_pid"
