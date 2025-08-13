import React from "react";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type TimePeriod = "day" | "week" | "month" | "quarter" | "year";
export type MetricType = "total" | "average";

interface ChartFiltersProps {
  timePeriod: TimePeriod;
  metricType: MetricType;
  selectedDate: Date | null;
  onTimePeriodChange: (period: TimePeriod) => void;
  onMetricTypeChange: (type: MetricType) => void;
  onDateChange: (date: Date | null) => void;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({
  timePeriod,
  metricType,
  selectedDate,
  onTimePeriodChange,
  onMetricTypeChange,
  onDateChange,
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

  // Helper function to format date based on time period
  const formatDateDisplay = (date: Date | null, period: TimePeriod): string => {
    if (!date) return "";

    switch (period) {
      case "day":
        return date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "week":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week of ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "month":
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "quarter":
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(date.getFullYear(), startMonth, 1);
        const endDate = new Date(date.getFullYear(), startMonth + 2, 0);
        return `Q${quarter} ${date.getFullYear()} (${startDate.toLocaleDateString("en-US", { month: "short" })} - ${endDate.toLocaleDateString("en-US", { month: "short" })})`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  // Helper function to get default date based on time period
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
        return new Date(now.getFullYear(), quarter * 3, 1); // Start of current quarter
      case "year":
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
  }, [timePeriod, selectedDate, onDateChange]);

  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      {/* Existing Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* OLD: Time Period control (hidden per new UX) */}
        {/**
        <div className="flex flex-col">
          <label
            htmlFor="timePeriod"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Time Period
          </label>
          <select
            id="timePeriod"
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timePeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        */}

        {/* Metric Type (kept) */}
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

        {/* OLD: Date/Period Picker (hidden per new UX) */}
        {/**
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {timePeriod === "day"
              ? "Date"
              : timePeriod === "week"
                ? "Week"
                : timePeriod === "month"
                  ? "Month"
                  : timePeriod === "quarter"
                    ? "Quarter"
                    : "Year"}
          </label>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={selectedDate}
              onChange={onDateChange}
              dateFormat={
                timePeriod === "day"
                  ? "MM/dd/yyyy"
                  : timePeriod === "week"
                    ? "MM/dd/yyyy"
                    : timePeriod === "month"
                      ? "MM/yyyy"
                      : timePeriod === "quarter"
                        ? "MM/yyyy"
                        : "yyyy"
              }
              showMonthYearPicker={
                timePeriod === "month" || timePeriod === "quarter"
              }
              showYearPicker={timePeriod === "year"}
              showWeekPicker={timePeriod === "week"}
              placeholderText={`Select ${timePeriod}`}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedDate && (
              <span className="text-sm text-gray-600">
                {formatDateDisplay(selectedDate, timePeriod)}
              </span>
            )}
          </div>
        </div>
        */}
      </div>
    </div>
  );
};
