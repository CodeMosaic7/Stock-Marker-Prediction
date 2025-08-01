import { styles } from "../styles";
import { useState } from "react";
const Predictions = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('5min');
  const [steps, setSteps] = useState(5);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState('');

  const makePrediction = async () => {
    setLoading(true);
    setError('');
    setPredictions(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          interval,
          prediction_steps: parseInt(steps)
        }),
      });
      
      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const chartData = predictions?.predicted_prices?.map((price, index) => ({
    step: `Step ${index + 1}`,
    price: price,
    current: index === 0 ? predictions.current_price : null
  })) || [];

  return (
    <div>
      <h1 style={{fontSize: '32px', marginBottom: '30px'}}>Price Predictions</h1>
      
      <div style={styles.card}>
        <div style={styles.grid}>
          <div>
            <label>Stock Symbol:</label>
            <input
              style={styles.input}
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol"
            />
          </div>
          
          <div>
            <label>Interval:</label>
            <select
              style={styles.select}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              <option value="1min">1 Minute</option>
              <option value="5min">5 Minutes</option>
              <option value="15min">15 Minutes</option>
              <option value="30min">30 Minutes</option>
              <option value="60min">1 Hour</option>
            </select>
          </div>
          
          <div>
            <label>Prediction Steps:</label>
            <input
              style={styles.input}
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              min="1"
              max="20"
            />
          </div>
        </div>
        
        <button
          style={styles.button}
          onClick={makePrediction}
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Make Prediction'}
        </button>
        
        {error && <div style={styles.error}>{error}</div>}
      </div>
      
      {predictions && (
        <div style={styles.card}>
          <h2>{predictions.symbol} Predictions</h2>
          <p><strong>Current Price:</strong> ${predictions.current_price?.toFixed(2)}</p>
          <p><strong>Generated:</strong> {new Date(predictions.timestamp).toLocaleString()}</p>
          
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="step" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px'
                  }}
                />
                <Bar dataKey="price" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{marginTop: '20px'}}>
            <h3>Predicted Prices:</h3>
            {predictions.predicted_prices.map((price, index) => (
              <div key={index} style={{padding: '5px 0'}}>
                Step {index + 1}: ${price.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Predictions;