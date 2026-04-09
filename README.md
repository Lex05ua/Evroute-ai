# ⚡ EVRoute AI — EV Route Planner

> AI-powered electric vehicle route planning with real-time charging station availability.  
> Diploma project — Slovak University of Technology, 2025.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?style=flat&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## 📸 Screenshots

| Landing Page | Route Planner | Results |
|---|---|---|
| ![landing](docs/screenshots/landing.png) | ![planner](docs/screenshots/planner.png) | ![result](docs/screenshots/result.png) |

---

## 🗺️ Overview

EVRoute AI solves a real problem for electric vehicle drivers: **range anxiety**. The app calculates the optimal route between two cities, finds the best charging stations along the way, simulates battery consumption for each segment, and provides a smart recommendation — all in a single API call.

### Key Features

- 🔐 **JWT Authentication** — secure register/login with bcrypt password hashing
- 🗺️ **Smart Route Planning** — geocoding + turn-by-turn directions via OpenRouteService
- ⚡ **Charging Station Search** — real stations from OpenChargeMap (400k+ locations worldwide)
- 🔋 **Battery Simulation** — calculates charge/discharge for each route segment
- 🤖 **AI Recommendation** — context-aware route analysis and advice
- 📋 **Trip History** — all planned routes saved and accessible
- 👤 **User Profile** — vehicle settings that affect all calculations

---

## 🏗️ Architecture

```
┌─────────────────┐        HTTP/JSON        ┌──────────────────────────┐
│                 │  ─────────────────────▶  │                          │
│  React Frontend │                          │   FastAPI Backend        │
│  (Vite + JSX)   │  ◀─────────────────────  │   (Python 3.11+)         │
│                 │                          │                          │
└─────────────────┘                          └──────────┬───────────────┘
                                                        │
                                         ┌──────────────┼──────────────┐
                                         │              │              │
                                   ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐
                                   │  SQLite  │  │  OpenRoute│  │  OpenCharge
                                   │    DB    │  │  Service  │  │    Map   │
                                   └──────────┘  └──────────┘  └──────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115 | REST API framework |
| **Uvicorn** | 0.32 | ASGI server |
| **SQLAlchemy** | 2.0 | ORM (async) |
| **aiosqlite** | 0.20 | Async SQLite driver |
| **python-jose** | 3.3 | JWT token generation |
| **passlib + bcrypt** | 1.7 | Password hashing |
| **httpx** | 0.28 | Async HTTP client |
| **Pydantic** | 2.10 | Data validation & schemas |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **Vite** | 7 | Build tool & dev server |
| **React Router** | 7 | Client-side routing |
| **CSS Modules** | — | Scoped styling |

### External APIs (all free tier)
| API | Usage |
|---|---|
| **OpenRouteService** | Geocoding + routing + turn-by-turn directions |
| **OpenChargeMap** | 400k+ charging stations worldwide |

---

## 📁 Project Structure

```
evroute/
├── evroute-backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings from .env
│   │   │   ├── database.py        # SQLAlchemy async engine
│   │   │   └── security.py        # JWT + bcrypt
│   │   ├── models/
│   │   │   ├── user.py            # User DB model
│   │   │   └── route.py           # Route DB model
│   │   ├── schemas/
│   │   │   ├── auth.py            # Auth request/response schemas
│   │   │   └── route.py           # Route schemas
│   │   ├── services/
│   │   │   ├── routing.py         # OpenRouteService integration
│   │   │   ├── charging.py        # OpenChargeMap integration
│   │   │   ├── planner.py         # Core route planning logic
│   │   │   └── ai_recommendation.py # Smart recommendation engine
│   │   ├── routers/
│   │   │   ├── auth.py            # /api/auth/*
│   │   │   ├── routes.py          # /api/routes/*
│   │   │   ├── stations.py        # /api/stations/*
│   │   │   └── geocode.py         # /api/geocode/*
│   │   └── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── start.sh
│
└── evroute-frontend/
    ├── src/
    │   ├── api.js                 # All backend API calls
    │   ├── AuthContext.jsx        # Global auth state (React Context)
    │   ├── App.jsx                # Router + protected routes
    │   ├── components/
    │   │   └── Header.jsx
    │   └── pages/
    │       ├── LandingPage.jsx
    │       ├── AuthPages.jsx      # Login + Signup
    │       ├── PlannerPage.jsx    # Route input form
    │       ├── ResultPage.jsx     # Route results
    │       ├── FullRoutePage.jsx  # Turn-by-turn details
    │       ├── HistoryPage.jsx    # Trip history
    │       └── ProfilePage.jsx    # User profile & vehicle
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Free API keys (see below)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/evroute-ai.git
cd evroute-ai
```

### 2. Get free API keys

| Service | Sign up | Free tier |
|---|---|---|
| **OpenRouteService** | [openrouteservice.org](https://openrouteservice.org/dev/#/signup) | 2,000 req/day |
| **OpenChargeMap** | [openchargemap.org](https://openchargemap.org/site/develop/api) | Unlimited |

### 3. Configure the backend

```bash
cd evroute-backend
cp .env.example .env
```

Edit `.env`:
```env
SECRET_KEY=your-random-secret-string-min-32-chars
DATABASE_URL=sqlite+aiosqlite:///./evroute.db
OPENCHARGEMAP_API_KEY=your_key_here
OPENROUTESERVICE_API_KEY=your_key_here
FRONTEND_URL=http://localhost:5173
```

### 4. Run the backend

```bash
cd evroute-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

