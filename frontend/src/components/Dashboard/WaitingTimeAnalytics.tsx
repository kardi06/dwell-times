import React, { useState, useEffect, useMemo, useCallback } from "react";
import { WaitingTimeChart } from "./Charts/WaitingTimeChart";
import { WaitingTimeFilters, WTTimePeriod } from "./Charts/WaitingTimeFilters";
import { useWaitingTimeData } from "../../hooks/useWaitingTimeData";
// import { analyticsAPI } from "../../services/api";
import { useGlobalFilters } from "../../store/globalFilters";
import { computeRange, toApiDate } from "../../utils/dateRange";
import { useCameras as useFilteredCameras } from "../../hooks/useCameras";

interface Camera {
	id: string;
	description: string;
	group: string;
}

const WaitingTimeAnalyticsComponent: React.FC = () => {
	// Local filters: only view type and camera
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

	return (
		<div className="space-y-2">
			{/* Filters: only Camera + View Type tabs, other locals hidden (driven by Global Filter Bar) */}
			<WaitingTimeFilters
				// Time period/date now come from global; keep local group/camera and view type
				timePeriod={"day"}
				onTimePeriodChange={() => {}}
				viewType={viewType}
				onViewTypeChange={handleViewTypeChange}
				selectedGroup={""}
				onGroupChange={() => {}}
				selectedCameras={selectedCameras}
				onCameraChange={handleCameraChange}
				date={gDate || new Date()}
				onDateChange={() => {}}
				cameraGroups={[]}
				cameras={cameras}
				isLoading={isLoading}
			/>

			<div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 w-full">
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
