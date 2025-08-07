// components/ChartFiltersSection.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
// import { Button } from '../ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  Filter, 
  // Calendar, 
  // RefreshCw 
} from 'lucide-react';
import { FootTrafficChartConfig } from './Charts/FootTrafficChart';
import { useCameras } from '../../hooks/useCameras';

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface ChartFiltersSectionProps {
  // filters: {
  //   timePeriod: TimePeriod;
  //   cameraGroup: string;
  //   camera: string;
  //   selectedDate: Date | null;
  // };
  timePeriod: TimePeriod;
  selectedDate: Date | null;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDateChange: (date: Date | null) => void;
  availableCameraGroups: string[];
  availableCameras: string[];
  // onFiltersChange: (filters: {
  //   timePeriod: TimePeriod;
  //   cameraGroup: string;
  //   camera: string;
  //   selectedDate: Date | null;
  // }) => void;
  // onRefresh: () => void;
  config: FootTrafficChartConfig;
  onConfigChange: (config: FootTrafficChartConfig) => void;
  loading: boolean;
}

const timePeriodOptions: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

export const ChartFiltersSection: React.FC<ChartFiltersSectionProps> = ({
  // filters,
  timePeriod,
  selectedDate,
  onTimePeriodChange,
  onDateChange,
  availableCameraGroups,
  availableCameras,
  // onFiltersChange,
  // onRefresh,
  config,
  onConfigChange,
  loading,
}) => {
  // const { timePeriod, cameraGroup, camera, selectedDate } = filters;

  const { cameras, isLoading: camerasLoading } = useCameras();
  availableCameras = cameras;
  loading = camerasLoading;
  // Helper function to format date based on time period
  const formatDateDisplay = (date: Date | null, period: TimePeriod): string => {
    if (!date) return '';
    
    switch (period) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      case 'quarter':
        const quarter = Math.floor((date.getMonth() / 3)) + 1;
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(date.getFullYear(), startMonth, 1);
        const endDate = new Date(date.getFullYear(), startMonth + 2, 0);
        return `Q${quarter} ${date.getFullYear()} (${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { month: 'short' })})`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  // Helper function to get default date based on time period
  const getDefaultDate = (period: TimePeriod): Date => {
    const now = new Date();
    switch (period) {
      case 'day':
        return now;
      case 'week':
        return now;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor((now.getMonth() / 3));
        return new Date(now.getFullYear(), quarter * 3, 1); // Start of current quarter
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return now;
    }
  };

  // Set default date when time period changes
  React.useEffect(() => {
    if (!selectedDate) {
      onDateChange(getDefaultDate(timePeriod));
    }
    if (!config.selectedDate) {
      const newConfig = {
        ...config,
        // selectedDate: getDefaultDate(config.timePeriod)
      };
      onConfigChange(newConfig);
    }
  }, [timePeriod, selectedDate, onDateChange, config.timePeriod, onConfigChange]);

  const handleTimePeriodChange = (timePeriod: TimePeriod) => {
    onTimePeriodChange(timePeriod);
    const newConfig = {
      ...config,
      timePeriod,
      selectedDate: getDefaultDate(timePeriod)
    };
    
  };

  // Handle camera filter change
  const handleCameraFilterChange = (cameraFilter: string) => {
    const newConfig = {
      ...config,
      cameraFilter
    };
    onConfigChange(newConfig);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex items-center justify-between pb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 mr-2 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Time Period */}
        <div className="flex flex-col">
          <label
            htmlFor="timePeriod"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Time Period
          </label>
          {/* <Select
            id="timePeriod"
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {timePeriodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
          <select
            id="timePeriod"
            value={timePeriod}
            // onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
            onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timePeriodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Group */}
        <div className="flex flex-col">
          <label
            htmlFor="cameraGroup"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Camera Group
          </label>
          <Select
            // id="cameraGroup"
            // value={cameraGroup}
            // onValueChange={(value) =>
            //   onFiltersChange({ ...filters, cameraGroup: value })
            // }
          >
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {availableCameraGroups.map((grp) => (
                <SelectItem key={grp} value={grp}>
                  {grp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera */}
        <div className="flex flex-col">
          <label
            htmlFor="camera"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Camera
          </label>
          {/* <Select
            // id="camera"
            // value={camera}
            // onValueChange={(value) =>
            //   onFiltersChange({ ...filters, camera: value })
            // }
          >
            <SelectTrigger>
              <SelectValue placeholder="All cameras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cameras</SelectItem>
              {availableCameras.map((cam) => (
                <SelectItem key={cam} value={cam}>
                  {cam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
          <select
            id="cameraFilter"
            value={config.cameraFilter}
            onChange={(e) => handleCameraFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="all">All Cameras</option>
            {availableCameras.map(camera => (
              <option key={camera} value={camera}>
                {camera}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {timePeriod === 'day' ? 'Date' : 
            timePeriod === 'week' ? 'Week' : 
            timePeriod === 'month' ? 'Month' : 
            timePeriod === 'quarter' ? 'Quarter' : 'Year'}
          </label>
          <div className="flex items-center space-x-2">
            {/* <Calendar/> */}
            {/* <DatePicker
              selected={selectedDate}
              onChange={(date) =>
                onFiltersChange({ ...filters, selectedDate: date })
              }
              dateFormat="MM/dd/yyyy"
              placeholderText="Select date"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            /> */}
            <DatePicker
            selected={selectedDate}
            onChange={onDateChange}
            dateFormat={timePeriod === 'day' ? 'MM/dd/yyyy' : 
                       timePeriod === 'week' ? 'MM/dd/yyyy' : 
                       timePeriod === 'month' ? 'MM/yyyy' : 
                       timePeriod === 'quarter' ? 'MM/yyyy' : 'yyyy'}
            showMonthYearPicker={timePeriod === 'month' || timePeriod === 'quarter'}
            showYearPicker={timePeriod === 'year'}
            showWeekPicker={timePeriod === 'week'}
            placeholderText={`Select ${timePeriod}`}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {selectedDate && (
            <span className="block w-full whitespace-nowrap overflow-hidden text-ellipsis text-sm text-gray-600">
              {formatDateDisplay(selectedDate, timePeriod)}
            </span>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartFiltersSection;