### 5. Run the frontend

```bash
cd evroute-frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login/json` | Login → returns JWT token |
| `GET` | `/api/auth/me` | Get current user profile |
| `PATCH` | `/api/auth/me` | Update profile / vehicle settings |

### Route Planning
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/routes/plan` | Plan route (auth required, saved to history) |
| `POST` | `/api/routes/plan/guest` | Plan route without account |
| `GET` | `/api/routes/history` | Get trip history |
| `GET` | `/api/routes/history/{id}` | Get route details |
| `PATCH` | `/api/routes/history/{id}/complete` | Mark trip as completed |
| `DELETE` | `/api/routes/history/{id}` | Delete from history |

### Charging Stations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stations/nearby` | Stations near a point `?lat=&lon=&radius_km=` |
| `GET` | `/api/stations/bbox` | Stations in bounding box |

### Example request

```bash
curl -X POST http://localhost:8000/api/routes/plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Bratislava",
    "destination": "Vienna",
    "battery_level_pct": 80,
    "vehicle_model": "Tesla Model 3",
    "battery_capacity_kwh": 75,
    "efficiency_wh_per_km": 180
  }'
```

---

## ⚙️ How the Route Planner Works

```
1. Geocode        "Bratislava" → (48.1486, 17.1077)
2. Get Route      OpenRouteService → distance, duration, geometry
3. Fetch Stations OpenChargeMap → stations within 15km of route
4. Select Stops   Greedy algorithm → minimum stops to complete trip safely
5. Simulate       Battery charge/discharge for each segment
6. Recommend      Generate context-aware recommendation text
7. Save           Store result in SQLite for history
```

**Battery simulation formula:**
```
consumed_kWh = distance_km × efficiency_Wh_per_km / 1000
charge_time_min = energy_needed_kWh / station_power_kW × 60
```

The planner always charges to **80%** at each stop — this is optimal because charging from 80%→100% takes 3× longer due to battery chemistry.

---

## 🔒 Security

- Passwords hashed with **bcrypt** (never stored in plain text)
- Authentication via **JWT tokens** (HS256, 60-minute expiry)
- CORS configured to allow only the frontend origin
- `.env` file excluded from version control via `.gitignore`

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Your Name**  
Bachelor's Diploma Project — Department of Computer Science  
Slovak University of Technology, Bratislava — 2025

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/YOUR_USERNAME)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/YOUR_USERNAME)
