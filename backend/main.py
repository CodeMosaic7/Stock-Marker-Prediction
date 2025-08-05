
from fastapi.middleware.cors import CORSMiddleware
from api import api_routes
from core.config import app
from core.state_manager import save_json,save_pickle

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

@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Welcome to the Stock Market Prediction API", "base_url": BASE_URL}

#route for health check
@app.get("/health")
def health_check():
    """Status and health check point"""
    return {"status":"ok","message":"API is ok"}


# add route here
app.include_router(api_routes.router)


@app.on_event("shutdown")
def save_state():
    save_json(training_status, "training_status.json")
    save_pickle(model_cache, "model_cache.pkl")
    save_pickle(scaler_cache, "scaler_cache.pkl")
    save_pickle(feature_cache, "feature_cache.pkl")
    logger.info("Application state saved.")
