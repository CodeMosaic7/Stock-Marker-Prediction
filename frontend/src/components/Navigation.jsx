import { useState } from 'react';
import styles from '../styles.js';
import { Home, BarChart3, Brain, TrendingUp, Info, Activity } from 'lucide-react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'stock-data', label: 'Stock Data', icon: BarChart3 },
    { id: 'train', label: 'Train Model', icon: Brain },
    { id: 'predict', label: 'Predictions', icon: TrendingUp },
    { id: 'model-info', label: 'Model Info', icon: Info }
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <Activity size={24} style={{marginRight: '10px'}} />
        StockAI
      </div>
      
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        const isHovered = hoveredItem === item.id;
        
        return (
          <div
            key={item.id}
            style={{
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
              ...(isHovered && !isActive ? styles.navItemHover : {})
            }}
            onClick={() => setCurrentPage(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Icon size={20} style={{marginRight: '15px'}} />
            {item.label}
          </div>
        );
      })}
    </div>
  );
};

export default Navigation;

