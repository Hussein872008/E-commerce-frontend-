import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrderStatusChart({ data }) {
  const completed = Number(data?.completed) || 0;
  const pending = Number(data?.pending) || 0;
  const cancelled = Number(data?.cancelled) || 0;

  const total = completed + pending + cancelled;

  const chartData = {
    labels: ["Completed", "Processing", "Cancelled"],
    datasets: [
      {
        data: [completed, pending, cancelled],
        backgroundColor: [
          "#10B981",
          "#3B82F6",
          "#EF4444"  
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (total === 0) {
    return (
      <div className="h-64 w-64 flex items-center justify-center text-sm text-gray-500">
        No order data
      </div>
    );
  }

  return <Pie data={chartData} options={options} />;
}
