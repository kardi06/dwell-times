import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FootTrafficChartConfig } from "./FootTrafficChart";

interface FootTrafficFiltersProps {
  config: FootTrafficChartConfig;
  onConfigChange: (config: FootTrafficChartConfig) => void;
  availableCameras?: string[];
  isLoading?: boolean;
}

export const FootTrafficFilters: React.FC<FootTrafficFiltersProps> = ({
  config,
  onConfigChange,
  availableCameras = [],
  isLoading = false,
}) => {
  const timePeriodOptions = [
    { value: "day", label: "Day" },
    { value: "week", label: "week" },
    { value: "month", label: "month" },
    { value: "year", label: "year" },
  ];

  const viewTypeOptions = [
    { value: "hourly", label: "Hourly View" },
    { value: "daily", label: "Daily View" },
  ];

  // Helper function to format date based on time period
  const formatDateDisplay = (
    date: Date | null,
    period: FootTrafficChartConfig["timePeriod"],
  ): string => {
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
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  // Helper function to get default date based on time period
  const getDefaultDate = (
    period: FootTrafficChartConfig["timePeriod"],
  ): Date => {
    const now = new Date();
    switch (period) {
      case "day":
        return now;
      case "week":
        return now;
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      default:
        return now;
    }
  };

  // Set default date when time period changes
  useEffect(() => {
    if (!config.selectedDate) {
      const newConfig = {
        ...config,
        selectedDate: getDefaultDate(config.timePeriod),
      };
      onConfigChange(newConfig);
    }
  }, [config.timePeriod]);

  // Handle time period change
  const handleTimePeriodChange = (
    timePeriod: FootTrafficChartConfig["timePeriod"],
  ) => {
    const newConfig = {
      ...config,
      timePeriod,
      selectedDate: getDefaultDate(timePeriod),
    };

    // If changing to 'day', force view type to 'hourly'
    if (timePeriod === "day") {
      newConfig.viewType = "hourly";
    }

    onConfigChange(newConfig);
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    const newConfig = {
      ...config,
      selectedDate: date,
    };
    onConfigChange(newConfig);
  };

  // Handle camera filter change
  const handleCameraFilterChange = (cameraFilter: string) => {
    const newConfig = {
      ...config,
      cameraFilter,
    };
    onConfigChange(newConfig);
  };

  // Handle view type change
  const handleViewTypeChange = (viewType: "hourly" | "daily") => {
    const newConfig = {
      ...config,
      viewType,
    };
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      {/* Time Period and Camera Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label
            htmlFor="timePeriod"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Time Period
          </label>
          <select
            id="timePeriod"
            value={config.timePeriod}
            onChange={(e) =>
              handleTimePeriodChange(
                e.target.value as FootTrafficChartConfig["timePeriod"],
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {timePeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="cameraFilter"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Camera
          </label>
          <select
            id="cameraFilter"
            value={config.cameraFilter}
            onChange={(e) => handleCameraFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="all">All Cameras</option>
            {availableCameras.map((camera) => (
              <option key={camera} value={camera}>
                {camera}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="viewType"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            View Type
          </label>
          <select
            id="viewType"
            value={config.viewType}
            onChange={(e) =>
              handleViewTypeChange(e.target.value as "hourly" | "daily")
            }
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || config.timePeriod === "day"}
          >
            {viewTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {/* Date/Period Picker */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {config.timePeriod === "day"
              ? "Date"
              : config.timePeriod === "week"
                ? "Week"
                : config.timePeriod === "month"
                  ? "Month"
                  : "Year"}
          </label>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={config.selectedDate}
              onChange={handleDateChange}
              dateFormat={
                config.timePeriod === "day"
                  ? "MM/dd/yyyy"
                  : config.timePeriod === "week"
                    ? "MM/dd/yyyy"
                    : config.timePeriod === "month"
                      ? "MM/yyyy"
                      : "yyyy"
              }
              showMonthYearPicker={config.timePeriod === "month"}
              showYearPicker={config.timePeriod === "year"}
              showWeekPicker={config.timePeriod === "week"}
              calendarStartDay={1}
              placeholderText={`Select ${config.timePeriod}`}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            {config.selectedDate && (
              <span className="text-sm text-gray-600">
                {formatDateDisplay(config.selectedDate, config.timePeriod)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
