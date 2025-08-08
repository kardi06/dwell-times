import React, { useState, useEffect, useMemo, useCallback } from "react";
import { WaitingTimeChart } from "./Charts/WaitingTimeChart";
import { WaitingTimeFilters, WTTimePeriod } from "./Charts/WaitingTimeFilters";
import { useWaitingTimeData } from "../../hooks/useWaitingTimeData";
import { analyticsAPI } from "../../services/api";

interface Camera {
  id: string;
  description: string;
  group: string;
}

const WaitingTimeAnalyticsComponent: React.FC = () => {
  // State for filters
  // const [viewType, setViewType] = useState<"hourly" | "daily">("hourly");
  const [timePeriod, setTimePeriod] = useState<WTTimePeriod>("day");
  const [viewType, setViewType] = useState<"hourly" | "daily">("hourly");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  // const [dateRange, setDateRange] = useState<[Date, Date]>([
  //   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  //   new Date(), // Today
  // ]);
  const [date, setDate] = useState<Date>(new Date());
  const [cameras, setCameras] = useState<Camera[]>([]);

  // Fetch cameras on component mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await analyticsAPI.getCameras();
        if (response.data && response.data.cameras) {
          setCameras(response.data.cameras);
        }
      } catch (error) {
        console.error("Failed to fetch cameras:", error);
      }
    };

    fetchCameras();
  }, []);

  // Prepare parameters for the hook
  const hookParams = {
    // viewType,
    // startDate: dateRange[0].toISOString().split("T")[0],
    // endDate: dateRange[1].toISOString().split("T")[0],
    // cameraIds:
    //   selectedCameras.length > 0 ? selectedCameras.join(",") : undefined,
    timePeriod,
    viewType,
    // startDate: date.toISOString().split("T")[0],
    start_date: date ? date.toISOString().split("T")[0] : undefined, // <--
    end_date: date ? date.toISOString().split("T")[0] : undefined,   // <--
    cameraIds: selectedCameras.length ? selectedCameras.join(",") : undefined,
    cameraGroups: selectedGroup ? selectedGroup : undefined,
  };

  // Fetch waiting time data
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useWaitingTimeData(hookParams);

  // Handle filter changes with useCallback for performance
  const handleViewTypeChange = useCallback((type: "hourly" | "daily") => {
    setViewType(type);
  }, []);

  const handleCameraChange = useCallback((cameras: string[]) => {
    setSelectedCameras(cameras);
  }, []);

  // const handleDateRangeChange = useCallback((range: [Date, Date]) => {
  //   setDateRange(range);
  // }, []);

  // Export functionality with useCallback for performance
  const handleExport = useCallback(() => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent = [
      "Time Period,Waiting Count,Camera Description,Camera Group",
      ...data.map(
        (item) =>
          `${item.time_period},${item.waiting_count},"${item.camera_info.camera_description}","${item.camera_info.camera_group}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // a.download = `waiting-time-analytics-${viewType}-${dateRange[0].toISOString().split("T")[0]}-${dateRange[1].toISOString().split("T")[0]}.csv`;
    a.download = `waiting-time-analytics-${viewType}-${date.toISOString().split("T")[0]}.csv`;
    a.click();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, viewType, date]);

  // Export JSON functionality with useCallback for performance
  const handleExportJSON = useCallback(() => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        viewType,
        // 
        date,
        selectedCameras,
        totalRecords: data.reduce((sum, item) => sum + item.waiting_count, 0),
      },
      data,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // a.download = `waiting-time-analytics-${viewType}-${dateRange[0].toISOString().split("T")[0]}-${dateRange[1].toISOString().split("T")[0]}.json`;
    a.download = `waiting-time-analytics-${viewType}-${date.toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, viewType, date, selectedCameras]);

  const totalWaiting = useMemo(
    () => data.reduce((sum, item) => sum + item.waiting_count, 0),
    [data],
  );
  // const groupCount = useMemo(
  //   () => new Set(data.map(item => item.camera_info.camera_group)).size,
  //   [data]
  // );
  const groupCount = useMemo(() => {
    // collect only those items that do have camera_info
    const groups = data
      .filter((item) => item.camera_info != null)
      .map((item) => item.camera_info.camera_group);
    return new Set(groups).size;
  }, [data]);
  const timePeriodCount = useMemo(
    () => new Set(data.map((item) => item.time_period)).size,
    [data],
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      {/* <div className="flex justify-between items-center"> */}
        {/* <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={isLoading || !data || data.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={isLoading || !data || data.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
        </div> */}
      {/* </div> */}

      {/* Filters */}
      <WaitingTimeFilters
        // viewType={viewType}
        // onViewTypeChange={handleViewTypeChange}
        // selectedCameras={selectedCameras}
        // onCameraChange={handleCameraChange}
        // dateRange={dateRange}
        // onDateRangeChange={handleDateRangeChange}
        // cameras={cameras}
        // isLoading={isLoading}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        selectedCameras={selectedCameras}
        onCameraChange={handleCameraChange}
        date={date}
        onDateChange={(d) => setDate(d || new Date())}
        cameraGroups={[...new Set(cameras.map((c) => c.group))]}
        cameras={cameras}
        isLoading={isLoading}
      />

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Waiting Time Trends
          </h3>
          <div className="text-sm text-gray-500">
            {data.length > 0 && (
              <>
                Total Records:{" "}
                {data.reduce((sum, item) => sum + item.waiting_count, 0)} people
              </>
            )}
          </div>
        </div>

        <WaitingTimeChart
          data={data}
          viewType={viewType}
          title={`Waiting Time Analytics (${viewType === "hourly" ? "Hourly" : "Daily"} View)`}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Summary Stats */}
      {/* {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500">
              Total People Waiting
            </h4>
            <p className="text-2xl font-bold text-gray-900">{totalWaiting}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500">Time Periods</h4>
            <p className="text-2xl font-bold text-gray-900">
              {timePeriodCount}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-sm font-medium text-gray-500">Camera Groups</h4>
            <p className="text-2xl font-bold text-gray-900">{groupCount}</p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export const WaitingTimeAnalytics = React.memo(WaitingTimeAnalyticsComponent);
