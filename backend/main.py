
from fastapi.middleware.cors import CORSMiddleware
from api import api_routes
from core.config import app

model = None
scaler = None


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Base URL for your API
BASE_URL = "http://localhost:8000"

#route for health check
@app.get("/health")
def health_check():
    """Status and health check point"""
    return {"status":"ok","message":"API is ok"}


# add route here
app.include_router(api_routes.router)