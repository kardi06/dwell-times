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
    male: "#2196F3",
    female: "#FF69B4",
  } as const;

  const genders = ["male", "female"] as const;

  // Normalize age group: remove noise like 'inconclusive', 'not_determined';
  // extract two 2-digit numbers and join with a hyphen 'NN-NN'
  const normalizeAge = (raw?: string | null): string | null => {
    if (!raw) return null;
    const v = String(raw).trim().toLowerCase();
    if (v.includes("inconclusive") || v.includes("not_determined")) return null;
    const m = v.match(/(\d{2}).*?(\d{2})/);
    if (!m) return null;
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return `${start}-${end}`; // enforce hyphen
  };

  // Build labels from data (male/female only) using normalized age groups
  const ageGroups: string[] = Array.from(
    new Set(
      data
        .filter((d) => {
          const g = d.gender?.toLowerCase();
          return g === "male" || g === "female";
        })
        .map((d) => normalizeAge(d.age_group))
        .filter((v): v is string => Boolean(v))
    )
  ).sort((a, b) => {
    const sa = parseInt(a.split("-")[0], 10);
    const sb = parseInt(b.split("-")[0], 10);
    return sa - sb;
  });

  if (ageGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">No age-group data available</div>
      </div>
    );
  }

  type GenderAgg = { total: number; count: number; totalDwell: number };

  const aggregatedByAge: Array<{ ageGroup: string; data: Record<string, GenderAgg> }> = ageGroups.map(
    (ageGroup) => {
      const agg: Record<string, GenderAgg> = {};
      data.forEach((item) => {
        const g = item.gender?.toLowerCase();
        const ng = normalizeAge(item.age_group);
        if ((g === "male" || g === "female") && ng === ageGroup) {
          if (!agg[g]) agg[g] = { total: 0, count: 0, totalDwell: 0 };
          agg[g].total += item.avg_dwell_time || 0;
          agg[g].count += 1;
          agg[g].totalDwell += item.total_dwell_time || 0;
        }
      });
      return { ageGroup, data: agg };
    }
  );

  const datasets = genders.map((gender) => ({
    label: gender.charAt(0).toUpperCase() + gender.slice(1),
    data: aggregatedByAge.map(({ data }) => {
      const g = data[gender];
      if (!g) return 0;
      const value = metricType === "total" ? g.totalDwell / 3600 : g.total / Math.max(g.count, 1) / 3600;
      return Number(value.toFixed(3));
    }),
    borderColor: GENDER_COLORS[gender],
    backgroundColor: GENDER_COLORS[gender],
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
        text: metricType === "total" ? "Total Dwell Time by Age and Gender" : "Average Dwell Time by Age and Gender",
        font: chartTheme.fonts.title,
      },
      legend: { display: true, position: "top" as const },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)} hours`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Age Group", font: chartTheme.fonts.axis },
        ticks: { font: chartTheme.fonts.axis },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: metricType === "total" ? "Total Dwell Time (Hours)" : "Average Dwell Time (Hours)",
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
          callback: function (value: any) {
            return Number(value).toFixed(3);
          },
        },
      },
    },
    animation: { duration: chartTheme.animations.duration },
  } as const;

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};
