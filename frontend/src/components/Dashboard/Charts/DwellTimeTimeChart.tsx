import React from "react";
import { Line } from "react-chartjs-2";

interface Point {
	time_period: string;
	male_avg_minutes: number;
	female_avg_minutes: number;
	total_avg_minutes: number;
	sample_size: number;
}

interface Props {
	data: Point[];
	title?: string;
	isLoading?: boolean;
	viewType: "hourly" | "daily";
}

export const DwellTimeTimeChart: React.FC<Props> = ({ data, title = "Average Dwell Time by Time", isLoading = false, viewType }) => {
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
	const chartData = {
		labels,
		datasets: [
			{
				label: "Male",
				data: data.map((d) => d.male_avg_minutes),
				borderColor: "#3b82f6",
				backgroundColor: "#3b82f6",
				tension: 0.35,
				fill: false,
				pointRadius: 3,
				pointHoverRadius: 5,
			},
			{
				label: "Female",
				data: data.map((d) => d.female_avg_minutes),
				borderColor: "#ef4444",
				backgroundColor: "#ef4444",
				tension: 0.35,
				fill: false,
				pointRadius: 3,
				pointHoverRadius: 5,
			},
		],
	};

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
					label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} min`,
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
				title: { display: true, text: "Avg Dwell (min)" },
			},
		},
	};

	return (
		<div className="w-full h-64">
			<Line data={chartData} options={options} />
		</div>
	);
};
