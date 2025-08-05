import os
import httpx
from fastapi import HTTPException

import tensorflow as tf
import joblib  
from core.config import model_cache, scaler_cache, feature_cache 

async def get_api_key():
    """Get API key from environment"""
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Alpha Vantage API key not configured"
        )
    return api_key

def load_model_artifacts(symbol: str):
    """Load trained model artifacts"""
    model_dir = f"models/{symbol}"
    
    if not os.path.exists(model_dir):
        raise HTTPException(
            status_code=404,
            detail=f"No trained model found for symbol {symbol}"
        )
    
    try:
        
        cache_key = symbol
        if cache_key in model_cache:
            return model_cache[cache_key], scaler_cache[cache_key], feature_cache[cache_key]
        
        # Load from disk
        model = tf.keras.models.load_model(f"{model_dir}/lstm_model.h5")
        scaler = joblib.load(f"{model_dir}/scaler.pkl")
        feature_columns = joblib.load(f"{model_dir}/feature_columns.pkl")
        
        # Cache for future use
        model_cache[cache_key] = model
        scaler_cache[cache_key] = scaler
        feature_cache[cache_key] = feature_columns
        
        return model, scaler, feature_columns
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading model artifacts: {str(e)}"
        )

async def fetch_stock_data_async(symbol: str, interval: str, api_key: str):
    """Async version of stock data fetching"""
    url = 'https://www.alphavantage.co/query'
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'symbol': symbol,
        'interval': interval,
        'apikey': api_key,
        'outputsize': 'full',
        'datatype': 'json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        print("DEBUG: Fetched data:", data)  # Debugging line
        if 'Error Message' in data:
            raise HTTPException(status_code=400, detail=f"API Error: {data['Error Message']}")
        
        if 'Note' in data:
            raise HTTPException(status_code=429, detail=f"API Rate Limit: {data['Note']}")
        
        time_series_key = f'Time Series ({interval})'
        if time_series_key not in data:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch data. Available keys: {list(data.keys())}"
            )
        
        return data[time_series_key]
