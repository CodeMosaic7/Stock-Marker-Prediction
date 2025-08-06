import numpy as np
def predict_future_prices(model, scaler, last_sequence, feature_columns, steps=10):
    """Predict future prices"""
    predictions = []
    current_sequence = last_sequence.copy()
    
    for _ in range(steps):
       
        pred = model.predict(current_sequence.reshape(1, *current_sequence.shape), verbose=0)
        
        dummy_pred = np.zeros((1, len(feature_columns)))
        dummy_pred[0, 3] = pred[0, 0]  #
        
        # Inverse transform to get actual price
        actual_price = scaler.inverse_transform(dummy_pred)[0, 3]
        predictions.append(actual_price)
        
        # Update sequence for next prediction
        new_row = current_sequence[-1].copy()
        new_row[3] = pred[0, 0]  # Update close price
        current_sequence = np.vstack([current_sequence[1:], new_row])
    
    return predictions