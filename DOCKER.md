# 🐳 CarbonCred — Docker Deployment Guide

## Quick Start (Run on any machine)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- At least **5 GB free disk space** (ML models are ~660 MB each)

---

## 1. Setup Environment

```bash
# Copy the Docker env template
cp .env.docker .env

# (Optional) Edit .env with your real blockchain keys
nano .env
```

---

## 2. Build & Run All Services

```bash
docker compose up --build -d
```

> **First build takes ~10–15 minutes** (TensorFlow + ML models are large).  
> Subsequent builds are fast due to Docker layer caching.

---

## 3. Access the App

| Service | URL | Credentials |
|---|---|---|
| 🌐 **Frontend (React app)** | http://localhost | — |
| ⚙️ **Django API** | http://localhost:8000/api/ | JWT token |
| 🔧 **Django Admin** | http://localhost/admin/ | superuser |
| 🐘 **pgAdmin** | http://localhost:5050 | `nesar` / `nesar` |

### Adding PostgreSQL to pgAdmin
1. Open http://localhost:5050 → Login: `nesar@carboncred.com` / `nesar`
2. Click **"Add New Server"**
3. Fill in:
   - **Name:** `CarbonCred DB`
   - **Host:** `db`
   - **Port:** `5432`
   - **Database:** `carboncred`
   - **Username:** `postgres`
   - **Password:** `Postgre123`

---

## 4. Create Django Superuser (Optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

---

## 5. Stop / Restart

```bash
# Stop all containers
docker compose down

# Stop and DELETE all data (fresh start)
docker compose down -v

# Restart a single service
docker compose restart backend
```

---

## Service Architecture

```
Browser
  │
  ├── :80    → Nginx (serves React SPA)
  │             ├── /api/    → Django backend:8000
  │             ├── /admin/  → Django backend:8000
  │             └── /media/  → Django backend:8000
  │
  ├── :8000  → Django backend (direct access)
  ├── :5050  → pgAdmin
  │
  └── Internal network (carboncred-network):
        db:5432          (PostgreSQL)
        ml-service:5001  (TensorFlow ML API)
```

---

## Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f ml-service
docker compose logs -f frontend
```

---

## Troubleshooting

**Backend fails to start?**
```bash
docker compose logs backend
# Usually a DB connection issue — wait 30s and retry
```

**ML service slow to start?**  
Normal — TensorFlow model loading takes 60–90 sec on first start.

**Port already in use?**  
Change port mapping in `docker-compose.yml`, e.g., `"8080:80"` for the frontend.
