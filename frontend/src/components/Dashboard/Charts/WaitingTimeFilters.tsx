// components/Charts/WaitingTimeFilters.tsx
import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export type WTTimePeriod = "day" | "week" | "month" | "quarter" | "year";

interface Props {
  timePeriod: WTTimePeriod;
  onTimePeriodChange: (p: WTTimePeriod) => void;
  viewType: "hourly" | "daily";
  onViewTypeChange: (v: "hourly" | "daily") => void;
  selectedGroup: string;
  onGroupChange: (g: string) => void;
  selectedCameras: string[]; // [] = all
  onCameraChange: (ids: string[]) => void;
  date: Date | null;
  onDateChange: (d: Date | null) => void;
  cameraGroups: string[];
  cameras: { id: string; description: string; group: string }[];
  isLoading?: boolean;
}

const timePeriodOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

const viewTypeOptions = [
  { value: "hourly", label: "Hourly View" },
  { value: "daily", label: "Daily View" },
];

export const WaitingTimeFilters: React.FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  viewType,
  onViewTypeChange,
  selectedGroup,
  onGroupChange,
  selectedCameras,
  onCameraChange,
  date,
  onDateChange,
  cameraGroups,
  cameras,
  isLoading = false,
}) => {
  // ensure a default date when timePeriod berganti
  useEffect(() => {
    if (!date) {
      const now = new Date();
      switch (timePeriod) {
        case "day":     onDateChange(now); break;
        case "week":    onDateChange(now); break;
        case "month":   onDateChange(new Date(now.getFullYear(), now.getMonth(), 1)); break;
        case "quarter": onDateChange(new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1)); break;
        case "year":    onDateChange(new Date(now.getFullYear(), 0, 1)); break;
      }
    }
    // eslint-disable-next-line
  }, [timePeriod, date]);

  // Ambil camera yang harus tampil
  // const visibleCameras = selectedGroup ? cameras.filter((c) => c.group === selectedGroup) : cameras;

  // Camera select: fixed to 'camera cashier'
  return (
    <div className="space-y-4 mb-6 p-4 ">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Time Period (hidden - driven by global) */}
        {/**
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value as WTTimePeriod)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {timePeriodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        */}

        {/* Camera Group (hidden) */}
        {/**
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Camera Group
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => onGroupChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">All Groups</option>
            {cameraGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        */}

        {/* Camera */}
        {/*
        <div className="flex flex-col min-w-[170px]">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Camera
          </label>
          <select
            // value={selectedCameras[0] || ""}
            // onChange={(e) => onCameraChange(e.target.value ? [e.target.
            // value] : [])}
            value={"camera cashier"}
            onChange={() => onCameraChange(["camera cashier"])}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="camera cashier">camera cashier</option>
            {/**
            <option value="">All Cameras</option>
            {visibleCameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.description}
              </option>
            ))}
            
          </select>
        </div>
        */}
        {/* View Type - as tabs */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            View Type
          </label>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded ${viewType === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => onViewTypeChange('hourly')}
              disabled={isLoading}
            >
              Hourly
            </button>
            <button
              className={`px-3 py-1 rounded ${viewType === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => onViewTypeChange('daily')}
              disabled={isLoading}
            >
              Daily
            </button>
          </div>
        </div>

        {/* Date/Period Picker (hidden) */}
        {/**
        <div className="flex flex-col min-w-[130px]">
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
          <DatePicker
            selected={date}
            onChange={(d) => onDateChange(d)}
            dateFormat={
              timePeriod === "day"
                ? "yyyy-MM-dd"
                : timePeriod === "week"
                ? "yyyy-MM-dd"
                : timePeriod === "month"
                ? "yyyy-MM"
                : timePeriod === "quarter"
                ? "yyyy-MM"
                : "yyyy"
            }
            showWeekPicker={timePeriod === "week"}
            showMonthYearPicker={timePeriod === "month" || timePeriod === "quarter"}
            showYearPicker={timePeriod === "year"}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        */}
      </div>
    </div>
  );
};
