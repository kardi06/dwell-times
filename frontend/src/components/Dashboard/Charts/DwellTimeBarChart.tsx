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

  // Aggregate data by gender
  const genderData = data.reduce((acc, item) => {
    const gender = item.gender?.toLowerCase();
    if (gender === 'male' || gender === 'female') {
      if (!acc[gender]) {
        acc[gender] = { total: 0, count: 0, totalDwell: 0 };
      }
      acc[gender].total += item.avg_dwell_time;
      acc[gender].count += 1;
      acc[gender].totalDwell += item.total_dwell_time;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number; totalDwell: number }>);

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
              // OLD hours: genderData['male'].totalDwell / 3600
              ? genderData['male'].totalDwell / 60 
              // OLD hours: genderData['male'].total / genderData['male'].count / 3600
              : (genderData['male'].total / Math.max(genderData['male'].count, 1)) / 60).toFixed(2))
          : 0,
          // Female data (second)
          genderData['female']
          ? Number((metricType === 'total' 
              // OLD hours: genderData['female'].totalDwell / 3600
              ? genderData['female'].totalDwell / 60 
              // OLD hours: genderData['female'].total / genderData['female'].count / 3600
              : (genderData['female'].total / Math.max(genderData['female'].count, 1)) / 60).toFixed(2))
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