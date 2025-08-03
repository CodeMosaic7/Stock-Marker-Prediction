const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%,rgb(217, 175, 255) 100%)',
    fontFamily: 'Arial, sans-serif',
    color: '#fff'
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '250px',
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px',
    zIndex: 1000
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '40px',
    textAlign: 'center',
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    margin: '5px 0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'transparent'
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateX(5px)'
  },
  navItemHover: {
    background: 'rgba(255, 255, 255, 0.05)'
  },
  mainContent: {
    marginLeft: '250px',
    padding: '20px',
    minHeight: '100vh'
  },
  card: {
    background: 'rgba(255, 219, 219, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '30px',
    margin: '20px 0',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    color: '#fff',
    fontSize: '18px',
    lineHeight: '1.6',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  button: {
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
  },
  input: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'white',
    fontSize: '14px',
    width: '100%',
    marginBottom: '15px'
  },
  select: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'white',
    fontSize: '14px',
    width: '100%',
    marginBottom: '15px'
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    margin: '10px 0'
  },
  statusGreen: {
    borderLeft: '4px solid #4ecdc4'
  },
  statusRed: {
    borderLeft: '4px solid #ff6b6b'
  },
  chartContainer: {
    height: '400px',
    marginTop: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    padding: '20px',   
  },

  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '18px'
  },
  error: {
    background: 'rgba(255, 107, 107, 0.2)',
    border: '1px solid #ff6b6b',
    borderRadius: '10px',
    padding: '15px',
    margin: '10px 0',
    color: '#ff6b6b'
  },
  success: {
    background: 'rgba(78, 205, 196, 0.2)',
    border: '1px solid #4ecdc4',
    borderRadius: '10px',
    padding: '15px',
    margin: '10px 0',
    color: '#4ecdc4'
  }
};
export default styles;