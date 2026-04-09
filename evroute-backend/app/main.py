from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, routes, stations, geocode


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## EVRoute AI Backend

AI-powered EV route planning API with:
- 🔐 JWT Authentication (register/login)
- 🗺️ Route planning with OpenRouteService
- ⚡ Charging stations via OpenChargeMap
- 🤖 AI recommendations via Claude (Anthropic)
- 📋 Trip history (SQLite)

### Quick Start
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login/json`
3. Plan route: `POST /api/routes/plan` (with Bearer token)
""",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(routes.router)
app.include_router(stations.router)
app.include_router(geocode.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
