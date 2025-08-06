from fastapi import HTTPException, BackgroundTasks
from fastapi import APIRouter

from pathlib import Path
from typing import Optional
import joblib
from datetime import datetime,timedelta
import os
from dotenv import load_dotenv

from utils.fetch_data import process_data
from api.schemas import  TrainingRequest, PredictionRequest, PredictionResponse
from api.api_logic import fetch_stock_data_async, get_api_key, load_model_artifacts

from model.LSTM import build_lstm_model
from model.feature_engineering import prepare_lstm_data
from model.train_model import train_model
from model.evaluate_model import evaluate_model,save_model_artifacts
from model.feature_engineering import create_technical_indicators
from model.predict import predict_future_prices

from core.config import logger, training_status, model_cache, scaler_cache, feature_cache

load_dotenv()

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# route from main routes to here
router=APIRouter(prefix="/api", tags=["API"])

@router.get("/")#tested-working
async def root():
    """API health check"""
    return {
        "message": "LSTM Stock Prediction API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": [
            "/docs",
            "/stock-data/{symbol}",
            "/train",
            "/predict",
            "/models",
            "/training-status/{symbol}"
        ]
    }

@router.get("/stock-data/{symbol}")#tested-working
async def get_stock_data(
    symbol: str="IBM",#will be replaced with a default symbol
    interval: str = "5min",
    limit: Optional[int] = 100
):
    """Fetch latest stock data for a symbol"""
    try:
        api_key = API_KEY
        raw_data = await fetch_stock_data_async(symbol.upper(), interval, api_key)
        df = process_data(raw_data)
        
        # Limit results if specified
        if limit:
            df = df.tail(limit)
        
        # Convert to response format
        stock_data = []
        for timestamp, row in df.iterrows():
            stock_data.append({
                "timestamp": timestamp.isoformat(),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": int(row['volume'])
            })
        
        return {
            "symbol": symbol.upper(),
            "interval": interval,
            "data": stock_data,
            "total_records": len(stock_data),
            "fetched_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching stock data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train")#tested-working
