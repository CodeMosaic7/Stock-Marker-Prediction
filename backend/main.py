import requests
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware
from backend.api import api_routes
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Stock Prediction API",
    description="API for stock price prediction using LSTM model",
    version="1.0.0"
)
model = None
scaler = None
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# global variables
model_cache = {}
scaler_cache = {}
feature_cache = {}
training_status = {}


# Base URL for your API
BASE_URL = "http://localhost:8000"

#route for health check
@app.get("/health")
def health_check():
    """Status and health check point"""
    return {"status":"ok","message":"API is ok"}

app.router(api_routes.router)

# add route here