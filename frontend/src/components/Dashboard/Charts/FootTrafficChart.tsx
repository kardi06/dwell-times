import React from 'react';
import { Line } from 'react-chartjs-2';
import { chartTheme } from './index';

export interface FootTrafficDataPoint {
  time_period: string; // "10 AM", "11 AM", ... "10 PM" or "Monday", "Tuesday", ... "Sunday"
  male_count: number; // unique person_id count for males
  female_count: number; // unique person_id count for females
  other_count: number; // unique person_id count for others
  total_count: number; // total unique person_id count
}

export interface FootTrafficChartConfig {
  timePeriod: 'day' | 'weekly' | 'monthly' | 'yearly';
  selectedDate: Date | null;
  cameraFilter: string; // camera_description or "all"
  viewType: 'hourly' | 'daily';
}

interface FootTrafficChartProps {
  data: FootTrafficDataPoint[];
  config: FootTrafficChartConfig;
  title?: string;
  isLoading?: boolean;
}

export const FootTrafficChart: React.FC<FootTrafficChartProps> = ({
  data,
  config,
  title = 'Foot Traffic - Average No. of Person Visiting Area by Time',
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

  // Prepare chart data
  const labels = data.map(point => point.time_period);
  
  const datasets = [
    {
      label: 'Male',
      data: data.map(point => point.male_count),
      borderColor: chartTheme.colors.male,
      backgroundColor: chartTheme.colors.male,
      tension: 0.4,
      fill: false,
    },
    {
      label: 'Female',
      data: data.map(point => point.female_count),
      borderColor: chartTheme.colors.female,
      backgroundColor: chartTheme.colors.female,
      tension: 0.4,
      fill: false,
    },
    {
      label: 'Other',
      data: data.map(point => point.other_count),
      borderColor: chartTheme.colors.other,
      backgroundColor: chartTheme.colors.other,
      tension: 0.4,
      fill: false,
    }
  ];

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: chartTheme.fonts.title,
      },
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} visitors`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: config.viewType === 'hourly' ? 'Time (Hours)' : 'Day of Week',
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Unique Visitors',
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
      <Line data={chartData} options={options} />
    </div>
  );
}; 