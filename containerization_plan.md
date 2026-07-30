# Implementation Plan - Hybrid Containerization (Native DB)

This plan outlines the steps to containerize the ArcVe services while maintaining a **Native PostgreSQL** instance as the single source of truth.

## 1. Backend Containerization (FastAPI)
- **Goal**: Create a lightweight Docker image for the backend.
- **Connectivity**: Configured to connect to the host's database via environment variables. In Docker Compose (Linux), we use `network_mode: host` to access `localhost:5432`.

## 2. Frontend Containerization (Next.js)
- **Goal**: Optimized production build.
- **Connectivity**: Connects to the backend API. Using `network_mode: host` allows it to find the backend on `localhost:8000`.

## 3. Local Orchestration (Docker Compose)
- **Configuration**:
    - **Removed** the `db` service from `docker-compose.yml`.
    - **Added** `network_mode: host` to both `backend` and `frontend`. This is the most efficient way to access native host services on Linux.
- **Usage**: Starts both services as containers while they interact with your native Postgres.

## 4. Kubernetes Planning (Local Machine)
- **External Database**:
    - Replaced the K8s DB Deployment with a custom `Service` and `Endpoints` object in `kubernetes/db.yaml`.
    - This allows the K8s-based backend to reach the native Postgres running on the host IP (commonly `172.17.0.1` on Docker bridge).
- **Service Discovery**: The backend in K8s will still use the DNS name `arcve-db`, which now resolves to the native host.

## 5. Script Management
- `run.sh --docker` now accurately reflects this "Native DB + Containerized Services" setup.
