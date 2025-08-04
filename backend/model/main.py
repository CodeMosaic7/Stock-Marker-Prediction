from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import numpy as np
from dotenv import load_dotenv
from backend.utils.fetch_data import fetch_stock_data, process_data
from backend.api.schemas import StockDataResponse, TrainRequest, PredictionRequest, PredictionResponse
from sklearn.preprocessing import MinMaxScaler
import requests

def train_model(API_KEY,data):
    """Train the model"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        global model, scaler
        # Your existing training code
        df = fetch_stock_data(API_KEY, request.symbol, interval=request.interval)
        df = process_data(df)
        
        # Train and save model 
        
        
        return {"status": "success", "message": "Model trained successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")
