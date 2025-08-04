from pydantic import BaseModel
from typing import List
from pydantic import Field
from typing import Dict, Any, Optional

class StockSymbolRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL, GOOGL)")
    interval: str = Field(default="5min", description="Time interval (1min, 5min, 15min, 30min, 60min)")

class TrainingRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol to train model for")
    interval: str = Field(default="5min", description="Time interval")
    sequence_length: int = Field(default=60, description="Number of time steps to look back")
    prediction_horizon: int = Field(default=1, description="Steps ahead to predict")
    epochs: int = Field(default=50, description="Number of training epochs")

class PredictionRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol")
    steps: int = Field(default=10, description="Number of future steps to predict")
    use_latest_data: bool = Field(default=True, description="Fetch latest data for prediction")

class StockData(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class PredictionResponse(BaseModel):
    symbol: str
    predictions: List[Dict[str, Any]]
    model_metrics: Optional[Dict[str, float]]
    generated_at: str

class TrainingStatus(BaseModel):
    symbol: str
    status: str  # "training", "completed", "failed"
    progress: Optional[float]
    message: str
    started_at: str
    completed_at: Optional[str]
