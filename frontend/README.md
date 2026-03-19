# CarbonCred Frontend

React 19 + Vite 7 application for the CarbonCred platform.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 16.x+ |
| npm | 8.x+ |

---

## Installation

```bash
# From the project root
cd frontend

npm install
```

---

## Environment

The frontend reads the backend URL from the root `.env` file. Ensure these are set:

```env
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
REACT_APP_SEPOLIA_CHAIN_ID=11155111
```

The Vite dev server proxies `/api` requests to the backend. See `vite.config.js` for proxy configuration.

---

## Running the Dev Server

```bash
npm run dev
```

Runs at **http://localhost:5173** with hot module replacement (HMR).

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server → http://localhost:5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across all source files |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.1.1 | UI framework |
| `react-router-dom` | ^7.8.2 | Client-side routing |
| `axios` | ^1.11.0 | HTTP client for API calls |
| `tailwindcss` | ^4.1.17 | Utility-first CSS framework |
| `bootstrap` | ^5.3.8 | UI components |
| `framer-motion` | ^12.23.24 | Animations & transitions |
| `recharts` | ^3.6.0 | Data visualization charts |
| `lucide-react` | ^0.542.0 | Icon set |
| `jspdf` | ^4.0.0 | PDF export (verification reports) |
| `@radix-ui/*` | various | Accessible UI primitives (dialog, tooltip, etc.) |

---

## Pages & Components

| Component | Description |
|-----------|-------------|
| `Home.jsx` | Public landing page |
| `Registration.jsx` | User registration form |
| `Login.jsx` | JWT login |
| `Dashboard.jsx` | Authenticated user dashboard |
| `AddProject.jsx` | Submit a new carbon credit project |
| `ViewProjects.jsx` | Browse and manage projects |
| `Marketplace.jsx` | Buy/sell credit listings |
| `Mycredits.jsx` | Credit wallet, balances and transfer |
| `PurchaseHistory.jsx` | Transaction history |
| `VerificationReport.jsx` | ML verification results viewer |
| `UserAnalytics.jsx` | Per-user analytics charts |
| `PlatformAnalytics.jsx` | Platform-wide analytics |
| `Profile.jsx` | User profile management |
| `ProtectedRoute.jsx` | Route guard (requires JWT) |
| `Navbar.jsx` | Top navigation bar |

---

## Project Layout

```
frontend/
├── src/
│   ├── components/        # All pages and UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility helpers
│   ├── App.jsx            # Root component with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html
├── vite.config.js
├── package.json
└── eslint.config.js
```

---

## Backend Dependency

The frontend requires the Django backend to be running for all API features.

```bash
# From the project root
source .venv/bin/activate
python manage.py runserver
```

API base: `http://127.0.0.1:8000` — see the root [README](../README.md) for full setup.
