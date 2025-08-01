import { useState } from "react";
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';  
import Predictions from "./pages/Predictions";
import StockData from "./pages/StockData";
import TrainModel from "./pages/Train";
import ModelInfo from "./pages/ModelInfo";
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock-data':
        return <StockData />;
      case 'train':
        return <TrainModel />;
      case 'predict':
        return <Predictions />;
      case 'model-info':
        return <ModelInfo />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={styles.app}>
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div style={styles.mainContent}>
        {renderPage()}
      </div>
    </div>
  );
};

export default App;
