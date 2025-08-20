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
  metricType?: 'total' | 'average';
}

const GENDER_COLORS = {
  male: '#2196F3',  // blue
  female: '#FF69B4' // pink
};

export const DwellTimeBarChart: React.FC<DwellTimeBarChartProps> = ({
  data,
  // title = 'Average Dwell Time by Gender',
  isLoading = false,
  metricType = 'average'
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

  // Aggregate data by gender (weighted by event_count for averages)
  const genderData = data.reduce((acc, item) => {
    const gender = item.gender?.toLowerCase();
    if (gender === 'male' || gender === 'female') {
      if (!acc[gender]) {
        acc[gender] = { totalAvgSecondsWeighted: 0, totalEvents: 0, totalDwellSeconds: 0 };
      }
      acc[gender].totalDwellSeconds += item.total_dwell_time || 0;
      acc[gender].totalEvents += item.event_count || 0;
      // Keep a weighted running total for average as well (redundant if we have totals)
      acc[gender].totalAvgSecondsWeighted += (item.avg_dwell_time || 0) * (item.event_count || 0);
    }
    return acc;
  }, {} as Record<string, { totalAvgSecondsWeighted: number; totalEvents: number; totalDwellSeconds: number }>);

  // Calculate dwell time by gender based on metric type (in minutes)
  const chartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        label: metricType === 'total' ? 'Total Dwell Time (Minutes)' : 'Average Dwell Time (Minutes)',
        data: [
          // Male data (first)
          genderData['male'] 
          ? Number((metricType === 'total' 
              ? genderData['male'].totalDwellSeconds / 60 
              : (genderData['male'].totalDwellSeconds / Math.max(genderData['male'].totalEvents, 1)) / 60).toFixed(2))
          : 0,
          // Female data (second)
          genderData['female']
          ? Number((metricType === 'total' 
              ? genderData['female'].totalDwellSeconds / 60 
              : (genderData['female'].totalDwellSeconds / Math.max(genderData['female'].totalEvents, 1)) / 60).toFixed(2))
          : 0
        ],
        backgroundColor: [
          GENDER_COLORS.male,
          GENDER_COLORS.female
        ],
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 50
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: metricType === 'total' ? 'Total Dwell Time by Gender' : 'Average Dwell Time by Gender',
        font: chartTheme.fonts.title,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || context.parsed.x;
            const metricLabel = metricType === 'total' ? 'Total' : 'Average';
            return `${metricLabel}: ${Number(value).toFixed(2)} minutes`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Gender',
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
        }
      },
      y: {
        title: {
          display: true,
          text: 'Minutes',
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
          callback: function(value: any) {
            return `${Number(value).toFixed(0)}`;
          }
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