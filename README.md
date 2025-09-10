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
- Python 3.10+
- Docker & Docker Compose
- Node.js (for frontend, if applicable)

### 1. Clone the repository
```sh
git clone <repo-url>
cd <project-directory>
```

### 2. Set up environment variables
- Copy `.env.example` to `.env` and update values as needed.

### 3. Start PostgreSQL with Docker Compose
```sh
docker-compose up -d
```

### 4. Create and activate a Python virtual environment
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

## API Endpoints
- `POST /api/accounts/register/` — Register a new user
- `POST /api/accounts/login/` — Obtain JWT token
- `POST /api/accounts/refresh/` — Refresh JWT token

---

## Development Commands
- Activate virtual environment:
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
For more details, see the project documentation and code comments.
