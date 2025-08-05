import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

interface ChartFiltersSectionProps {
  dwellTimeFilters: {
    timePeriod: 'day' | 'week' | 'month' | 'quarter' | 'year';
    metricType: 'total' | 'average';
    selectedDate: Date | null;
  };
  footTrafficFilters: {
    timePeriod: 'day' | 'weekly' | 'monthly' | 'yearly';
    viewType: 'hourly' | 'daily';
    cameraFilter: string;
    selectedDate: Date | null;
  };
  availableCameras: string[];
  onDwellTimeFiltersChange: (filters: any) => void;
  onFootTrafficFiltersChange: (filters: any) => void;
  onRefresh: () => void;
  loading: boolean;
}

const ChartFiltersSection: React.FC<ChartFiltersSectionProps> = ({
  dwellTimeFilters,
  footTrafficFilters,
  availableCameras,
  onDwellTimeFiltersChange,
  onFootTrafficFiltersChange,
  onRefresh,
  loading
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

  const footTrafficTimeOptions = [
    { value: 'day', label: 'Day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const viewTypeOptions = [
    { value: 'hourly', label: 'Hourly View' },
    { value: 'daily', label: 'Daily View' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Dwell Time Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Dwell Time Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Period
              </label>
              <Select
                value={dwellTimeFilters.timePeriod}
                onValueChange={(value) => onDwellTimeFiltersChange({
                  ...dwellTimeFilters,
                  timePeriod: value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Metric Type
              </label>
              <Select
                value={dwellTimeFilters.metricType}
                onValueChange={(value) => onDwellTimeFiltersChange({
                  ...dwellTimeFilters,
                  metricType: value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Date
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {dwellTimeFilters.selectedDate?.toLocaleDateString() || 'Select date'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foot Traffic Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Foot Traffic Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Period
              </label>
              <Select
                value={footTrafficFilters.timePeriod}
                onValueChange={(value) => onFootTrafficFiltersChange({
                  ...footTrafficFilters,
                  timePeriod: value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {footTrafficTimeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                View Type
              </label>
              <Select
                value={footTrafficFilters.viewType}
                onValueChange={(value) => onFootTrafficFiltersChange({
                  ...footTrafficFilters,
                  viewType: value as any
                })}
                disabled={footTrafficFilters.timePeriod === 'day'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Camera
            </label>
            <Select
              value={footTrafficFilters.cameraFilter}
              onValueChange={(value) => onFootTrafficFiltersChange({
                ...footTrafficFilters,
                cameraFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cameras</SelectItem>
                {availableCameras.map(camera => (
                  <SelectItem key={camera} value={camera}>
                    {camera}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Date
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {footTrafficFilters.selectedDate?.toLocaleDateString() || 'Select date'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartFiltersSection; 