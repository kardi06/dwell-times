import React from "react";
import { Line } from "react-chartjs-2";
import { chartTheme } from "./index";
import { ChartDataPoint } from "./DwellTimeBarChart";

interface DwellTimeLineChartProps {
  data: ChartDataPoint[];
  title?: string;
  isLoading?: boolean;
  metricType?: "total" | "average";
}

export const DwellTimeLineChart: React.FC<DwellTimeLineChartProps> = ({
  data,
  // title = 'Average Dwell Time by Age and Gender',
  isLoading = false,
  metricType = "average",
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const GENDER_COLORS = {
    male: "#2196F3", // blue
    female: "#FF69B4", // pink
  };

  // Group data by age group and gender
  const ageGroups = [
    "10–19",
    "20–29",
    "30–39",
    "40–49",
    "50–59",
    // 'other'
  ];
  const genders = ["male", "female"];

  // Aggregate data by age group and gender
  const aggregatedData = ageGroups.map((ageGroup) => {
    const ageData: Record<
      string,
      { total: number; count: number; totalDwell: number }
    > = {};

    data.forEach((item) => {
      const itemAgeGroup = item.age_group || "Other";
      const gender = item.gender?.toLowerCase();

      if (
        itemAgeGroup === ageGroup &&
        (gender === "male" || gender === "female")
      ) {
        if (!ageData[gender]) {
          ageData[gender] = { total: 0, count: 0, totalDwell: 0 };
        }
        ageData[gender].total += item.avg_dwell_time;
        ageData[gender].count += 1;
        ageData[gender].totalDwell += item.total_dwell_time;
      }
    });

    return { ageGroup, data: ageData };
  });

  const datasets = genders.map((gender) => ({
    label: gender.charAt(0).toUpperCase() + gender.slice(1),
    data: aggregatedData.map(({ data: ageData }) => {
      const genderData = ageData[gender];
      if (!genderData) return 0;

      const value =
        metricType === "total"
          ? genderData.totalDwell / 3600
          : genderData.total / genderData.count / 3600;

      return Number(value.toFixed(3)); // Format to 3 decimal places
    }),
    borderColor: GENDER_COLORS[gender as keyof typeof GENDER_COLORS],
    backgroundColor: GENDER_COLORS[gender as keyof typeof GENDER_COLORS],
    tension: 0.4,
    fill: false,
  }));

  const chartData = {
    labels: ageGroups,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text:
          metricType === "total"
            ? "Total Dwell Time by Age and Gender"
            : "Average Dwell Time by Age and Gender",
        font: chartTheme.fonts.title,
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const metricLabel = metricType === "total" ? "Total" : "Average";
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)} hours`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Age Group",
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text:
            metricType === "total"
              ? "Total Dwell Time (Hours)"
              : "Average Dwell Time (Hours)",
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
          callback: function (value: any) {
            return value.toFixed(3);
          },
        },
      },
    },
    animation: {
      duration: chartTheme.animations.duration,
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};
