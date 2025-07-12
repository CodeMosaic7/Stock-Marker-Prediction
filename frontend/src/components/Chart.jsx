import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

function Chart({ predicted, actual }) {
  const labels = actual.map((_, i) => i + 1);

  const data = {
    labels,
    datasets: [
      {
        label: "Actual Price",
        data: actual,
        borderColor: "green",
        tension: 0.4,
      },
      {
        label: "Predicted Price",
        data: predicted,
        borderColor: "orange",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white shadow p-4 rounded">
      <Line data={data} />
    </div>
  );
}

export default Chart;
