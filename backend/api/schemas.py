from pydantic import BaseModel
from typing import List

class PredictionRequest(BaseModel):
    symbol: str
    interval: str = "5min"
    prediction_steps: int = 1

class TrainRequest(BaseModel):
    symbol: str = "AAPL"
    interval: str = "5min"
    epochs: int = 5
    batch_size: int = 32

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_prices: List[float]
    timestamp: str

class StockDataResponse(BaseModel):
    symbol: str
    interval: str
    data: List[dict]
    timestamp: str