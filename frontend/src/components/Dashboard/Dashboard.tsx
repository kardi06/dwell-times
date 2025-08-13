import React, { useState, useEffect } from "react";
import { 
  Card, 
  Alert, 
  // Button, 
  // Loading 
} from "../ui";
// import EventTable from './EventTable';
import { DwellTimeBarChart, DwellTimeLineChart, ChartFilters } from "./Charts";
import { ChartDataPoint } from "./Charts/DwellTimeBarChart";
import { TimePeriod, MetricType } from "./Charts/ChartFilters";
import { FootTrafficAnalytics } from "./FootTrafficAnalytics";
import { GlobalFilterBar } from "./GlobalFilterBar";

import { WaitingTimeAnalytics } from "./WaitingTimeAnalytics";
import MetricCard from "./MetricCard";
import { CircleUserRound, FileVideoCamera, History } from "lucide-react";
// import ChartFiltersSection from './ChartFiltersSection';
import { FootTrafficChartConfig } from "./Charts/FootTrafficChart";
// import { FootTrafficFilters } from './Charts/FootTrafficFilters';
// import DatePicker from 'react-datepicker';
import { useGlobalFilters } from "../../store/globalFilters";
// import { computeRange, toApiDate } from "../../utils/dateRange";
import "react-datepicker/dist/react-datepicker.css";
import { useCameras, CameraOption } from "../../hooks/useCameras";

interface DashboardProps {
  token: string;
  // onLogout: () => void;
}

