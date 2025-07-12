import { useEffect, useState } from "react";
import axios from "axios";
import Chart from "./components/Chart";

function App() {
  const [predicted, setPredicted] = useState([]);
  const [actual, setActual] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/predict") // FastAPI endpoint
      .then(res => {
        setPredicted(res.data.predicted);
        setActual(res.data.actual);
      });
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📈 Stock Price Prediction (LSTM)</h1>
      <Chart predicted={predicted} actual={actual} />
    </div>
  );
}

export default App;
