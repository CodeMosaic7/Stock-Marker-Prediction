import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStockData, formatErrorMessage } from '../api/api'; // Import from your API module
import styles from "../styles"


const StockData = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('5min');
  const [limit, setLimit] = useState(50);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStockData = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getStockData(symbol, interval, limit);
      setStockData(data);
    } catch (error) {
      setError(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId;
    if (autoRefresh && stockData) {
      intervalId = setInterval(fetchStockData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, symbol, interval, limit]);

  const chartData = stockData?.data?.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    fullTime: new Date(item.timestamp).toLocaleString(),
    price: parseFloat(item.close),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    volume: parseInt(item.volume)
  })) || [];

  // Calculate statistics
  const getStatistics = () => {
    if (!stockData?.data || stockData.data.length === 0) return null;

    const prices = stockData.data.map(item => parseFloat(item.close));
    const volumes = stockData.data.map(item => parseInt(item.volume));
    
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2] || currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

    return {
      currentPrice: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      high: Math.max(...prices).toFixed(2),
      low: Math.min(...prices).toFixed(2),
      avgVolume: Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length).toLocaleString()
    };
  };

  const statistics = getStatistics();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#fff', textAlign: 'center' }}>
          📈 Stock Data Analyzer
        </h1>
        
        <div style={styles.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Stock Symbol:</label>
              <input
                style={styles.input}
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL)"
                onKeyPress={(e) => e.key === 'Enter' && fetchStockData()}
              />
            </div>
            
            <div>
              <label style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Interval:</label>
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
                <option value="1day">1 Day</option>
              </select>
            </div>
            
            <div>
              <label style={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>Data Points:</label>
              <select
                style={styles.select}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value="20">20 Points</option>
                <option value="50">50 Points</option>
                <option value="100">100 Points</option>
                <option value="200">200 Points</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onClick={fetchStockData}
              disabled={loading}
            >
              {loading ? '📊 Loading...' : '📊 Fetch Data'}
            </button>
            
            <label style={{ display: 'flex', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Auto-refresh (30s)
            </label>
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}
          {stockData && !error && (
            <div style={styles.success}>
              ✅ Successfully loaded {stockData.data?.length || 0} data points for {stockData.symbol}
            </div>
          )}
        </div>

        {stockData && statistics && (
          <div style={styles.card}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>
              {stockData.symbol} - {interval} Data
              {autoRefresh && <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.7 }}>🔄 Auto-refreshing</span>}
            </h2>
            
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
              Last updated: {new Date(stockData.timestamp).toLocaleString()}
            </p>

            <div style={styles.statsContainer}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Current Price</div>
                <div style={styles.statValue}>${statistics.currentPrice}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Change</div>
                <div style={{
                  ...styles.statValue,
                  color: parseFloat(statistics.change) >= 0 ? '#4ecdc4' : '#ff6b6b'
                }}>
                  {parseFloat(statistics.change) >= 0 ? '+' : ''}${statistics.change} ({statistics.changePercent}%)
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>24h High</div>
                <div style={styles.statValue}>${statistics.high}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>24h Low</div>
                <div style={styles.statValue}>${statistics.low}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Avg Volume</div>
                <div style={styles.statValue}>{statistics.avgVolume}</div>
              </div>
            </div>

            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#fff" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#fff" 
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      color: '#fff'
                    }}
                    labelFormatter={(value, payload) => `Time: ${payload[0]?.payload?.fullTime || value}`}
                    formatter={(value, name) => [
                      name === 'price' ? `$${value.toFixed(2)}` : value.toLocaleString(),
                      name === 'price' ? 'Price' : 'Volume'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#4ecdc4" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#4ecdc4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockData;