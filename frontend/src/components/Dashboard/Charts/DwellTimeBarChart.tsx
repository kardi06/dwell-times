import React from 'react';
import { Bar } from 'react-chartjs-2';
import { chartTheme } from './index';

export interface ChartDataPoint {
  age_group: string;
  gender: string;
  total_dwell_time: number;
  avg_dwell_time: number;
  event_count: number;
}

interface DwellTimeBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  isLoading?: boolean;
}

export const DwellTimeBarChart: React.FC<DwellTimeBarChartProps> = ({
  data,
  title = 'Average Dwell Time by Gender',
  isLoading = false
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

  // Aggregate data by gender
  const genderData = data.reduce((acc, item) => {
    const gender = item.gender?.toLowerCase() || 'other';
    if (!acc[gender]) {
      acc[gender] = { total: 0, count: 0 };
    }
    acc[gender].total += item.avg_dwell_time;
    acc[gender].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate average dwell time by gender
  const chartData = {
    labels: Object.keys(genderData).map(gender => 
      gender.charAt(0).toUpperCase() + gender.slice(1)
    ),
    datasets: [
      {
        label: 'Average Dwell Time (Hours)',
        data: Object.values(genderData).map(({ total, count }) => 
          (total / count) / 3600 // Convert seconds to hours
        ),
        backgroundColor: [
          chartTheme.colors.male,
          chartTheme.colors.female,
          chartTheme.colors.other
        ],
        borderColor: [
          chartTheme.colors.male,
          chartTheme.colors.female,
          chartTheme.colors.other
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: chartTheme.fonts.title,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Average: ${context.parsed.x.toFixed(2)} hours`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
        }
      },
      y: {
        title: {
          display: true,
          text: 'Gender',
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
        }
      }
    },
    animation: {
      duration: chartTheme.animations.duration,
    }
  };

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}; 