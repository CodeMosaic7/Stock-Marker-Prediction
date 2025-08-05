
import logging
from fastapi import FastAPI

# Initialize shared objects 
app = FastAPI( 
    title="Stock Prediction API",
    description="API for stock price prediction using LSTM model",
    version="1.0.0")
logger = logging.getLogger(__name__)
training_status = {}  
model_cache = {}
scaler_cache = {}
feature_cache = {}