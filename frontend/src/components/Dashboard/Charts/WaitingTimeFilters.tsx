import React from "react";

interface WaitingTimeFiltersProps {
  viewType: "hourly" | "daily";
  onViewTypeChange: (type: "hourly" | "daily") => void;
  selectedCameras: string[];
  onCameraChange: (cameras: string[]) => void;
  dateRange: [Date, Date];
  onDateRangeChange: (range: [Date, Date]) => void;
  cameras: Array<{
    id: string;
    description: string;
    group: string;
  }>;
  isLoading?: boolean;
}

export const WaitingTimeFilters: React.FC<WaitingTimeFiltersProps> = ({
  viewType,
  onViewTypeChange,
  selectedCameras,
  onCameraChange,
  dateRange,
  onDateRangeChange,
  cameras,
  isLoading = false,
}) => {
  const handleViewTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newViewType = event.target.value as "hourly" | "daily";
    onViewTypeChange(newViewType);
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    onCameraChange(selectedOptions);
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newStartDate = new Date(event.target.value);
    onDateRangeChange([newStartDate, dateRange[1]]);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(event.target.value);
    onDateRangeChange([dateRange[0], newEndDate]);
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const handleQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    onDateRangeChange([startDate, endDate]);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Waiting Time Filters
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* View Type Selector */}
        <div>
          <label
            htmlFor="viewType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            View Type
          </label>
          <select
            id="viewType"
            value={viewType}
            onChange={handleViewTypeChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formatDateForInput(dateRange[0])}
            onChange={handleStartDateChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={formatDateForInput(dateRange[1])}
            onChange={handleEndDateChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Camera Selection */}
        <div>
          <label
            htmlFor="cameras"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Cameras
          </label>
          <div className="space-y-2">
            <select
              id="cameras"
              multiple
              value={selectedCameras}
              onChange={handleCameraChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 min-h-[80px]"
            >
              <option key="all" value="">
                All Cameras
              </option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.description} ({camera.group})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onCameraChange([])}
                disabled={isLoading}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => onCameraChange(cameras.map((c) => c.id))}
                disabled={isLoading}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Select All
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple cameras
            </p>
          </div>
        </div>
      </div>

      {/* Quick Date Range Presets */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Date Ranges
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleQuickDateRange(1)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Last 24h
          </button>
          <button
            type="button"
            onClick={() => handleQuickDateRange(7)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDateRange(30)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDateRange(90)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Last 90 days
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Active Filters:
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• View Type: {viewType === "hourly" ? "Hourly" : "Daily"}</div>
          <div>
            • Date Range: {formatDateForInput(dateRange[0])} to{" "}
            {formatDateForInput(dateRange[1])}
          </div>
          <div>
            • Selected Cameras:{" "}
            {selectedCameras.length > 0
              ? selectedCameras.join(", ")
              : "All Cameras"}
          </div>
        </div>
      </div>
    </div>
  );
};
