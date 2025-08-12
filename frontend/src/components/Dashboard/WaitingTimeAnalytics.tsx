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

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const computeRange = (base: Date, period: WTTimePeriod): { start: Date; end: Date } => {
    const d = new Date(base);
    let start = new Date(d);
    let end = new Date(d);

    switch (period) {
      case "day":
        // same day
        break;
      case "week": {
        // Align to Sunday..Saturday
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        start = startOfWeek;
        end = new Date(startOfWeek);
        end.setDate(startOfWeek.getDate() + 6);
        break;
      }
      case "month": {
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        break;
      }
      case "quarter": {
        const q = Math.floor(d.getMonth() / 3);
        const startMonth = q * 3;
        start = new Date(d.getFullYear(), startMonth, 1);
        end = new Date(d.getFullYear(), startMonth + 3, 0);
        break;
      }
      case "year": {
        start = new Date(d.getFullYear(), 0, 1);
        end = new Date(d.getFullYear(), 11, 31);
        break;
      }
    }
    // normalize time to local day bounds
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = computeRange(date, timePeriod);

  const hookParams = {
    timePeriod,
    viewType,
    start_date: formatDate(rangeStart),
    end_date: formatDate(rangeEnd),
    cameraIds: selectedCameras.length ? selectedCameras.join(",") : undefined,
    cameraGroups: selectedGroup ? selectedGroup : undefined,
  };

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useWaitingTimeData(hookParams);

  const handleViewTypeChange = useCallback((type: "hourly" | "daily") => {
    setViewType(type);
  }, []);

  const handleCameraChange = useCallback((cameras: string[]) => {
    setSelectedCameras(cameras);
  }, []);

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
    a.download = `waiting-time-analytics-${viewType}-${formatDate(rangeStart)}-${formatDate(rangeEnd)}.csv`;
    a.click();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, viewType, rangeStart, rangeEnd]);

  const handleExportJSON = useCallback(() => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        viewType,
        start_date: formatDate(rangeStart),
        end_date: formatDate(rangeEnd),
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
    a.download = `waiting-time-analytics-${viewType}-${formatDate(rangeStart)}-${formatDate(rangeEnd)}.json`;
    a.click();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [data, viewType, rangeStart, rangeEnd, selectedCameras]);

  const totalWaiting = useMemo(
    () => data.reduce((sum, item) => sum + item.waiting_count, 0),
    [data],
  );
  const groupCount = useMemo(() => {
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
      <WaitingTimeFilters
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Waiting Time Trends</h3>
          <div className="text-sm text-gray-500">
            {data.length > 0 && (
              <>
                Total Records: {data.reduce((sum, item) => sum + item.waiting_count, 0)} people
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
    </div>
  );
};

export const WaitingTimeAnalytics = React.memo(WaitingTimeAnalyticsComponent);
