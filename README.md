# CarbonCred

CarbonCred is a decentralized carbon credit marketplace. It enables transparent, secure, and efficient trading of carbon credits using Django, Django REST Framework, and PostgreSQL (via Docker). The project is modular, with Django apps for user accounts, project management, and carbon credits.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Docker Usage](#docker-usage)
- [API Endpoints](#api-endpoints)
- [Development Commands](#development-commands)
- [License](#license)

---

## Features
- User registration and JWT authentication (REST API)
- Modular Django apps: `accounts`, `projects`, `credits`
- PostgreSQL database (via Docker)
- CORS support for frontend integration
- Secure password handling and token-based login

---

## Project Structure
```
accounts/         # User registration, authentication, and management
credits/          # Carbon credit models and logic
projects/         # Project management for carbon credit generation
backend/          # Django project settings and configuration
manage.py         # Django management script
docker-compose.yml # Docker setup for PostgreSQL
.env.example      # Example environment variables
README.md         # Project documentation
```

---


## Setup & Installation

### Prerequisites
- Python 3.9+
- PostgreSQL (local or via Docker)
- Docker & Docker Compose (optional, for containerized DB)

### 1. Clone the repository
```sh
git clone <repo-url>
cd <project-directory>
```

### 2. Set up environment variables
- Copy `.env.example` to `.env` and update values as needed for your local or Docker PostgreSQL setup.

### 3. Set up PostgreSQL

#### Option A: Local PostgreSQL
1. Make sure PostgreSQL is running on your machine.
2. Create the database:
   ```sh
   psql -U <your_postgres_user> -c "CREATE DATABASE carboncred;"
   ```
3. Update `.env` with your local DB credentials (host: 127.0.0.1, port: 5432).

#### Option B: Docker PostgreSQL
1. Start the database:
   ```sh
   docker-compose up -d
   ```
2. Update `.env` with Docker DB credentials if different.

### 4. Create and activate a Python virtual environment
#### macOS/Linux:
```sh
python3 -m venv venv
source venv/bin/activate
```
#### Windows:
```sh
python -m venv venv
.\venv\Scripts\activate
```

### 5. Install dependencies
```sh
pip install -r requirements.txt
```

### 6. Apply migrations
```sh
python manage.py migrate
```

### 7. Run the development server
```sh
python manage.py runserver
```

---

---

## Environment Variables
See `.env.example` for all required environment variables:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

Example for local Docker setup:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Postgre123
POSTGRES_DB=carboncred
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

---

## Docker Usage
- Start the database: `docker-compose up -d`
- Stop the database: `docker-compose down`

---


## API Endpoints & Documentation

### Main Endpoints
- `POST /api/accounts/register/` — Register a new user
- `POST /api/accounts/login/` — Obtain JWT token
- `POST /api/accounts/refresh/` — Refresh JWT token

### API Documentation (Swagger & Redoc)
- Swagger UI: [http://127.0.0.1:8000/swagger/](http://127.0.0.1:8000/swagger/)
- Redoc: [http://127.0.0.1:8000/redoc/](http://127.0.0.1:8000/redoc/)

#### Importing to Postman
1. Open Swagger UI at `/swagger/`.
2. Click "Download" or "Export" to get the OpenAPI JSON.
3. In Postman, click "Import" and select the OpenAPI file or paste the URL (e.g., `http://127.0.0.1:8000/swagger.json`).
4. All endpoints will be imported for testing.

---


## Development Commands
- Activate virtual environment (macOS/Linux):
   ```sh
   source venv/bin/activate
   ```
- Activate virtual environment (Windows):
   ```sh
   .\venv\Scripts\activate
   ```
- Run Docker Compose for PostgreSQL:
   ```sh
   docker-compose up -d
   ```
- Run Django migrations:
   ```sh
   python manage.py migrate
   ```
- Start Django server:
   ```sh
   python manage.py runserver
   ```

---

## License
MIT License © 2025 Prathameshjain

---

---

## Requirements

Key Python dependencies (see `requirements.txt`):
- Django
- djangorestframework
- django-environ
- djangorestframework-simplejwt
- django-cors-headers
- psycopg2
- drf-yasg

---
For more details, see the project documentation and code comments.
