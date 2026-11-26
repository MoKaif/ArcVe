#!/bin/bash

# ArcVe Application Starter Script
# This script starts both the FastAPI backend and the Next.js frontend.

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting ArcVe Application...${NC}"

# Get the absolute path of the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if docker mode is requested
if [[ "$1" == "--docker" ]]; then
    # Function to cleanup docker resources
    cleanup_docker() {
        echo -e "\n${BLUE}Stopping Docker containers...${NC}"
        docker-compose down
        exit
    }
    trap cleanup_docker SIGINT SIGTERM

    # Pre-flight check for ports
    if lsof -i :8000 -t >/dev/null || lsof -i :3000 -t >/dev/null; then
        echo -e "${RED}Error: Ports 3000 or 8000 are already in use.${NC}"
        echo -e "${YELLOW}Please stop existing processes or use 'kill <pid>' to free the ports.${NC}"
        lsof -i :8000 -i :3000
        exit 1
    fi

    # Check for .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${RED}Error: .env file not found.${NC}"
        echo -e "${YELLOW}Please create a .env file with your IGDB_CLIENT_ID and IGDB_CLIENT_SECRET.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Starting application in Docker mode...${NC}"
    docker-compose up --build
    exit $?
fi

# Local development mode
BACKEND_PID=""
FRONTEND_PID=""

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down application...${NC}"
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# 1. Setup Backend
echo -e "${GREEN}Configuring Backend...${NC}"
cd "$PROJECT_ROOT/backend" || exit
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate
echo -e "${GREEN}Installing/Updating backend dependencies...${NC}"
pip install -r requirements.txt > /dev/null 2>&1

# Start uvicorn in the background
echo -e "${GREEN}Starting FastAPI Backend on port 8000...${NC}"
uvicorn main:app --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# 2. Setup Frontend
echo -e "${GREEN}Configuring Frontend...${NC}"
cd "$PROJECT_ROOT" || exit
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies (this may take a minute)...${NC}"
    npm install > /dev/null 2>&1
fi

echo -e "${GREEN}Starting Next.js Frontend on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Application is running!${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "${YELLOW}Note: Ensure PostgreSQL is running at localhost:5432${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Press Ctrl+C to stop both services."

# Wait for background processes
wait
