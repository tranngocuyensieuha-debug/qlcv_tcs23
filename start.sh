#!/usr/bin/env sh
set -eu

DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5173}"
EXCEL_FILE="${EXCEL_FILE:-$DIR/file du lieu.xlsx}"

export HOST PORT EXCEL_FILE

echo "Starting web server: http://$HOST:$PORT"
echo "Excel data file: $EXCEL_FILE"
echo "Open from another computer: http://<SERVER_IP>:$PORT"

exec python3 "$DIR/server.py"
