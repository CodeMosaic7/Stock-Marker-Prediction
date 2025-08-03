import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from "../styles";
const StockData = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('5min');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/stock-data/${symbol}?interval=${interval}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const chartData = stockData?.data?.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    price: item.close,
    volume: item.volume
  })) || [];

  return (
    <div>
      <h1 style={{fontSize: '32px', marginBottom: '30px'}}>Stock Data</h1>
      
      <div style={styles.card}>
        <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
          <div style={{flex: 1}}>
            <label>Stock Symbol:</label>
            <input
              style={styles.input}
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., AAPL)"
            />
          </div>
          <div style={{flex: 1}}>
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
        </div>
        
        <button
          style={styles.button}
          onClick={fetchStockData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
        
        {error && <div style={styles.error}>{error}</div>}
      </div>
      
      {stockData && (
        <div style={styles.card}>
          <h2>{stockData.symbol} - {interval} Data</h2>
          <p>Last updated: {new Date(stockData.timestamp).toLocaleString()}</p>
          
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px'
                  }}
                />
                <Line type="monotone" dataKey="price" stroke="#4ecdc4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
export default StockData;