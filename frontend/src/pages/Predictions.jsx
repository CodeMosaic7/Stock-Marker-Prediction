import  styles  from "../styles.js";
import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart,
  Area,
  AreaChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  predictPrices, 
  getStockData,
  formatErrorMessage, 
  checkModelExists,
  getAvailableModels,
  getModelInfo
} from '../api/api';


const Predictions = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [steps, setSteps] = useState(10);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [error, setError] = useState('');
  const [modelExists, setModelExists] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area', 'combined'
  const [availableModels, setAvailableModels] = useState([]);
  const [useLatestData, setUseLatestData] = useState(true);
  const [confidence, setConfidence] = useState(null);

  // Check model existence when symbol changes
  useEffect(() => {
    checkModel();
  }, [symbol]);

  // Load available models on mount
  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const modelsData = await getAvailableModels();
      setAvailableModels(modelsData.models?.filter(m => m.files_present) || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const checkModel = async () => {
    if (!symbol.trim()) return;
    
    try {
      const exists = await checkModelExists(symbol);
      setModelExists(exists);
      
      if (exists) {
        const info = await getModelInfo(symbol);
        setModelInfo(info);
      } else {
        setModelInfo(null);
      }
    } catch (error) {
      console.error('Error checking model:', error);
      setModelExists(false);
      setModelInfo(null);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const data = await getStockData(symbol, '5min', 50);
      setHistoricalData(data);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const makePrediction = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    if (!modelExists) {
      setError(`No trained model found for ${symbol}. Please train a model first.`);
      return;
    }

    setLoading(true);
    setError('');
    setPredictions(null);
    
    try {
      const predictionRequest = {
        symbol,
        steps: parseInt(steps),
        use_latest_data: useLatestData
      };

      const data = await predictPrices(predictionRequest);
      setPredictions(data);
      
      // Load historical data for comparison
      await loadHistoricalData();
      
      // Calculate confidence metrics if available
      if (data.confidence_interval) {
        setConfidence(data.confidence_interval);
      }
      
    } catch (error) {
      setError(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSelect = (selectedSymbol) => {
    setSymbol(selectedSymbol);
    setPredictions(null);
    setError('');
  };

  // Prepare chart data combining historical and predicted prices
  const getChartData = () => {
    const historicalPoints = historicalData?.data?.slice(-10).map((item, index) => ({
      step: `H-${10 - index}`,
      time: new Date(item.timestamp).toLocaleTimeString(),
      price: parseFloat(item.close),
      type: 'historical',
      isHistorical: true
    })) || [];

    const predictionPoints = predictions?.predictions?.map((pred, index) => ({
      step: `P+${index + 1}`,
      time: `Future ${index + 1}`,
      price: parseFloat(pred.price || pred),
      confidence_lower: pred.confidence_lower,
      confidence_upper: pred.confidence_upper,
      type: 'prediction',
      isHistorical: false
    })) || [];

    return [...historicalPoints, ...predictionPoints];
  };

  const chartData = getChartData();

  // Calculate prediction statistics
  const getPredictionStats = () => {
    if (!predictions?.predictions) return null;

    const prices = predictions.predictions.map(p => parseFloat(p.price || p));
    const currentPrice = parseFloat(predictions.current_price || 0);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const finalPrice = prices[prices.length - 1];
    
    const totalChange = finalPrice - currentPrice;
    const totalChangePercent = currentPrice !== 0 ? (totalChange / currentPrice) * 100 : 0;

    return {
      minPrice: minPrice.toFixed(2),
      maxPrice: maxPrice.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      totalChange: totalChange.toFixed(2),
      totalChangePercent: totalChangePercent.toFixed(2),
      volatility: ((maxPrice - minPrice) / avgPrice * 100).toFixed(2)
    };
  };

  const stats = getPredictionStats();

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="step" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [
                `$${parseFloat(value).toFixed(2)}`,
                props.payload.isHistorical ? 'Historical' : 'Predicted'
              ]}
            />
            <Bar dataKey="price" fill={(entry) => entry.isHistorical ? '#4ecdc4' : '#ff6b6b'} />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="step" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [
                `$${parseFloat(value).toFixed(2)}`,
                props.payload.isHistorical ? 'Historical' : 'Predicted'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#4ecdc4" 
              fill="rgba(78, 205, 196, 0.3)"
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      case 'combined':
        return (
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="step" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [
                `$${parseFloat(value).toFixed(2)}`,
                props.payload.isHistorical ? 'Historical' : 'Predicted'
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4ecdc4" 
              strokeWidth={3}
              dot={{ fill: '#4ecdc4', r: 4 }}
              name="Price"
            />
            <ReferenceLine x="P+1" stroke="#ff6b6b" strokeDasharray="2 2" />
          </ComposedChart>
        );
      
      default: // line
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="step" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [
                `$${parseFloat(value).toFixed(2)}`,
                props.payload.isHistorical ? 'Historical' : 'Predicted'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4ecdc4" 
              strokeWidth={3}
              dot={{ fill: '#4ecdc4', r: 4 }}
              activeDot={{ r: 6, fill: '#ff6b6b' }}
            />
            <ReferenceLine x="P+1" stroke="#ff6b6b" strokeDasharray="2 2" />
          </LineChart>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#fff', textAlign: 'center' }}>
          🔮 Price Predictions
        </h1>

        {/* Available Models Quick Select */}
        {availableModels.length > 0 && (
          <div style={styles.card}>
            <h3 style={{ color: '#fff', marginBottom: '15px' }}>🎯 Available Models</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {availableModels.map((model) => (
                <button
                  key={model.symbol}
                  style={{
                    ...styles.buttonSecondary,
                    ...(symbol === model.symbol ? styles.toggleActive : styles.toggleInactive)
                  }}
                  onClick={() => handleSymbolSelect(model.symbol)}
                >
                  {model.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Model Status */}
        {symbol && (
          <div style={styles.modelInfo}>
            <div style={styles.flexContainer}>
              <div style={{ flex: 1 }}>
                {modelExists ? (
                  <div>
                    <h3 style={{ color: '#4ecdc4', marginBottom: '10px' }}>
                      ✅ Model Ready for {symbol}
                    </h3>
                    {modelInfo && (
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                        <p style={{ margin: '5px 0' }}>
                          Last updated: {new Date(modelInfo.last_updated).toLocaleString()}
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          Status: Ready for predictions
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>
                      ❌ No Model Found for {symbol}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                      Please train a model first before making predictions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prediction Configuration */}
        <div style={styles.card}>
          <h2 style={{ color: '#fff', marginBottom: '25px' }}>⚙️ Prediction Configuration</h2>
          
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Stock Symbol:</label>
              <input
                style={styles.input}
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL)"
                disabled={loading}
              />
              <div style={styles.helpText}>
                The stock ticker symbol to predict
              </div>
            </div>
            
            <div>
              <label style={styles.label}>Prediction Steps:</label>
              <input
                style={styles.input}
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                min="1"
                max="50"
                disabled={loading}
              />
              <div style={styles.helpText}>
                Number of future time periods to predict (1-50)
              </div>
            </div>

            <div>
              <label style={styles.label}>Data Source:</label>
              <select
                style={styles.select}
                value={useLatestData ? 'latest' : 'model'}
                onChange={(e) => setUseLatestData(e.target.value === 'latest')}
                disabled={loading}
              >
                <option value="latest">Use Latest Market Data</option>
                <option value="model">Use Model's Last Training Data</option>
              </select>
              <div style={styles.helpText}>
                Choose data source for predictions
              </div>
            </div>
          </div>
          
          <div style={styles.flexContainer}>
            <button
              style={{
                ...styles.button,
                ...(loading || !modelExists ? styles.buttonDisabled : {})
              }}
              onClick={makePrediction}
              disabled={loading || !modelExists}
            >
              {loading ? '🔮 Predicting...' : '🔮 Make Prediction'}
            </button>

            {!modelExists && (
              <div style={{ color: '#ff6b6b', fontSize: '14px' }}>
                ⚠️ No trained model available for this symbol
              </div>
            )}
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}
        </div>

        {/* Prediction Results */}
        {predictions && (
          <div style={styles.card}>
            <div style={styles.flexContainer}>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff' }}>{predictions.symbol} Predictions</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                  <strong>Current Price:</strong> ${parseFloat(predictions.current_price || 0).toFixed(2)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                  <strong>Generated:</strong> {new Date().toLocaleString()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                  <strong>Predictions:</strong> {predictions.predictions?.length || 0} steps
                </p>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Final Price</div>
                  <div style={styles.statValue}>${stats.finalPrice}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total Change</div>
                  <div style={{
                    ...styles.statValue,
                    color: parseFloat(stats.totalChange) >= 0 ? '#4ecdc4' : '#ff6b6b'
                  }}>
                    {parseFloat(stats.totalChange) >= 0 ? '+' : ''}${stats.totalChange} ({stats.totalChangePercent}%)
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Price Range</div>
                  <div style={styles.statValue}>${stats.minPrice} - ${stats.maxPrice}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Average Price</div>
                  <div style={styles.statValue}>${stats.avgPrice}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Volatility</div>
                  <div style={styles.statValue}>{stats.volatility}%</div>
                </div>
              </div>
            )}

            {/* Chart Type Toggle */}
            <div style={styles.chartToggle}>
              {[
                { key: 'line', label: '📈 Line', icon: '📈' },
                { key: 'bar', label: '📊 Bar', icon: '📊' },
                { key: 'area', label: '📈 Area', icon: '🌊' },
                { key: 'combined', label: '📈 Combined', icon: '🔀' }
              ].map((type) => (
                <button
                  key={type.key}
                  style={{
                    ...styles.toggleButton,
                    ...(chartType === type.key ? styles.toggleActive : styles.toggleInactive)
                  }}
                  onClick={() => setChartType(type.key)}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>

            {/* Predictions List */}
            <div style={styles.predictionsList}>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>📋 Detailed Predictions</h3>
              {predictions.predictions?.map((pred, index) => {
                const price = parseFloat(pred.price || pred);
                const prevPrice = index === 0 
                  ? parseFloat(predictions.current_price || 0) 
                  : parseFloat(predictions.predictions[index - 1].price || predictions.predictions[index - 1]);
                const change = price - prevPrice;
                const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

                return (
                  <div key={index} style={styles.predictionItem}>
                    <div>
                      <strong>Step {index + 1}:</strong> ${price.toFixed(2)}
                    </div>
                    <div style={{
                      color: change >= 0 ? '#4ecdc4' : '#ff6b6b',
                      fontWeight: 'bold'
                    }}>
                      {change >= 0 ? '+' : ''}${change.toFixed(2)} ({changePercent.toFixed(2)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Model Information */}
        {availableModels.length > 0 && (
          <div style={styles.card}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>📚 All Available Models</h2>
            <div style={styles.grid}>
              {availableModels.map((model, index) => (
                <div key={index} style={styles.modelInfo}>
                  <h4 style={{ color: '#4ecdc4', margin: '0 0 10px 0' }}>
                    {model.symbol}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0', fontSize: '14px' }}>
                    Updated: {new Date(model.last_updated).toLocaleDateString()}
                  </p>
                  <button
                    style={styles.buttonSecondary}
                    onClick={() => handleSymbolSelect(model.symbol)}
                  >
                    Select for Prediction
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;