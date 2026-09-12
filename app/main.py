from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database_items
from app.routers import auth_router, quest_router, character_router, shop_router, boss_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed shop items if not already present
with SessionLocal() as db:
    seed_database_items(db)

app = FastAPI(
    title="Life RPG API",
    description="Full-stack RPG Progression & Task Gamification Platform",
    version="1.0.0"
)

# CORS middleware for cross-origin flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router.router)
app.include_router(quest_router.router)
app.include_router(character_router.router)
app.include_router(shop_router.router)
app.include_router(boss_router.router)

# Mount static files
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Life RPG API is running. Access /docs for API documentation."}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "life-rpg-backend", "version": "1.0.0"}
