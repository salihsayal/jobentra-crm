# Jobentra CRM

Containerized CRM with 4 services: Next.js frontend, Java Spring Boot backend, Python FastAPI AI service, and PostgreSQL.

## Architecture

```
Browser (localhost:3000) ──► Frontend (Next.js) ──► Backend (Spring Boot) ──► PostgreSQL (5432)
                                   │                       │
                                   │                       └──► AI Service (FastAPI)
                                   │
                        Next.js API routes proxy    Backend is the central hub.
                        to backend. Frontend & AI   Frontend and AI Service never
                        never touch the DB.         talk to the database directly.
```

## Quick Start

```bash
docker compose up --build -d
```

First start seeds 5 sample customers into the database.

## Usage

### 1. Web UI (Recommended)

Open **http://localhost:3000** and log in:

```
Email:    admin@jobentra.com
Password: admin123
```

You'll see the customer dashboard with seeded data.

### 2. API (curl)

```bash
# Check backend health
curl http://localhost:8080/health

# Login and save cookie
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jobentra.com","password":"admin123"}'

# Fetch customers with saved cookie
curl -b cookies.txt http://localhost:8080/api/customers

# Check AI service
curl http://localhost:8000/health
```

### 3. VS Code Dev Container

Open the project in VS Code with the Dev Containers extension installed. VS Code will prompt to reopen in container — this gives you a pre-configured dev environment with all extensions.

## Services & Ports

| Service    | URL                     | Description              |
|------------|-------------------------|--------------------------|
| Frontend   | http://localhost:3000   | Next.js + Tailwind CSS   |
| Backend    | http://localhost:8080   | Spring Boot REST API     |
| AI Service | http://localhost:8000   | FastAPI (PDF generation) |
| Database   | localhost:5432          | PostgreSQL 15            |

## API Endpoints

### Backend

| Method | Path               | Auth   | Description                    |
|--------|--------------------|--------|--------------------------------|
| GET    | `/health`          | Public | Health check                   |
| POST   | `/api/auth/login`  | Public | Login, returns JWT as cookie   |
| GET    | `/api/customers`   | JWT    | List all customers             |

### AI Service

| Method | Path            | Auth    | Description        |
|--------|-----------------|---------|--------------------|
| GET    | `/health`       | Public  | Health check       |
| POST   | `/generate-pdf` | API Key | Mock PDF URL       |

## Auth Flow

1. Login form → Next.js proxies `POST /api/auth/login` to backend
2. Backend validates, sets `token` as httpOnly cookie
3. All subsequent calls include the cookie automatically
4. Dashboard SSR forwards cookie to `GET /api/customers`

## Project Layout

```
jobentra-crm/
├── docker-compose.yml
├── .devcontainer/devcontainer.json
├── .gitignore
├── README.md
├── backend/                 # Java Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/jobentra/crm/
├── frontend/                # Next.js + Tailwind
│   ├── Dockerfile
│   ├── package.json
│   └── src/pages/
└── ai-service/              # Python FastAPI
    ├── Dockerfile
    ├── requirements.txt
    └── app/main.py
```

## Stop / Cleanup

```bash
docker compose down           # stop, keep data
docker compose down -v        # stop and wipe database
```

## Rebuild a Single Service

```bash
docker compose up --build -d backend
```

All services share the `jobentra-network` Docker network and resolve each other by service name (`postgres`, `backend`, `ai-service`, `frontend`).