async def train_model_endpoint(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """Start training a new LSTM model"""
    symbol = request.symbol.upper()
    
    if symbol in training_status and training_status[symbol]["status"] == "training":
        raise HTTPException(
            status_code=409,
            detail=f"Model training already in progress for {symbol}"
        )
    
    # Initialize training status
    training_status[symbol] = {
        "symbol": symbol,
        "status": "training",
        "progress": 0.0,
        "message": "Training started",
        "started_at": datetime.now().isoformat(),
        "completed_at": None
    }
    
    
    background_tasks.add_task(
        train_model_background,
        symbol,
        request.interval,
        request.sequence_length,
        request.prediction_horizon,
        request.epochs
    )
    
    return {
        "message": f"Training started for {symbol}",
        "status": "training",
        "symbol": symbol,
        "check_status_url": f"/training-status/{symbol}"
    }

async def train_model_background(
    symbol: str,
    interval: str,
    sequence_length: int,
    prediction_horizon: int,
    epochs: int
):
    """Background task for model training"""
    try:
        training_status[symbol]["message"] = "Fetching data..."
        training_status[symbol]["progress"] = 10.0
        
    
        api_key = await get_api_key()
        raw_data = await fetch_stock_data_async(symbol, interval, api_key)
        df = process_data(raw_data)
        
      
        training_status[symbol]["message"] = "Creating technical indicators..."
        training_status[symbol]["progress"] = 25.0
        
        
        df = create_technical_indicators(df)
        
        # Update status
        training_status[symbol]["message"] = "Preparing training data..."
        training_status[symbol]["progress"] = 40.0
        
        # Prepare data for LSTM
        X_train, X_test, y_train, y_test, scaler, feature_columns = prepare_lstm_data(
            df, sequence_length=sequence_length, prediction_horizon=prediction_horizon
        )
        
        # Update status
        training_status[symbol]["message"] = "Building model..."
        training_status[symbol]["progress"] = 50.0
        
        
        model = build_lstm_model(
            input_shape=(X_train.shape[1], X_train.shape[2]),
            prediction_horizon=prediction_horizon
        )
        
       
        training_status[symbol]["message"] = "Training model..."
        training_status[symbol]["progress"] = 60.0
        
        
        history, model_dir = train_model(
            model, X_train, y_train, X_test, y_test, symbol, epochs=epochs
        )
        
        
        training_status[symbol]["message"] = "Evaluating model..."
        training_status[symbol]["progress"] = 90.0
        
        metrics, pred_prices, actual_prices = evaluate_model(
            model, X_test, y_test, scaler, feature_columns
        )
        
        save_model_artifacts(model, scaler, feature_columns, metrics, symbol, model_dir)
        
        cache_key = symbol
        if cache_key in model_cache:
            del model_cache[cache_key]
            del scaler_cache[cache_key] 
            del feature_cache[cache_key]
        
        # Update final status
        training_status[symbol].update({
            "status": "completed",
            "progress": 100.0,
            "message": "Training completed successfully",
            "completed_at": datetime.now().isoformat(),
            "metrics": metrics
        })
        print(f"Training completed for {symbol}")
        print("Training status:", training_status[symbol]   )
    except Exception as e:
        logger.error(f"Training failed for {symbol}: {str(e)}")
        training_status[symbol].update({
            "status": "failed",
            "message": f"Training failed: {str(e)}",
            "completed_at": datetime.now().isoformat()
        })

@router.get("/training-status/{symbol}")#tested-working
async def get_training_status(symbol: str):
    """Get training status for a symbol"""
    symbol = symbol.upper()
    print("DEBUG",training_status)
    if symbol not in training_status:
        raise HTTPException(
            status_code=404,
            detail=f"No training status found for {symbol}"
        )
    
    return training_status[symbol]

@router.post("/predict", response_model=PredictionResponse)#tested-working
async def predict_prices(request: PredictionRequest):
    """Make price predictions using trained model"""
    try:
        symbol = request.symbol.upper()
        print(symbol)
        
        # Load model artifacts
        model, scaler, feature_columns = load_model_artifacts(symbol)
        
      
        if request.use_latest_data:
            api_key = await get_api_key()
            raw_data = await fetch_stock_data_async(symbol, "5min", api_key)
            df = process_data(raw_data)
            df = create_technical_indicators(df)
            
            # Prepare data for prediction
            df_clean = df[feature_columns].dropna()
            scaled_data = scaler.transform(df_clean.tail(60))  # Use last 60 points
            last_sequence = scaled_data
        else:
            # Load historical data
            raise HTTPException(
                status_code=400,
                detail="Historical prediction not implemented. Use use_latest_data=true"
            )
        
        # Make predictions
        predictions = predict_future_prices(
            model, scaler, last_sequence, feature_columns, steps=request.steps
        )
        
        # Format predictions
        prediction_data = []
        current_time = datetime.now()
        
        for i, price in enumerate(predictions):
            prediction_data.append({
                "step": i + 1,
                "predicted_price": round(float(price), 2),
                "timestamp": (current_time + timedelta(minutes=5*(i+1))).isoformat(),
                "confidence": "medium"  # You could implement confidence intervals
            })
        
        # Load model metrics
        try:
            metrics = joblib.load(f"models/{symbol}/metrics.pkl")
        except:
            metrics = None
        
        return PredictionResponse(
            symbol=symbol,
            predictions=prediction_data,
            model_metrics=metrics,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")#tested-working
async def list_available_models():
    """List all available trained models"""
    models_dir = Path("LSTM_models")
    if not models_dir.exists():
        return {"models": []}
    
    available_models = []
    for model_dir in models_dir.iterdir():
        if model_dir.is_dir():
            model_info = {"symbol": model_dir.name}
            
            # Try to load training info
            try:
                training_info = joblib.load(model_dir / "training_info.pkl")
                model_info.update(training_info)
            except:
                model_info["status"] = "incomplete"
            
            # Check if model files exist
            required_files = ["lstm_model.h5", "scaler.pkl", "feature_columns.pkl"]
            model_info["files_present"] = all(
                (model_dir / file).exists() for file in required_files
            )
            
            available_models.append(model_info)
    
    return {"models": available_models}

@router.delete("/models/{symbol}")#tested
async def delete_model(symbol: str):
    """Delete a trained model"""
    symbol = symbol.upper()
    model_dir = Path(f"models/{symbol}")
    
    if not model_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No model found for symbol {symbol}"
        )
    
    try:
        # Remove from cache
        cache_key = symbol
        if cache_key in model_cache:
            del model_cache[cache_key]
            del scaler_cache[cache_key]
            del feature_cache[cache_key]
        
        # Remove training status
        if symbol in training_status:
            del training_status[symbol]
        
        # Delete directory
        import shutil
        shutil.rmtree(model_dir)
        
        return {"message": f"Model for {symbol} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting model: {str(e)}"
        )

@router.get("/health")#tested-working
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_key_configured": bool(os.getenv("ALPHA_VANTAGE_API_KEY")),
        "models_available": len(list(Path("models").glob("*"))),
        "active_trainings": len([s for s in training_status.values() if s["status"] == "training"]),
        "cache_size": len(model_cache)
    }

# # Error handlers
# @router.exception_handler(HTTPException)
# async def http_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={
#             "error": exc.detail,
#             "status_code": exc.status_code,
#             "timestamp": datetime.now().isoformat()
#         }
#     )

# @router.exception_handler(Exception)
# async def general_exception_handler(request, exc):
#     logger.error(f"Unhandled exception: {str(exc)}")
#     return JSONResponse(
#         status_code=500,
#         content={
#             "error": "Internal server error",
#             "message": str(exc),
#             "timestamp": datetime.now().isoformat()
#         }
#     )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )