import React from "react";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalFilters } from "../../../store/globalFilters";
import { useCameras, type CameraOption as HookCameraOption } from "../../../hooks/useCameras";

export type TimePeriod = "day" | "week" | "month" | "quarter" | "year";
export type MetricType = "total" | "average";

// New: camera category type
export type CameraCategory = 'all' | 'entrance' | 'store';

type CameraOption = HookCameraOption;

interface ChartFiltersProps {
  timePeriod: TimePeriod;
  metricType: MetricType;
  selectedDate: Date | null;
  onTimePeriodChange: (period: TimePeriod) => void;
  onMetricTypeChange: (type: MetricType) => void;
  onDateChange: (date: Date | null) => void;
  // Camera category selection
  cameraCategory?: CameraCategory;
  onCameraCategoryChange?: (category: CameraCategory) => void;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({
  timePeriod,
  metricType,
  selectedDate,
  onTimePeriodChange,
  onMetricTypeChange,
  onDateChange,
  cameraCategory = 'all',
  onCameraCategoryChange,
}) => {
  const timePeriodOptions = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
  ];

  const metricTypeOptions = [
    { value: "total", label: "Total Dwell Time" },
    { value: "average", label: "Average Dwell Time" },
  ];

  // Keep date defaulting logic
  const getDefaultDate = (period: TimePeriod): Date => {
    const now = new Date();
    switch (period) {
      case "day":
        return now;
      case "week":
        return now;
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      default:
        return now;
    }
  };

  React.useEffect(() => {
    if (!selectedDate) {
      onDateChange(getDefaultDate(timePeriod));
    }
  }, [timePeriod, selectedDate, onDateChange]);

  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label
            htmlFor="metricType"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Metric Type
          </label>
          <select
            id="metricType"
            value={metricType}
            onChange={(e) => onMetricTypeChange(e.target.value as MetricType)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {metricTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Category */}
        <div className="flex flex-col min-w-[260px]">
          <label className="text-sm font-medium text-gray-700 mb-1">Camera Category</label>
          <select
            value={cameraCategory}
            onChange={(e) => onCameraCategoryChange && onCameraCategoryChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Cameras (Entrance + Store)</option>
            <option value="entrance">Entrance Cameras</option>
            <option value="store">Store Cameras</option>
          </select>
        </div>
      </div>
    </div>
  );
};
