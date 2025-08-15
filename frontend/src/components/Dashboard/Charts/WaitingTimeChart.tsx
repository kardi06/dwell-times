import React from "react";
import { Bubble } from "react-chartjs-2";
import { Chart, Tooltip, Title, Legend, LinearScale, PointElement, CategoryScale } from 'chart.js';

Chart.register(Tooltip, Title, Legend, LinearScale, PointElement, CategoryScale);

export interface WaitingTimeDataPoint {
  time_period: string;    // Should be date/hour string
  waiting_count: number;  // Value for that time
  camera_info: {
    camera_description: string;
    camera_group: string;
  };
}

interface WaitingTimeChartProps {
  data: WaitingTimeDataPoint[];
  viewType: "hourly" | "daily";
  title?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export const WaitingTimeChart: React.FC<WaitingTimeChartProps> = ({
  data,
  viewType,
  title = "Waiting Time Analytics",
  isLoading,
  error,
}) => {
  // Data is pre-filtered to 'camera cashier' upstream
  // Generate labels
  let labels: string[];
  if (viewType === "hourly") {
    const hours = Array.from({ length: 13 }, (_, i) => i + 10);
    labels = hours.map(h => {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const suffix = h < 12 ? "AM" : "PM";
      return `${hour12} ${suffix}`;
    });
  } else {
    labels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  }

  // Create dataset for bubbles
  const points = labels.map((label, idx) => {
    let match: WaitingTimeDataPoint | undefined;
    if (viewType === 'hourly') {
      match = data.find(d => {
        const dt = new Date(d.time_period);
        const h = dt.getHours();
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const suffix = h < 12 ? "AM" : "PM";
        return `${hour12} ${suffix}` === label;
      });
    } else {
      match = data.find(d => {
        const weekday = new Date(d.time_period).toLocaleDateString("en-US", { weekday: "long" });
        return weekday === label;
      });
    }
    const value = match ? match.waiting_count : 0;
    // r (radius) should be scaled, eg. min: 5, max: 25
    return { x: label, y: value, r: value > 0 ? 8 + value * 4 : 6 };
  });

  const chartData = {
    datasets: [
      {
        label: "Total Person",
        data: points,
        backgroundColor: "rgba(255, 99, 132, 0.6)", // Red
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(255,99,132,0.8)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
        font: { size: 20, weight: "bold" as const},
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Total Person: ${context.raw.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "category" as const,
        labels,
        title: {
          display: true,
          text: viewType === "hourly" ? "Time (Hour)" : "Day of Week",
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        min: 0,
        title: {
          display: true,
          text: "Number of People Waiting",
        },
        ticks: {
          precision: 0,
          stepSize: 1
        }
      }
    }
  };

  // Loading/Error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading waiting time chart...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-red-500">Error loading chart: {error.message}</div>
      </div>
    );
  }
  if (!data || data.length === 0 || points.every((p) => p.y === 0)) {
    return (
      <div className="py-12 text-center text-gray-400 italic text-lg">
        No waiting time data available for the selected period.
      </div>
    );
  }

  return (
    <div className="w-auto h-96">
      <Bubble data={chartData} options={options}/>
    </div>
  );
};
