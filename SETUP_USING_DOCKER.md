# CarbonCred — Docker Setup Guide

> **For team members & users:** You only need two files to run CarbonCred on any machine — `docker-compose.yml` and a `.env` file. No source code, no Git, no Python, no Node.js required.

---

## Prerequisites

Install **Docker Desktop** only — that's it.

| Platform | Download |
|----------|----------|
| macOS | https://docs.docker.com/desktop/install/mac-install/ |
| Windows | https://docs.docker.com/desktop/install/windows-install/ |
| Linux | https://docs.docker.com/desktop/install/linux-install/ |

> After installing, make sure Docker Desktop is **running** before proceeding.

---

## Files You Need

You should have received (or can download) these two files:

```
carboncred/
├── docker-compose.yml   ← orchestrates all 5 services
└── .env                 ← environment config (create from template below)
```

Place both files in the **same folder** on your machine.

---

## Step 1 — Create Your `.env` File

In the same folder as `docker-compose.yml`, create a file named `.env` and paste the following:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Postgre123
POSTGRES_DB=carboncred

# Django
DJANGO_SECRET_KEY=django-insecure-change-me-in-production
DJANGO_DEBUG=False

# Blockchain (optional — app works without these)
ALCHEMY_URL=
BLOCKCHAIN_PRIVATE_KEY=
CONTRACT_ADDRESS=
BLOCKCHAIN_CHAIN_ID=11155111
```

> ⚠️ If you have real blockchain keys (Alchemy URL, private key, contract address), fill them in above. Otherwise leave them blank — the app runs fine without them.

---

## Step 2 — Start the App

Open a terminal, navigate to the folder containing both files, and run:

```bash
docker compose up -d
```

**First run:** Docker will automatically pull all images from Docker Hub (`nesaw/carbon-backend`, `nesaw/carbon-frontend`, `nesaw/carbon-ml`). This takes **5–10 minutes** depending on your internet speed.

**Subsequent runs:** Starts in under 30 seconds — images are already downloaded.

---

## Step 3 — Access the App

Once all containers are running, open your browser:

| Service | URL | Credentials |
|---------|-----|-------------|
| 🌱 CarbonCred App | http://localhost | — |
| ⚙️ Django REST API | http://localhost:8000/api/ | JWT token |
| 🔧 Django Admin | http://localhost/admin/ | superuser (see below) |
| 📊 API Docs (Swagger) | http://localhost:8000/swagger/ | — |
| 🐘 pgAdmin (DB GUI) | http://localhost:5050 | `nesar@carboncred.com` / `nesar` |

---

## 👤 Step 4 — Create Admin User (First Time Only)

```bash
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password for the Django admin panel.

---

## Daily Usage Commands

```bash
# Start the project
docker compose up -d

# Stop the project (data is preserved)
docker compose down

# View live logs (all services)
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f ml-service
docker compose logs -f frontend

# Restart a single service
docker compose restart backend
```

---

## Connect pgAdmin to the Database (Optional)

1. Open http://localhost:5050
2. Login: `nesar@carboncred.com` / `nesar`
3. Click **Add New Server** and fill in:

| Field | Value |
|-------|-------|
| Name | `CarbonCred DB` |
| Host | `db` |
| Port | `5432` |
| Database | `carboncred` |
| Username | `postgres` |
| Password | `Postgre123` |

---

## Updating to a Newer Version

When the team pushes updated images to Docker Hub:

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d
```

---

## Fresh Start (Wipe All Data)

> ⚠️ This deletes your database and all uploaded files permanently.

```bash
docker compose down -v
docker compose up -d
```

---

## Troubleshooting

**Port 80 already in use?**
Edit `docker-compose.yml` and change `"80:80"` to `"8080:80"` under the `frontend` service, then access the app at http://localhost:8080.

**Port 8000 already in use?**
Change `"8000:8000"` to `"8001:8000"` under the `backend` service.

**Containers not starting?**
```bash
docker compose logs -f
```
Check the output for error messages.

**ML service taking too long?**
The ML service takes up to 90 seconds to initialize on first start (TensorFlow loading). This is normal — wait for the backend to report healthy before using verification features.

**Need to re-run database migrations?**
```bash
docker compose exec backend python manage.py migrate
```

---

## What's Running Inside Docker

| Container | Image | Purpose |
|-----------|-------|---------|
| `carboncred-postgres` | `postgres:16-alpine` | PostgreSQL database |
| `carboncred-pgadmin` | `dpage/pgadmin4` | Database management GUI |
| `carboncred-ml` | `nesaw/carbon-ml:latest` | TensorFlow ML verification service |
| `carboncred-backend` | `nesaw/carbon-backend:latest` | Django REST API (Gunicorn) |
| `carboncred-frontend` | `nesaw/carbon-frontend:latest` | React app served via Nginx |

---

<div align="center">

**Built with ❤️ for a greener India 🌱**

© 2025–2026 Nesar Wagannawar, Prathamesh Jain, Aaditya Cholle, Suhani Shah

</div>
