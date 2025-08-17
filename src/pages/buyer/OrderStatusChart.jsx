import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// تسجيل العناصر المطلوبة
ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrderStatusChart({ data }) {
  const chartData = {
    labels: ["Completed", "Processing", "Cancelled"],
    datasets: [
      {
        data: [data.completed, data.pending, data.cancelled],
        backgroundColor: [
          "#10B981", // أخضر مكتمل
          "#3B82F6", // أزرق جاري المعالجة
          "#EF4444"  // أحمر ملغي
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

  return <Pie data={chartData} options={options} />;
}
