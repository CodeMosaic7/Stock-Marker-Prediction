import { useState } from "react";
import { useEffect } from "react";
import { Activity, Brain, Settings, Database } from 'lucide-react';
import styles from '../styles';
const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 style={{fontSize: '32px', marginBottom: '30px', textAlign: 'center'}}>
        Stock Prediction Dashboard
      </h1>
      
      <div style={styles.grid}>
        <div style={{...styles.statusCard, ...(healthData?.status === 'healthy' ? styles.statusGreen : styles.statusRed)}}>
          <div>
            <h3>System Status</h3>
            <p>{healthData?.status || 'Unknown'}</p>
          </div>
          <Activity size={32} />
        </div>
        
        <div style={{...styles.statusCard, ...(healthData?.model_loaded ? styles.statusGreen : styles.statusRed)}}>
          <div>
            <h3>Model Status</h3>
            <p>{healthData?.model_loaded ? 'Loaded' : 'Not Loaded'}</p>
          </div>
          <Brain size={32} />
        </div>
        
        <div style={{...styles.statusCard, ...(healthData?.scaler_loaded ? styles.statusGreen : styles.statusRed)}}>
          <div>
            <h3>Scaler Status</h3>
            <p>{healthData?.scaler_loaded ? 'Loaded' : 'Not Loaded'}</p>
          </div>
          <Settings size={32} />
        </div>
        
        <div style={{...styles.statusCard, ...(healthData?.api_key_configured ? styles.statusGreen : styles.statusRed)}}>
          <div>
            <h3>API Key</h3>
            <p>{healthData?.api_key_configured ? 'Configured' : 'Missing'}</p>
          </div>
          <Database size={32} />
        </div>
      </div>
      
      <div style={styles.card}>
        <h2>Welcome to StockAI</h2>
        <p>Your AI-powered stock prediction platform. Get started by:</p>
        <ul style={{listStyle: 'none', padding: 0}}>
          <li style={{padding: '10px 0'}}>📊 Viewing stock data in real-time</li>
          <li style={{padding: '10px 0'}}>🧠 Training machine learning models</li>
          <li style={{padding: '10px 0'}}>📈 Making price predictions</li>
          <li style={{padding: '10px 0'}}>📋 Monitoring model performance</li>
        </ul>
      </div>
    </div>
  );
};
export default Dashboard;
