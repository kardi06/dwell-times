import React, { useState, useEffect, useMemo, useCallback } from "react";
import { WaitingTimeChart } from "./Charts/WaitingTimeChart";
import { WaitingTimeFilters, WTTimePeriod } from "./Charts/WaitingTimeFilters";
import { useWaitingTimeData } from "../../hooks/useWaitingTimeData";
import { analyticsAPI } from "../../services/api";
import { useGlobalFilters } from "../../store/globalFilters";
import { computeRange, toApiDate } from "../../utils/dateRange";
import { useCameras as useFilteredCameras } from "../../hooks/useCameras";

interface Camera {
	id: string;
	description: string;
	group: string;
}

const WaitingTimeAnalyticsComponent: React.FC = () => {
	// Local filters: view type and camera only (group optional for now)
	const [viewType, setViewType] = useState<"hourly" | "daily">("hourly");
	const [selectedGroup, setSelectedGroup] = useState("");
	const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
	// const [cameras, setCameras] = useState<Camera[]>([]);

	// Global filters
	const { department: gDept, store: gStore, timePeriod: gPeriod, date: gDate } = useGlobalFilters();

	// Fetch cameras filtered by global department/store
	const { cameras: cameraOpts } = useFilteredCameras({ department: gDept || undefined, store: gStore || undefined });
	const cameras: Camera[] = useMemo(() => (
		(cameraOpts || []).map((opt) => ({ id: opt.value, description: opt.value, group: opt.store || "" }))
	), [cameraOpts]);

	// Compute date range from global filters
	const { start: rangeStart, end: rangeEnd } = useMemo(() => {
		const anchor = gDate ?? new Date();
		return computeRange(gPeriod, anchor);
	}, [gDate, gPeriod]);

	const hookParams = {
		viewType,
		start_date: toApiDate(rangeStart),
		end_date: toApiDate(rangeEnd),
		cameraIds: selectedCameras.length ? selectedCameras.join(",") : undefined,
		cameraGroups: gStore ? undefined : selectedGroup || undefined,
		department: gDept || undefined,
		store: gStore || undefined,
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

	const formatDate = (d: Date) => {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${dd}`;
	};

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
				// Time period/date now come from global; keep local group/camera and view type
				timePeriod={"day"}
				onTimePeriodChange={() => {}}
				viewType={viewType}
				onViewTypeChange={handleViewTypeChange}
				selectedGroup={selectedGroup}
				onGroupChange={setSelectedGroup}
				selectedCameras={selectedCameras}
				onCameraChange={handleCameraChange}
				date={gDate || new Date()}
				onDateChange={() => {}}
				cameraGroups={[...new Set(cameras.map((c) => c.group).filter(Boolean))]}
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
