import React from "react";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalFilters } from "../../../store/globalFilters";
import { useCameras, type CameraOption as HookCameraOption } from "../../../hooks/useCameras";

export type TimePeriod = "day" | "week" | "month" | "quarter" | "year";
export type MetricType = "total" | "average";

type CameraOption = HookCameraOption;

interface ChartFiltersProps {
  timePeriod: TimePeriod;
  metricType: MetricType;
  selectedDate: Date | null;
  onTimePeriodChange: (period: TimePeriod) => void;
  onMetricTypeChange: (type: MetricType) => void;
  onDateChange: (date: Date | null) => void;
  // Camera options & selection
  cameraOptions?: CameraOption[];
  selectedCamera?: string;
  onCameraChange?: (camera: string) => void;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({
  timePeriod,
  metricType,
  selectedDate,
  onTimePeriodChange,
  onMetricTypeChange,
  onDateChange,
  cameraOptions = [],
  selectedCamera = "",
  onCameraChange,
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

  // Pull global Department/Store and fetch cameras accordingly
  const { department: gDept, store: gStore } = useGlobalFilters();
  const { cameras: fetchedCameras, isLoading: camerasLoading } = useCameras({
    department: gDept || undefined,
    store: gStore || undefined,
  });

  // Base options from props or fetched
  const baseOptions: CameraOption[] = cameraOptions.length > 0 ? cameraOptions : fetchedCameras;

  // Shape options per rules
  let displayOptions: { value: string; label: string }[] = [];
  if (!gDept && !gStore) {
    // No department/store: list unique cameras across all, label as camera name only
    const seen = new Set<string>();
    for (const opt of baseOptions) {
      const cam = (opt.value || "").trim();
      if (!cam) continue;
      if (!seen.has(cam)) {
        seen.add(cam);
        displayOptions.push({ value: cam, label: cam });
      }
    }
  } else if (gDept && !gStore) {
    // Add aggregated per-camera '(All Stores)' first
    const seenCam = new Set<string>();
    for (const opt of baseOptions) {
      const cam = (opt.value || "").trim();
      if (!cam) continue;
      if (!seenCam.has(cam)) {
        seenCam.add(cam);
        displayOptions.push({ value: cam, label: `${cam} (All Stores)` });
      }
    }
    // const seenPairs = new Set<string>();
    // for (const opt of baseOptions) {
    //   const cam = (opt.value || "").trim();
    //   if (!cam) continue;
    //   const storeName = (opt.store || "").trim();
    //   if (!storeName) continue; // skip unknown stores
    //   const key = `${cam}::${storeName}`;
    //   if (seenPairs.has(key)) continue;
    //   seenPairs.add(key);
    //   displayOptions.push({ value: cam, label: `${cam} (${storeName})` });
    // }
    // Per-store options omitted when department is selected without store (show aggregated only)

  } else {
    // Store selected: only that store's cameras (API already filtered), label camera name
    const seen = new Set<string>();
    for (const opt of baseOptions) {
      const cam = (opt.value || "").trim();
      if (!cam) continue;
      if (!seen.has(cam)) {
        seen.add(cam);
        displayOptions.push({ value: cam, label: cam });
      }
    }
  }

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

        {/* Camera filter */}
        <div className="flex flex-col min-w-[260px]">
          <label className="text-sm font-medium text-gray-700 mb-1">Camera</label>
          <select
            value={selectedCamera}
            onChange={(e) => onCameraChange && onCameraChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={camerasLoading}
          >
            <option value="">All Cameras</option>
            {displayOptions.map((opt) => (
              <option key={`${opt.value}::${opt.label}`} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
