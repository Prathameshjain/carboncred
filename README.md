# 🌱 CarbonCred

<div align="center">

![CarbonCred Logo](https://img.shields.io/badge/🌍-CarbonCred-green?style=for-the-badge)

**Decentralized Carbon Credit Marketplace with AI Verification**

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat&logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat&logo=ethereum)](https://ethereum.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13-FF6F00?style=flat&logo=tensorflow)](https://tensorflow.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Docker Setup](#-docker-setup)
- [API Documentation](#-api-documentation)
- [Frontend](#-frontend)
- [Blockchain](#-blockchain)
- [ML Verification](#-ml-verification)
- [Development Commands](#-development-commands)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌍 Overview

**CarbonCred** is a comprehensive decentralized carbon credit marketplace built for the Indian Carbon Credit Trading Scheme (CCTS). It enables transparent, secure, and efficient trading of carbon credits using blockchain technology with AI-powered verification.

The platform allows:
- 🌳 **Green Projects** to submit projects and earn verified carbon credits
- 🏭 **Organizations** to purchase credits for compliance
- 🔍 **Auditors** to verify projects using ML-powered analysis
- 💱 **Marketplace** for peer-to-peer credit trading

---

## ✨ Features

### Core Features
- ✅ User registration and JWT authentication
- ✅ Project submission with image uploads
- ✅ AI-powered vegetation and solar project verification
- ✅ Carbon credit issuance and tracking
- ✅ Peer-to-peer marketplace for credit trading
- ✅ Blockchain-based credit minting (ERC-20 tokens)
- ✅ Transaction history and portfolio management

### Technical Features
- 🔐 Secure JWT-based authentication
- 📊 Comprehensive REST API with Swagger documentation
- 🎨 Modern React UI with Tailwind CSS
- ⛓️ Ethereum smart contracts (Sepolia Testnet)
- 🤖 TensorFlow ML models for project verification
- 🐳 Docker-ready deployment
- 📱 Responsive design for mobile and desktop

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CarbonCred Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │    │   Backend    │    │   ML Verification    │  │
│  │  React/Vite  │◄──►│  Django DRF  │◄──►│  TensorFlow/Keras    │  │
│  │  Tailwind    │    │  PostgreSQL  │    │  UNet + ResNet       │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                                        │
│         │                   ▼                                        │
│         │            ┌──────────────┐                               │
│         └───────────►│  Blockchain  │                               │
│                      │  Ethereum    │                               │
│                      │  Sepolia     │                               │
│                      └──────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
carboncred/
├── accounts/              # User authentication & profiles
├── backend/               # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── blockchain/            # Ethereum smart contracts
│   ├── contracts/
│   │   ├── CarbonCredToken.sol
│   │   └── IndianCarbonCredit.sol
│   ├── scripts/
│   └── hardhat.config.js
├── credits/               # Carbon credit models & wallet
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
├── marketplace/           # Credit trading marketplace
├── ml-verification/       # ML verification pipeline
│   ├── src/
│   │   ├── models/
│   │   ├── train.py
│   │   └── verify.py
│   └── requirements.txt
├── projects/              # Project management
├── transactions/          # Transaction history
├── media/                 # Uploaded files
├── docker-compose.yml     # Docker configuration
├── manage.py              # Django management
├── requirements.txt       # Python dependencies
├── LICENSE                # MIT License
└── README.md              # This file
```

---

## 📋 Prerequisites

- **Python** 3.9+
- **Node.js** 16.x+
- **PostgreSQL** 13+ (local or Docker)
- **Docker & Docker Compose** (recommended)
- **MetaMask** browser extension (for blockchain)

---

## 🚀 Installation

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/Prathameshjain/carboncred.git
cd carboncred

# 2. Copy environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend python manage.py migrate

# 5. Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

### Manual Installation

#### Backend Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start PostgreSQL (via Docker or local)
docker-compose up -d db

# 4. Apply migrations
python manage.py migrate

# 5. Start development server
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Blockchain Setup

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Sepolia (requires .env configuration)
npx hardhat run scripts/deploy.js --network sepolia
```

#### ML Verification Setup

```bash
cd ml-verification

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train models (optional - pre-trained models available)
cd src
python train.py --task vegetation
python train.py --task solar
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=carboncred
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432

# Blockchain Configuration (Sepolia Testnet)
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
BLOCKCHAIN_PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
BLOCKCHAIN_CHAIN_ID=11155111

# Django Settings (production)
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## 🐳 Docker Setup

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Django | 8000 | Backend API |
| React | 5173 | Frontend |

---

## 📚 API Documentation

Once the backend is running, access the API docs:

- **Swagger UI**: http://127.0.0.1:8000/swagger/
- **ReDoc**: http://127.0.0.1:8000/redoc/

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accounts/register/` | POST | User registration |
| `/api/accounts/login/` | POST | JWT token login |
| `/api/accounts/refresh/` | POST | Refresh JWT token |
| `/api/projects/` | GET/POST | List/Create projects |
| `/api/credits/wallet/` | GET | User's credit wallet |
| `/api/marketplace/listings/` | GET/POST | Marketplace listings |
| `/api/transactions/` | GET | Transaction history |

---

## 🎨 Frontend

The frontend is built with:
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - API client

### Available Scripts

```bash
cd frontend

npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

---

## ⛓️ Blockchain

### Smart Contracts

1. **IndianCarbonCredit.sol** - Main contract for the Indian Carbon Credit Trading Scheme
2. **CarbonCredToken.sol** - ERC-20 token for carbon credits

### Network Configuration

The contracts are deployed on **Sepolia Testnet**:
- Chain ID: 11155111
- RPC: Alchemy or Infura

### Testing Flow

1. **Auditor** submits industry/forestry data
2. **Organization** views compliance status, posts buy requests
3. **Green Project** fulfills requests, transfers credits
4. **Organization** retires credits for compliance

---

## 🤖 ML Verification

### Models

| Model | Task | Input | Output |
|-------|------|-------|--------|
| UNet | Vegetation Segmentation | NDVI images (256×256) | Binary mask |
| ResNet50 | Solar Classification | RGB images (256×256) | 3-class (no_site, construction, active) |

### Verification Flow

```bash
cd ml-verification/src

# Verify a vegetation project
python verify.py --project veg_001

# Verify a solar project
python verify.py --project solar_001
```

### Metrics

- **Vegetation**: IoU (~0.73), Dice (~0.83), Temporal Consistency (~0.98)
- **Solar**: Accuracy improves with training epochs

---

## 💻 Development Commands

### Backend

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create migrations
python manage.py makemigrations

# Start server
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend python manage.py migrate
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact

For questions or support, please open an issue in the repository.

---

<div align="center">

**Built with ❤️ for a greener India 🌱**

© 2025-2026 Prathameshjain

</div>