interface KPIMetrics {
  total_unique_visitors?: number;
  average_dwell_time?: number;
  max_dwell_time?: number;
  total_events_processed?: number;
  cameras_with_activity?: number;
  waiting_time_metrics?: {
    total_waiting_people?: number;
    peak_waiting_period?: string;
    avg_waiting_time?: number;
  };
  // Demographic metrics
  gender_analytics?: Array<{
    gender: string;
    visitor_count: number;
    total_dwell_time: number;
    avg_dwell_time: number;
  }>;
  age_group_analytics?: Array<{
    age_group: string;
    visitor_count: number;
    total_dwell_time: number;
    avg_dwell_time: number;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  // Kept for compatibility with local per-chart filters when needed
  const [filters, setFilters] = useState<{
    department: string;
    store: string;
    camera: string;
  }>({ department: "", store: "", camera: "" });
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // KPI date range state
  // const [kpiStartDate, setKpiStartDate] = useState<Date | null>(null);
  // const [kpiEndDate, setKpiEndDate] = useState<Date | null>(null);

  // Chart state
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [metricType, setMetricType] = useState<MetricType>("average");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // const [config, setConfig] = useState<FootTrafficChartConfig>({
  //   timePeriod: "weekly",
  //   selectedDate: new Date(),
  //   cameraFilter: "all",
  //   viewType: "daily",
  // });

  const formatDateForApi = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Global filters
	const { department: gDept, store: gStore, timePeriod: gPeriod, date: gDate } = useGlobalFilters();

  // Load camera options based on global filters
  const { cameras: cameraOptions } = useCameras({ department: gDept || undefined, store: gStore || undefined });
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // Reset local camera selection when global store changes
  useEffect(() => {
    setSelectedCamera("");
    setFilters((prev) => ({ ...prev, camera: "" }));
  }, [gDept, gStore]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");

    try {
      // Build KPI params from Global Filters
      // const {
      //   department: gDept,
      //   store: gStore,
      //   timePeriod: gPeriod,
      //   date: gDate,
      // // } = useGlobalFilters.getState();
      // } = useGlobalFilters();
      const kpiParams = new URLSearchParams();
      if (gDate) {
        const { computeRange } = await import("../../utils/dateRange");
        const { toApiDate } = await import("../../utils/dateRange");
        const { start, end } = computeRange(gPeriod, gDate);
        kpiParams.append("start_date", toApiDate(start));
        kpiParams.append("end_date", toApiDate(end));
      }
      if (gDept) kpiParams.append("department", gDept);
      if (gStore) kpiParams.append("store", gStore);

      // Fetch basic KPI metrics

      // const kpiResponse = await fetch(`http://localhost:8000/api/v1/
      //   analytics/kpi-metrics?${kpiParams.toString()}`, {
      const kpiResponse = await fetch(
        `/api/v1/analytics/kpi-metrics?${kpiParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Fetch demographic analytics
      // const demographicResponse = await fetch(
      //   "http://localhost:8000/api/v1/analytics/demographic-insights",
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // );
      const demographicResponse = await fetch(
        `/api/v1/analytics/demographic-insights`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Fetch waiting time metrics
      // const waitingTimeResponse = await fetch(
      //   "http://localhost:8000/api/v1/analytics/waiting-time?view_type=daily",
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // );
      const waitingTimeResponse = await fetch(
        `/api/v1/analytics/waiting-time?view_type=daily`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // OLD: required all three calls to succeed before updating KPIs
      // if (kpiResponse.ok && demographicResponse.ok && waitingTimeResponse.ok) {
      //   const kpiData = await kpiResponse.json();
      //   const demographicData = await demographicResponse.json();
      //   const waitingTimeData = await waitingTimeResponse.json();
      //   // ... combine and setMetrics
      // } else {
      //   setError("Failed to fetch metrics");
      // }

      // NEW: set KPIs as soon as KPI endpoint succeeds; others are optional
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json();
        const k = kpiData.kpi_metrics || {};
        const base: KPIMetrics = {
          total_unique_visitors: k.total_unique_visitors ?? 0,
          total_events_processed: k.total_events_processed ?? 0,
          cameras_with_activity: k.active_cameras_count ?? 0,
          average_dwell_time: k.average_dwell_time_seconds ?? 0,
          max_dwell_time: k.maximum_dwell_time_seconds ?? 0,
        };

        let combined: KPIMetrics = { ...base };

        try {
          if (waitingTimeResponse.ok) {
            const waitingTimeData = await waitingTimeResponse.json();
            const totalWaitingPeople = waitingTimeData.data?.reduce(
              (sum: number, item: any) => sum + item.waiting_count,
              0,
            ) || 0;
            combined = {
              ...combined,
              waiting_time_metrics: {
                total_waiting_people: totalWaitingPeople,
                peak_waiting_period: "N/A",
                avg_waiting_time: 0,
              },
            };
          }
        } catch {}

        try {
          if (demographicResponse.ok) {
            const demographicData = await demographicResponse.json();
            combined = {
              ...combined,
              gender_analytics:
                demographicData.demographic_insights?.filter(
                  (item: any) => item.gender,
                ) || [],
              age_group_analytics:
                demographicData.demographic_insights?.filter(
                  (item: any) => item.age_group,
                ) || [],
            };
          }
        } catch {}

        setMetrics(combined);
      } else {
        setError("Failed to fetch metrics");
      }
    } catch (err) {
      setError("Network error while fetching metrics");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        time_period: timePeriod,
        metric_type: metricType,
      });
      // Append global filters
      const {
        department: gDept,
        store: gStore,
        timePeriod: gPeriod,
        date: gDate,
      } = useGlobalFilters.getState();
      if (gDept) params.append("department", gDept);
      if (gStore) params.append("store", gStore);
      if (selectedCamera) params.append("camera", selectedCamera);

      // Global date range overrides local
      if (gDate) {
        const { computeRange, toApiDate } = await import(
          "../../utils/dateRange"
        );
        const { start, end } = computeRange(gPeriod, gDate);
        params.append("start_date", toApiDate(start));
        params.append("end_date", toApiDate(end));
      } else if (selectedDate) {
        let startDate = selectedDate;
        let endDate = new Date(selectedDate);

        // For quarters, adjust the start date to beginning of quarter
        if (timePeriod === "quarter") {
          const quarter = Math.floor(selectedDate.getMonth() / 3);
          const startMonth = quarter * 3;
          startDate = new Date(selectedDate.getFullYear(), startMonth, 1);
        }

        const startDateStr = formatDateForApi(startDate);
        params.append("start_date", startDateStr);

        // For different time periods, calculate end date
        switch (timePeriod) {
          case "day":
            break;
          case "week": {
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            startDate = startOfWeek;
            endDate = new Date(startOfWeek);
            endDate.setDate(startOfWeek.getDate() + 6);
            // Update start_date param to the computed start of week
            params.set("start_date", formatDateForApi(startDate));
            break;
          }
          case "month":
            endDate.setMonth(selectedDate.getMonth() + 1);
            endDate.setDate(0);
            break;
          case "quarter": {
            const quarter = Math.floor(selectedDate.getMonth() / 3);
            const startMonth = quarter * 3;
            const endMonth = startMonth + 2;
            endDate = new Date(selectedDate.getFullYear(), endMonth + 1, 0);
            break;
          }
          case "year":
            endDate.setFullYear(selectedDate.getFullYear() + 1);
            endDate.setDate(0);
            break;
        }
        params.append("end_date", formatDateForApi(endDate));
      }

      // const response = await fetch(
      //   `http://localhost:8000/api/v1/analytics/chart-data?${params.toString()}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // );
      const response = await fetch(
        `/api/v1/analytics/chart-data?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setChartData(data.chart_data || []);
      } else {
        console.error("Failed to fetch chart data");
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchChartData();
  }, [token, gDept, gStore, gPeriod, gDate]);

  useEffect(() => {
    fetchChartData();
  }, [timePeriod, metricType, selectedDate, selectedCamera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              {/* <p className="text-gray-600">
                Real-time insights and performance metrics
              </p> */}
            </div>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center space-x-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Data</span>
            </Button> */}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Global Filter Bar */}
        <GlobalFilterBar />

        {/* Metrics Cards Section */}
        <section className="mb-8">
          {/* <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
              <p className="text-gray-600 text-sm">
                Filter metrics by date range
              </p>
            </div>
          </div> */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : !metrics ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
              <p className="text-gray-500 text-lg">No data available</p>
              <p className="text-gray-400 text-sm mt-2">
                Upload some data to see analytics
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Visitors"
                value={metrics.total_unique_visitors || 0}
                icon={<CircleUserRound />}
                color="teal"
              />
              <MetricCard
                title="Avg Dwell Time"
                value={`${((metrics?.average_dwell_time ?? 0) / 60).toFixed(2)} min`}
                icon={<History />}
                color="yellow"
              />
              <MetricCard
                title="Active Cameras"
                value={metrics.cameras_with_activity || 0}
                icon={<FileVideoCamera />}
                color="purple"
              />
            </div>
          )}
        </section>
        {/* <ChartFiltersSection
          timePeriod={timePeriod}
          selectedDate={selectedDate}
          onTimePeriodChange={setTimePeriod}
          onDateChange={setSelectedDate}
          availableCameraGroups={[]}
          availableCameras={[]}
          config={config}
          onConfigChange={setConfig}
          // onRefresh={() => {}}
          loading={false}
        /> */}
        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Dwell Time Chart */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    Dwell Time Analytics
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Visitor engagement patterns over time
                  </p>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <ChartFilters
                    timePeriod={timePeriod}
                    metricType={metricType}
                    selectedDate={selectedDate}
                    onTimePeriodChange={setTimePeriod}
                    onMetricTypeChange={setMetricType}
                    onDateChange={setSelectedDate}
                  />
                </div> */}
              </div>
              <div className="space-y-4">
                <ChartFilters
                  timePeriod={timePeriod}
                  metricType={metricType}
                  selectedDate={selectedDate}
                  onTimePeriodChange={setTimePeriod}
                  onMetricTypeChange={setMetricType}
                  onDateChange={setSelectedDate}
                  cameraOptions={cameraOptions as CameraOption[]}
                  selectedCamera={selectedCamera}
                  onCameraChange={(val) => {
                    setSelectedCamera(val);
                    setFilters((prev) => ({ ...prev, camera: val }));
                  }}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <DwellTimeBarChart
                    data={chartData}
                    isLoading={chartLoading}
                    metricType={metricType}
                  />
                </div>

                {/* Line Chart */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <DwellTimeLineChart
                    data={chartData}
                    isLoading={chartLoading}
                    metricType={metricType}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Foot Traffic Chart */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Foot Traffic Analytics
                </h3>
                <p className="text-gray-600 text-sm">
                  Visitor flow and traffic patterns
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <FootTrafficAnalytics />
              </div>
            </div>
          </Card>

          {/* Waiting Time Analytics */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Waiting Time Analytics
                </h3>
                <p className="text-gray-600 text-sm">
                  Analyze patterns of people waiting more than 10 minutes
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <WaitingTimeAnalytics />
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
