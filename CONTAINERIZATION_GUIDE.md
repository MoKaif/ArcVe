# Containerization Guide: Hybrid Setup with Native Database

This guide explains how to containerize a full-stack application (Next.js + FastAPI) while keeping a native database (PostgreSQL) as the source of truth, and ensuring it works seamlessly across a Local Area Network (LAN).

## 1. Rationale: Why Hybrid?
- **Speed**: Running a native DB on the host is often faster than containerized volumes during development.
- **Persistence**: Easier to manage backups and state outside of the Docker lifecycle.
- **LAN Access**: Solving the "localhost" problem where a mobile device or another laptop on the same network tries to reach `localhost` and fails because the server is on a different machine.

## 2. Infrastructure Setup

### Docker Networking (Linux specific)
To allow containers to reach the host's native database and each other via `localhost`, use `network_mode: host` in your `docker-compose.yml`. This maps the container's network stack directly to the host's.

```yaml
services:
  backend:
    # ...
    network_mode: host
  frontend:
    # ...
    network_mode: host
```

## 3. The "Missing Link": API Proxying

### The Problem
If your Frontend calls `fetch('http://localhost:8000/api')`, it works on your machine. But if you open the app on your phone, your phone tries to find a backend running on *your phone* (localhost), which doesn't exist.

### The Solution: Server-Side Proxy
1.  **Relative Paths**: Change all frontend `fetch` calls to relative paths (e.g., `/api/games`). This tells the browser to send the request back to the *same IP it loaded the page from*.
2.  **Next.js API Routes**: Create handlers in `app/api/...` that receive the request on the server and forward it to the internal backend.

**Example Route (`app/api/games/route.ts`):**
```typescript
const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
    const res = await fetch(`${INTERNAL_BACKEND_URL}/games`);
    const data = await res.json();
    return Response.json(data);
}
```

## 4. Dockerfile Templates

### Backend (Python/FastAPI)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Next.js Standalone)
Ensure `next.config.js` has `output: 'standalone'`.
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
```

## 5. Docker Compose Checklist
- [ ] Use `env_file` to pass IGDB or DB credentials.
- [ ] Set `INTERNAL_BACKEND_URL` for the frontend.
- [ ] Ensure `DATABASE_URL` for the backend points to `localhost` (if using `network_mode: host`).

## 6. Accessing via LAN
1.  Get your server IP (e.g., `192.168.1.5`).
2.  Run `docker-compose up --build`.
3.  Access via `http://192.168.1.5:3000`. 
4.  The relative path logic handles the backend redirection automatically!
