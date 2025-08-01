import { useState } from "react";
import styles from "../styles"
const Train = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('5min');
  const [epochs, setEpochs] = useState(10);
  const [batchSize, setBatchSize] = useState(32);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const trainModel = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          interval,
          epochs: parseInt(epochs),
          batch_size: parseInt(batchSize)
        }),
      });
      
      if (!response.ok) throw new Error('Training failed');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{fontSize: '32px', marginBottom: '30px'}}>Train Model</h1>
      
      <div style={styles.card}>
        <h2>Training Configuration</h2>
        
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
            <label>Data Interval:</label>
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
            <label>Epochs:</label>
            <input
              style={styles.input}
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(e.target.value)}
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <label>Batch Size:</label>
            <input
              style={styles.input}
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              min="1"
              max="128"
            />
          </div>
        </div>
        
        <button
          style={styles.button}
          onClick={trainModel}
          disabled={loading}
        >
          {loading ? 'Training...' : 'Start Training'}
        </button>
        
        {error && <div style={styles.error}>{error}</div>}
        
        {result && (
          <div style={styles.success}>
            <h3>Training Completed Successfully!</h3>
            <p><strong>Symbol:</strong> {result.symbol}</p>
            <p><strong>Training Data Points:</strong> {result.training_data_points}</p>
            <p><strong>Final Loss:</strong> {result.final_loss?.toFixed(6)}</p>
            <p><strong>Completed:</strong> {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Train;
