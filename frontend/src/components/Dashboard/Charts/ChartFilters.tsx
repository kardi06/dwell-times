import React from 'react';

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type MetricType = 'total' | 'average';

interface ChartFiltersProps {
  timePeriod: TimePeriod;
  metricType: MetricType;
  onTimePeriodChange: (period: TimePeriod) => void;
  onMetricTypeChange: (type: MetricType) => void;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({
  timePeriod,
  metricType,
  onTimePeriodChange,
  onMetricTypeChange
}) => {
  const timePeriodOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' }
  ];

  const metricTypeOptions = [
    { value: 'total', label: 'Total Dwell Time' },
    { value: 'average', label: 'Average Dwell Time' }
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col">
        <label htmlFor="timePeriod" className="text-sm font-medium text-gray-700 mb-1">
          Time Period
        </label>
        <select
          id="timePeriod"
          value={timePeriod}
          onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {timePeriodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="metricType" className="text-sm font-medium text-gray-700 mb-1">
          Metric Type
        </label>
        <select
          id="metricType"
          value={metricType}
          onChange={(e) => onMetricTypeChange(e.target.value as MetricType)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {metricTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}; 