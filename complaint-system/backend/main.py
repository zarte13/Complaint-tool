from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database.database import engine
from app.models import models
from app.api import companies, parts, complaints, analytics, follow_up_actions, responsibles, settings
from app.auth import router as auth_router  # NEW
import os

# Create database tables for domain data
models.Base.metadata.create_all(bind=engine)

# Create FastAPI app
# Disable automatic trailing-slash redirects to prevent 307 loops between "/path" and "/path/"
app = FastAPI(
    title="Complaint Management System",
    description="Production-ready complaint management system for part-order issues",
    version="1.0.0",
    redirect_slashes=False
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    # Allow localhost origins and common LAN patterns for local prod-like hosting with npx serve
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Add a permissive pattern for local LAN during development; tighten for real prod
        # FastAPI's CORSMiddleware doesn't support wildcards with ports per origin, but browsers treat exact match.
        # Users should add their LAN URL below when testing across devices.
        "http://192.168.3.82:3000",
        "http://10.10.30.161:3000",
        "http://10.10.30.161:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
# Auth endpoints (tokens issued from separate users.db)
app.include_router(auth_router.router)

# Domain endpoints
app.include_router(companies.router)
app.include_router(parts.router)
app.include_router(complaints.router)
app.include_router(analytics.router)
app.include_router(follow_up_actions.router)
app.include_router(responsibles.router)
app.include_router(settings.router)

@app.get("/")
async def root():
    return {"message": "Complaint Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "complaint-management-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)