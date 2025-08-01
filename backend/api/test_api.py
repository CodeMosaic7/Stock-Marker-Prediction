from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import requests
from dotenv import load_dotenv


load_dotenv()

app = FastAPI(
    title="Stock Prediction API",
    description="API for stock price prediction using LSTM model",
    version="1.0.0"
)

# Global variables
model = None
scaler = None
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# Request/Response models


# Your existing functions integrated
def fetch_stock_data(api_key, symbol="AAPL", interval="5min"):
    """
    Fetch intraday stock data from Alpha Vantage API
    Valid intervals: 1min, 5min, 15min, 30min, 60min
    """
    url = 'https://www.alphavantage.co/query'
    
    # Valid intraday intervals
    valid_intervals = ['1min', '5min', '15min', '30min', '60min']
    if interval not in valid_intervals:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid interval '{interval}'. Valid intervals: {valid_intervals}"
        )
    
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'symbol': symbol,
        'interval': interval,
        'apikey': api_key,
        'outputsize': 'full',  # get more historical data
        'datatype': 'json'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    # Better error handling
    if 'Error Message' in data:
        raise HTTPException(status_code=400, detail=f"API Error: {data['Error Message']}")
    
    if 'Note' in data:
        raise HTTPException(status_code=429, detail=f"API Rate Limit: {data['Note']}")
    
    time_series_key = f'Time Series ({interval})'
    if time_series_key not in data:
        raise HTTPException(
            status_code=404, 
            detail=f"Failed to fetch data. Available keys: {list(data.keys())}"
        )
    
    return data[time_series_key]

def process_data(data):
    """Process the raw stock data into a clean DataFrame"""
    df = pd.DataFrame.from_dict(data, orient='index')
    df.columns = [col.split('. ')[1] for col in df.columns]  # Clean column names
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()
    # Convert data to numeric
    df = df.apply(pd.to_numeric)
    return df

def load_model_and_scaler():
    """Load the trained model and scaler"""
    global model, scaler
    
    try:
        model_path = "model/lstm_model.h5"
        scaler_path = "data/scaler.pkl"
        
        if os.path.exists(model_path):
            model = load_model(model_path)
            print("Model loaded successfully")
        else:
            print("Model file not found")
            
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print("Scaler loaded successfully")
        else:
            print("Scaler file not found")
            
        return model is not None
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def prepare_prediction_data(df, window_size=60):
    """Prepare data for prediction using your existing logic"""
    if len(df) < window_size:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough data for prediction. Need at least {window_size} data points."
        )
    
    # Use your existing preprocessing logic
    scaled_data = scaler.transform(df)
    
    # Get the last window_size data points
    last_window = scaled_data[-window_size:]
    
    # Prepare input for model (same as your training format)
    X = np.array([last_window[:, 0]])  # Use close price (index 0)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    return X, df.iloc[-1]['close']

# Startup event
