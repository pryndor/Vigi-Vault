"""
Vigi-Vault Backend API

FastAPI application for pharmacovigilance entity extraction and screening.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.entity_routes import router as entity_router

app = FastAPI(
    title="Vigi-Vault API",
    description="Pharmacovigilance Clinical Database API - Entity Extraction & Screening",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite & React defaults
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(entity_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "healthy",
        "service": "Vigi-Vault API",
        "version": "0.1.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
