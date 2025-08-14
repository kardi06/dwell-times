import React from "react";
import { Line } from "react-chartjs-2";

interface Point {
  time_period: string;
  male_count?: number;
  female_count?: number;
  total_count?: number;
  age_groups?: { age_group: string; count: number }[];
  gender_age?: { male: { age_group: string; count: number }[]; female: { age_group: string; count: number }[] };
}

interface Props {
  data: Point[];
  title?: string;
  isLoading?: boolean;
  viewType: "hourly" | "daily";
  breakdown: "none" | "gender" | "age" | "gender_age";
}

export const FootTrafficTimeChart: React.FC<Props> = ({ data, title = "Foot Traffic by Time", isLoading = false, viewType, breakdown }) => {
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

  const labels = data.map((d) => d.time_period);

  const datasets: any[] = [];
  if (breakdown === "none") {
    datasets.push({
      label: "Total",
      data: data.map((d) => d.total_count ?? 0),
      borderColor: "#0ea5e9",
      backgroundColor: "#0ea5e9",
      tension: 0.35,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  } else if (breakdown === "gender") {
    datasets.push({
      label: "Male",
      data: data.map((d) => d.male_count ?? 0),
      borderColor: "#3b82f6",
      backgroundColor: "#3b82f6",
      tension: 0.35,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    });
    datasets.push({
      label: "Female",
      data: data.map((d) => d.female_count ?? 0),
      borderColor: "#FF69B4",
      backgroundColor: "#FF69B4",
      tension: 0.35,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  } else if (breakdown === "age") {
    const ageSet = new Set<string>();
    data.forEach((p) => (p.age_groups || []).forEach((ag) => {
      const n = ag.age_group || "";
      if (n.toLowerCase() !== 'inconclusive') ageSet.add(n);
    }));
    const ages = Array.from(ageSet);
    ages.forEach((age, idx) => {
      const color = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#a855f7", "#0ea5e9"][idx % 7];
      datasets.push({
        label: age,
        data: data.map((d) => (d.age_groups || []).find((ag) => (ag.age_group || '').toLowerCase() === age.toLowerCase())?.count ?? 0),
        borderColor: color,
        backgroundColor: color,
        tension: 0.35,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
      });
    });
  } else {
    const labelsList: { key: string; label: string; color: string }[] = [];
    const palette = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#a855f7", "#0ea5e9", "#f97316", "#22d3ee"];
    const ageSet = new Set<string>();
    data.forEach((p) => {
      (p.gender_age?.male || []).forEach((ag) => { const n = ag.age_group || ''; if (n.toLowerCase() !== 'inconclusive') ageSet.add(n); });
      (p.gender_age?.female || []).forEach((ag) => { const n = ag.age_group || ''; if (n.toLowerCase() !== 'inconclusive') ageSet.add(n); });
    });
    const ages = Array.from(ageSet);
    ages.forEach((age, i) => {
      labelsList.push({ key: `male:${age}`, label: `Male ${age}`, color: palette[(2*i) % palette.length] });
      labelsList.push({ key: `female:${age}`, label: `Female ${age}`, color: palette[(2*i+1) % palette.length] });
    });
    labelsList.forEach(({ key, label, color }) => {
      const [g, age] = key.split(":");
      datasets.push({
        label,
        data: data.map((d) => {
          const arr = g === 'male' ? (d.gender_age?.male || []) : (d.gender_age?.female || []);
          return arr.find((ag) => (ag.age_group || '').toLowerCase() === age.toLowerCase())?.count ?? 0;
        }),
        borderColor: color,
        backgroundColor: color,
        tension: 0.35,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
      });
    });
  }

  const chartData = { labels, datasets };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: "600" },
      },
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} visitors`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: viewType === "hourly" ? "Time (Hours)" : "Day of Week",
        },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Visitors" },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};
