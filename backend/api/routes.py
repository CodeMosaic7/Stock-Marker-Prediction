from 

@app.on_event("startup")
async def startup_event():
    """Load model and scaler on startup"""
    if not API_KEY:
        print("Warning: ALPHA_VANTAGE_API_KEY not found in environment variables")
    
    load_model_and_scaler()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "api_key_configured": API_KEY is not None
    }

# Get stock data endpoint
@app.get("/stock-data/{symbol}", response_model=StockDataResponse)
async def get_stock_data(symbol: str, interval: str = "5min", limit: int = 100):
    """Get current stock data"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        raw_data = fetch_stock_data(API_KEY, symbol, interval)
        df = process_data(raw_data)
        
        # Limit the number of records returned
        df_limited = df.tail(limit)
        
        # Convert to list of dictionaries
        data_list = []
        for timestamp, row in df_limited.iterrows():
            data_list.append({
                "timestamp": timestamp.isoformat(),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": int(row['volume'])
            })
        
        return StockDataResponse(
            symbol=symbol,
            interval=interval,
            data=data_list,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

# Train model endpoint - using your exact training logic
@app.post("/train")
async def train_model(request: TrainRequest):
    """Train the LSTM model using your existing code"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        global model, scaler
        
        # Your existing training code
        df = fetch_stock_data(API_KEY, request.symbol, interval=request.interval)
        df = process_data(df)
        
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(df)
        
        X, y = [], []
        window_size = 60
        
        if len(scaled_data) <= window_size:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough data for training. Need at least {window_size + 1} data points."
            )
        
        for i in range(window_size, len(scaled_data)):
            X.append(scaled_data[i - window_size:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        # Your model architecture
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
            LSTM(50),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse')
        history = model.fit(X, y, epochs=request.epochs, batch_size=request.batch_size, verbose=0)
        
        # Save model and scaler
        os.makedirs("model", exist_ok=True)
        os.makedirs("data", exist_ok=True)
        
        model.save("model/lstm_model.h5")
        joblib.dump(scaler, "data/scaler.pkl")
        
        return {
            "message": "Model trained successfully",
            "symbol": request.symbol,
            "interval": request.interval,
            "training_data_points": len(X),
            "epochs": request.epochs,
            "batch_size": request.batch_size,
            "final_loss": float(history.history['loss'][-1]),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

# Prediction endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict_stock_price(request: PredictionRequest):
    """Predict stock prices"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please train the model first.")
    
    try:
        # Fetch recent data
        raw_data = fetch_stock_data(API_KEY, request.symbol, request.interval)
        df = process_data(raw_data)
        
        # Prepare data for prediction
        X, current_price = prepare_prediction_data(df)
        
        # Make predictions
        predicted_prices = []
        
        for step in range(request.prediction_steps):
            # Predict next price
            prediction_scaled = model.predict(X, verbose=0)
            prediction = scaler.inverse_transform(prediction_scaled.reshape(-1, 1))[0][0]
            predicted_prices.append(float(prediction))
            
            # Update X for next prediction (rolling window)
            if step < request.prediction_steps - 1:
                # Add the prediction to the input sequence
                new_scaled_value = scaler.transform([[prediction]])[0][0]
                
                # Roll the window: remove first element, add new prediction
                X = np.roll(X, -1, axis=1)
                X[0, -1, 0] = new_scaled_value
        
        return PredictionResponse(
            symbol=request.symbol,
            current_price=current_price,
            predicted_prices=predicted_prices,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Model info endpoint
@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=404, detail="No model loaded")
    
    return {
        "model_loaded": True,
        "input_shape": model.input_shape,
        "output_shape": model.output_shape,
        "scaler_loaded": scaler is not None,
        "model_layers": len(model.layers)
    }

# List available stocks endpoint
@app.get("/available-intervals")
async def get_available_intervals():
    """Get list of available intervals"""
    return {
        "intervals": ['1min', '5min', '15min', '30min', '60min'],
        "recommended": "5min"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)