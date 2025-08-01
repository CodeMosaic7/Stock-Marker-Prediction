import requests
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os



app = FastAPI(
    title="Stock Prediction API",
    description="API for stock price prediction using LSTM model",
    version="1.0.0"
)
model = None
scaler = None
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")


# Base URL for your API
BASE_URL = "http://localhost:8000"

def test_api():
    """Test the FastAPI endpoints"""
    
    # 1. Health check
    print("1. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health: {response.json()}")
    print()
    
    # 2. Train model
    print("2. Training model...")
    train_data = {
        "symbol": "AAPL",
        "interval": "5min",
        "epochs": 5,
        "batch_size": 32
    }
    response = requests.post(f"{BASE_URL}/train", json=train_data)
    if response.status_code == 200:
        print(f"Training successful: {response.json()}")
    else:
        print(f"Training failed: {response.text}")
    print()
    
    # 3. Get stock data
    print("3. Getting stock data...")
    response = requests.get(f"{BASE_URL}/stock-data/AAPL?interval=5min&limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"Got {len(data['data'])} data points for {data['symbol']}")
        print(f"Latest price: ${data['data'][-1]['close']}")
    else:
        print(f"Failed to get data: {response.text}")
    print()
    
    # 4. Make prediction
    print("4. Making prediction...")
    predict_data = {
        "symbol": "AAPL",
        "interval": "5min",
        "prediction_steps": 3
    }
    response = requests.post(f"{BASE_URL}/predict", json=predict_data)
    if response.status_code == 200:
        prediction = response.json()
        print(f"Current price: ${prediction['current_price']:.2f}")
        print(f"Predicted prices: {[f'${p:.2f}' for p in prediction['predicted_prices']]}")
    else:
        print(f"Prediction failed: {response.text}")
    print()
    
    # 5. Model info
    print("5. Getting model info...")
    response = requests.get(f"{BASE_URL}/model-info")
    if response.status_code == 200:
        info = response.json()
        print(f"Model loaded: {info['model_loaded']}")
        print(f"Input shape: {info['input_shape']}")
        print(f"Output shape: {info['output_shape']}")
    else:
        print(f"Model info failed: {response.text}")

if __name__ == "__main__":
    test_api()