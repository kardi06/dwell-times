import { useEffect, useState } from "react";
import { useGlobalFilters } from "../store/globalFilters";
import { computeRange, toApiDate } from "../utils/dateRange";

export type DwellViewType = "hourly" | "daily";
export type DwellMetricType = "average" | "total";

export interface DwellTimeSeriesPoint {
	time_period: string;
	male_avg_minutes: number;
	female_avg_minutes: number;
	total_avg_minutes: number;
	sample_size: number;
}

interface Params {
	viewType: DwellViewType;
	metricType: DwellMetricType;
	camera?: string;
}

export function useDwellTimeTimeSeries({ viewType, metricType, camera }: Params) {
	const { department: gDept, store: gStore, timePeriod: gPeriod, date: gDate } = useGlobalFilters();
	const [data, setData] = useState<DwellTimeSeriesPoint[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const { start, end } = computeRange(gPeriod, gDate || new Date());
				const params = new URLSearchParams();
				params.append("view_type", viewType);
				params.append("metric_type", metricType);
				params.append("start_date", toApiDate(start));
				params.append("end_date", toApiDate(end));
				if (gDept) params.append("department", gDept);
				if (gStore) params.append("store", gStore);
				if (camera) params.append("camera", camera);
				const res = await fetch(`/api/v1/analytics/dwell-time-time-series?${params.toString()}`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				setData(json.data || []);
			} catch (e: any) {
				setError(e?.message || "Failed to fetch dwell time series");
				setData([]);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [viewType, metricType, camera, gDept, gStore, gPeriod, gDate]);

	return { data, isLoading, error };
}
