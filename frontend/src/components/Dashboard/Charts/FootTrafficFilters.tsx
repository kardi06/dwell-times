import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FootTrafficChartConfig } from "./FootTrafficChart";

type CameraOption = { value: string; label: string };

interface FootTrafficFiltersProps {
  config: FootTrafficChartConfig;
  onConfigChange: (config: FootTrafficChartConfig) => void;
  availableCameras?: string[];
  isLoading?: boolean;
  // NEW: align with ChartFilters camera API
  cameraOptions?: CameraOption[];
  selectedCamera?: string;
  onCameraChange?: (camera: string) => void;
}

export const FootTrafficFilters: React.FC<FootTrafficFiltersProps> = ({
  config,
  onConfigChange,
  availableCameras = [],
  isLoading = false,
  cameraOptions = [],
  selectedCamera = "",
  onCameraChange,
}) => {
  const timePeriodOptions = [
    { value: "day", label: "Day" },
    { value: "weekly", label: "weekly" },
    { value: "monthly", label: "monthly" },
    { value: "yearly", label: "yearly" },
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
      case "weekly":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week of ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "monthly":
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "yearly":
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
      case "weekly":
        return now;
      case "monthly":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "yearly":
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
        */}

        <div className="flex flex-col min-w-[260px]">
          <label
            htmlFor="cameraFilter"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Camera
          </label>
          <select
            id="cameraFilter"
            value={selectedCamera || (config.cameraFilter === 'all' ? '' : config.cameraFilter)}
            onChange={(e) => {
              const val = e.target.value;
              if (onCameraChange) onCameraChange(val);
              else handleCameraFilterChange(val || 'all');
            }}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">All Cameras</option>
            {cameraOptions.length > 0
              ? cameraOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : availableCameras.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
          </select>
        </div>

        {/**
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
        */}

        {/** Date/Period Picker */}
        {/**
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {config.timePeriod === "day"
              ? "Date"
              : config.timePeriod === "weekly"
                ? "Week"
                : config.timePeriod === "monthly"
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
                  : config.timePeriod === "weekly"
                    ? "MM/dd/yyyy"
                    : config.timePeriod === "monthly"
                      ? "MM/yyyy"
                      : "yyyy"
              }
              showMonthYearPicker={config.timePeriod === "monthly"}
              showYearPicker={config.timePeriod === "yearly"}
              showWeekPicker={config.timePeriod === "weekly"}
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
        */}
      </div>
    </div>
  );
};
