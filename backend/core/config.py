
import logging
from fastapi import FastAPI
from core.state_manager import load_json,load_pickle

# Initialize shared objects 
app = FastAPI( 
    title="Stock Prediction API",
    description="API for stock price prediction using LSTM model",
    version="1.0.0")
logger = logging.getLogger(__name__)

training_status = load_json("training_status.json")
model_cache = load_pickle("model_cache.pkl")
scaler_cache = load_pickle("scaler_cache.pkl")
feature_cache = load_pickle("feature_cache.pkl")