# 🌱 CarbonCred

<div align="center">

**Decentralized Carbon Credit Marketplace with AI Verification**

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat&logo=ethereum)](https://ethereum.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13-FF6F00?style=flat&logo=tensorflow)](https://tensorflow.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Installation](#-installation)
  - [Option A — Manual Setup (Recommended for Dev)](#option-a--manual-setup-recommended-for-dev)
  - [Option B — Docker Setup](#option-b--docker-setup)
- [Running the Services](#-running-the-services)
- [API Reference](#-api-reference)
- [Frontend Pages & Components](#-frontend-pages--components)
- [ML Verification Module](#-ml-verification-module)
- [Blockchain Module](#-blockchain-module)
- [Useful Dev Commands](#-useful-dev-commands)
- [License](#-license)

---

## 🌍 Project Overview

**CarbonCred** is a full-stack platform for the Indian Carbon Credit Trading Scheme (CCTS). It lets green projects submit and earn verified carbon credits, organizations buy credits for compliance, and auditors verify projects using an AI-powered pipeline — all backed by Ethereum smart contracts.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 4.2, Django REST Framework, SimpleJWT |
| **Database** | PostgreSQL 16 |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Bootstrap 5 |
| **Blockchain** | Ethereum (Sepolia Testnet), Hardhat, web3.py |
| **ML / AI** | TensorFlow 2.13, UNet (vegetation), ResNet50 (solar) |
| **API Docs** | Swagger UI / ReDoc (drf-yasg) |
| **Containerisation** | Docker, Docker Compose |

---

## 📁 Project Structure

```
carboncred/
├── accounts/            # User auth, registration, JWT, profiles
├── analytics/           # Platform-wide & user analytics APIs
├── backend/             # Django project settings, URLs, WSGI/ASGI
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── blockchain/          # Ethereum smart contracts & deploy scripts
│   ├── contracts/
│   │   ├── CarbonCredToken.sol
│   │   └── IndianCarbonCredit.sol
│   ├── scripts/
│   └── hardhat.config.js
├── credits/             # Credit wallet, issuance, balance tracking
├── marketplace/         # Buy/sell listings and credit trading
├── ml-verification/     # AI verification pipeline
│   ├── src/
│   │   ├── models/      # UNet + ResNet50 model definitions
│   │   ├── train.py
│   │   └── verify.py
│   └── requirements.txt
├── projects/            # Project submission and management
├── transactions/        # Transaction history records
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── components/  # All UI pages and components
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
├── media/               # Uploaded project images
├── docker-compose.yml
├── manage.py
├── requirements.txt
└── .env.example
```

---

## 📋 Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.9+ |
| Node.js | 16.x+ |
| npm | 8.x+ |
| PostgreSQL | 13+ *(or use Docker)* |
| Docker & Docker Compose | Latest v2+ *(optional, for full stack)* |
| MetaMask | Browser extension *(for blockchain features)* |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `yourpassword` |
| `POSTGRES_DB` | Database name | `carboncred` |
| `POSTGRES_HOST` | DB host | `127.0.0.1` |
| `POSTGRES_PORT` | DB port | `5432` |
| `SECRET_KEY` | Django secret key | `your-secret-key` |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `ALCHEMY_URL` | Alchemy RPC endpoint (Sepolia) | `https://eth-sepolia.g.alchemy.com/v2/KEY` |
| `BLOCKCHAIN_PRIVATE_KEY` | Deployer wallet private key | `0x...` |
| `CONTRACT_ADDRESS` | Deployed contract address | `0x...` |
| `BLOCKCHAIN_CHAIN_ID` | Sepolia chain ID | `11155111` |
| `REACT_APP_API_URL` | Backend base URL for frontend | `http://127.0.0.1:8000` |
| `REACT_APP_CONTRACT_ADDRESS` | Contract address for frontend | `0x...` |

> ⚠️ **Never commit real private keys or secrets.** Keep `.env` in `.gitignore`.

---

## 🚀 Installation

### Option A — Manual Setup (Recommended for Dev)

#### 1. Clone the Repository

```bash
git clone https://github.com/Prathameshjain/carboncred.git
cd carboncred
```

#### 2. Backend Setup

```bash
# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and keys

# Apply database migrations
python manage.py migrate

# (Optional) Create a Django admin superuser
python manage.py createsuperuser
```

#### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install
```

#### 4. ML Verification Setup *(optional — only needed for training/verifying)*

```bash
cd ml-verification

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

#### 5. Blockchain Setup *(optional — only needed for contract work)*

```bash
cd blockchain

npm install

# Compile contracts
npx hardhat compile

# Deploy to Sepolia (ensure ALCHEMY_URL and BLOCKCHAIN_PRIVATE_KEY are set in .env)
npx hardhat run scripts/deploy.js --network sepolia
```

---

### Option B — Docker Setup

The `docker-compose.yml` spins up **5 services** in a single command:

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | `carboncred-postgres` | internal |
| pgAdmin 4 | `carboncred-pgadmin` | `5050` |
| ML Verification (TensorFlow/Flask) | `carboncred-ml` | internal `5001` |
| Django Backend (Gunicorn) | `carboncred-backend` | `8000` |
| React Frontend (Nginx) | `carboncred-frontend` | `80` |

#### 1. Copy the Docker Environment Template

```bash
cp .env.docker .env
# Optionally edit .env with your real blockchain keys
```

> ⚠️ `.env.docker` contains pre-configured defaults for Docker networking (e.g., `POSTGRES_HOST=db`). Do **not** use `.env.example` for Docker — the host values differ.

#### 2. Build & Start All Services

```bash
# Build images and start all 5 services in detached mode
docker compose up --build -d
```

> ⏱ **First build takes ~10–15 minutes** — TensorFlow + ML model checkpoints (~660 MB each) are baked into the ML image. Subsequent builds are fast thanks to Docker layer caching.

#### 3. Access the Running App

| Service | URL | Credentials |
|---------|-----|-------------|
| 🌐 Frontend (React) | http://localhost | — |
| ⚙️ Django API | http://localhost:8000/api/ | JWT token |
| 🔧 Django Admin | http://localhost/admin/ | superuser |
| 📊 Swagger Docs | http://localhost:8000/swagger/ | — |
| 🐘 pgAdmin | http://localhost:5050 | `nesar@carboncred.com` / `nesar` |

#### 4. Post-Start Commands

```bash
# Create Django superuser
docker compose exec backend python manage.py createsuperuser

# Run / re-run migrations manually
docker compose exec backend python manage.py migrate

# View live logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f ml-service

# Stop all services (keeps data volumes)
docker compose down

# Stop and delete all data volumes (fresh start)
docker compose down -v
```

#### Adding PostgreSQL in pgAdmin

1. Open http://localhost:5050 → login with `nesar@carboncred.com` / `nesar`
2. Click **Add New Server**
3. Fill in:
   - **Name:** `CarbonCred DB`
   - **Host:** `db`
   - **Port:** `5432`
   - **Database:** `carboncred`
   - **Username:** `postgres`
   - **Password:** `Postgre123`

---

## ▶️ Running the Services

### Manual (Dev) Mode

| Service | Command | URL |
|---------|---------|-----|
| **Backend** (Django) | `python manage.py runserver` | http://127.0.0.1:8000 |
| **Frontend** (Vite) | `cd frontend && npm run dev` | http://localhost:5173 |
| **Swagger Docs** | *(backend must be running)* | http://127.0.0.1:8000/swagger/ |
| **ReDoc** | *(backend must be running)* | http://127.0.0.1:8000/redoc/ |
| **Django Admin** | *(backend must be running)* | http://127.0.0.1:8000/admin/ |
| **PostgreSQL** | `docker compose up db -d` | `localhost:5432` |

> Both the backend and frontend dev servers support **hot reload** — changes take effect without restarting.

### Docker (Production) Mode

| Service | URL |
|---------|-----|
| 🌐 React Frontend (via Nginx) | http://localhost |
| ⚙️ Django API | http://localhost:8000/api/ |
| 🔧 Django Admin | http://localhost/admin/ |
| 📊 Swagger / ReDoc | http://localhost:8000/swagger/ |
| 🐘 pgAdmin | http://localhost:5050 |

> The Nginx container reverse-proxies `/api/`, `/admin/`, and `/media/` to the Django backend on port 8000.

---

## 📚 API Reference

All endpoints are prefixed with `/api/`. Full interactive docs available at `/swagger/` when `DEBUG=True`.

### Accounts (`/api/accounts/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accounts/register/` | POST | Register a new user |
| `/api/accounts/login/` | POST | Obtain JWT access & refresh tokens |
| `/api/accounts/refresh/` | POST | Refresh access token |
| `/api/accounts/profile/` | GET / PATCH | Get or update user profile |

### Projects (`/api/projects/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/` | GET / POST | List or submit a new project |
| `/api/projects/<id>/` | GET / PATCH | Get or update project details |
| `/api/projects/<id>/verify/` | POST | Trigger ML verification on a project |

### Credits (`/api/credits/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credits/wallet/` | GET | Get current user's credit balance |
| `/api/credits/issue/` | POST | Issue credits to a project (admin) |

### Marketplace (`/api/marketplace/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketplace/listings/` | GET / POST | View or create credit listings |
| `/api/marketplace/listings/<id>/buy/` | POST | Purchase a listing |

### Transactions (`/api/transactions/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions/` | GET | View transaction history for current user |

### Analytics (`/api/analytics/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/platform/` | GET | Platform-wide stats |
| `/api/analytics/user/` | GET | Per-user analytics |

---

## 🎨 Frontend Pages & Components

The frontend lives in `frontend/src/components/`. Key pages:

| Component | Route | Description |
|-----------|-------|-------------|
| `Home.jsx` | `/` | Landing page |
| `Registration.jsx` | `/register` | User sign-up |
| `Login.jsx` | `/login` | JWT login |
| `Dashboard.jsx` | `/dashboard` | Main user dashboard |
| `AddProject.jsx` | `/projects/add` | Submit a new carbon project |
| `ViewProjects.jsx` | `/projects` | Browse existing projects |
| `Marketplace.jsx` | `/marketplace` | Buy/sell credit listings |
| `Mycredits.jsx` | `/credits` | Credit wallet & history |
| `PurchaseHistory.jsx` | `/history` | Transaction history |
| `VerificationReport.jsx` | `/verification` | ML verification results |
| `UserAnalytics.jsx` | `/analytics/user` | User-level charts |
| `PlatformAnalytics.jsx` | `/analytics/platform` | Platform-wide charts |
| `Profile.jsx` | `/profile` | User profile management |

### Frontend Scripts

```bash
cd frontend

npm run dev       # Start dev server → http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## 🤖 ML Verification Module

Located in `ml-verification/`. Runs as a standalone Python service integrated into the Django backend via `projects/verification_service.py`.

### Supported Project Domains

The platform supports **6 project classification types**. Each maps to a distinct verification strategy:

| Classification | ML Type | Verification Approach | Key Inputs |
|---------------|---------|----------------------|------------|
| `VEGETATION` | `vegetation` | UNet image segmentation on NDVI satellite imagery | Satellite images, area (ha), claimed improvement % |
| `PLANTATION` | `vegetation` | Same as VEGETATION — UNet + NDVI pipeline | Tree count, avg DBH (mm), avg height (cm), species factor |
| `SOLAR` | `solar` | ResNet50 classification on RGB satellite imagery | Satellite images, energy generated (kWh), grid emission factor, efficiency % |
| `METHANE` | `methane` | Numeric-only formula (no image ML) | Biogas volume (m³/year), methane fraction %, plant capacity (kW) |
| `COOKSTOVE` | `cookstove` | Numeric-only formula (no image ML) | Stove count, wood saved (kg/stove/year), FNRB factor, emission factor, efficiency % |
| `WIND` | `wind` | Numeric-only formula (no image ML) | Wind energy generated (kWh), grid emission factor, turbine efficiency %, turbine count |

> `VEGETATION` and `PLANTATION` share the same ML pipeline. `METHANE`, `COOKSTOVE`, and `WIND` are **numeric-only** — they do not use image models; credits are calculated from domain-specific formulas.

### ML Models

| Model | Task | Input | Output |
|-------|------|-------|--------|
| **UNet** | Vegetation/plantation segmentation | NDVI images (256×256) | Binary vegetation mask |
| **ResNet50** | Solar site classification | RGB satellite images (256×256) | `no_site` / `construction` / `active` |

Model checkpoints are stored in `ml-verification/src/models/checkpoints/`:
- `vegetation_unet_best.keras`
- `solar_resnet_best.keras`

### Running the ML Service

```bash
cd ml-verification
source venv/bin/activate

# Train models
python src/train.py --task vegetation
python src/train.py --task solar

# Run verification on a project
python src/verify.py --project veg_001     # vegetation / plantation
python src/verify.py --project solar_001   # solar
```

### Verification Metrics

| Domain | Key Metrics |
|--------|------------|
| Vegetation / Plantation | IoU ~0.73, Dice ~0.83, Temporal Consistency ~0.98 |
| Solar | Solar probability score, estimated panel area (m²), avoided CO₂ (tCO₂/year) |
| Methane | CO₂ equivalent tonnes/year from biogas formula |
| Cookstove | Credits from wood-saved formula (FNRB-adjusted) |
| Wind | Avoided CO₂ from wind energy × grid emission factor |

### Verification Decision Flow

1. Project submitted → classification stored in Django `Project` model
2. `/api/projects/<id>/verify/` triggered → `ProjectVerificationService.verify_project()` called
3. For **image domains** (vegetation, solar): images processed → ML inference runs
4. For **numeric domains** (methane, cookstove, wind): formula-based calculation only
5. Result saved as JSON report in `media/reports/<report_id>.json`
6. Django model updated with `final_decision`, `confidence_score`, `estimated_co2_tco2_year`, and domain-specific fields

---

## ⛓️ Blockchain Module

Located in `blockchain/`. Uses **Hardhat** + **web3.py**.

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `IndianCarbonCredit.sol` | Main CCTS contract |
| `CarbonCredToken.sol` | ERC-20 carbon credit token |

### Network

- **Testnet:** Ethereum Sepolia (`chainId: 11155111`)
- **RPC:** Alchemy (`ALCHEMY_URL` in `.env`)

```bash
cd blockchain

npm install

# Compile
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

After deploying, copy the output contract address into `.env` as `CONTRACT_ADDRESS` and `REACT_APP_CONTRACT_ADDRESS`.

---

## 💻 Useful Dev Commands

### Backend

```bash
source .venv/bin/activate

python manage.py runserver            # Start dev server
python manage.py migrate              # Apply migrations
python manage.py makemigrations       # Generate new migrations
python manage.py createsuperuser      # Create admin user
python manage.py shell                # Open Django shell
```

### Docker

```bash
# Build and start all 5 services
docker compose up --build -d

# Start only the DB (useful for local dev)
docker compose up db -d

# Rebuild a single service after code changes
docker compose up --build backend -d

# Stop all services (data volumes preserved)
docker compose down

# Stop and delete all volumes (fresh start)
docker compose down -v

# Follow logs
docker compose logs -f                            # All services
docker compose logs -f backend                    # Backend only
docker compose logs -f ml-service                 # ML service only
docker compose logs -f frontend                   # Nginx/frontend only

# Run Django management commands inside the container
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell

# Restart a single service without full rebuild
docker compose restart backend
```

### Frontend

```bash
cd frontend
npm install          # Install / update packages
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # Lint check
```

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for a greener India 🌱**

© 2025–2026 Nesar Wagannawar , Prathamesh Jain , Aaditya Cholle , Suhani Shah

</div>
