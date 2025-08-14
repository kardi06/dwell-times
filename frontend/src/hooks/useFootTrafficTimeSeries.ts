import { useEffect, useState } from "react";
import { useGlobalFilters } from "../store/globalFilters";
import { computeRange, toApiDate } from "../utils/dateRange";

export type FTViewType = "hourly" | "daily";
export type FTBreakdown = "none" | "gender" | "age" | "gender_age";

export interface FootTrafficSeriesPoint {
  time_period: string;
  male_count?: number;
  female_count?: number;
  total_count?: number;
  age_groups?: { age_group: string; count: number }[];
  gender_age?: { male: { age_group: string; count: number }[]; female: { age_group: string; count: number }[] };
}

interface Params {
  viewType: FTViewType;
  breakdown: FTBreakdown;
  camera?: string;
}

export function useFootTrafficTimeSeries({ viewType, breakdown, camera }: Params) {
  const { department: gDept, store: gStore, timePeriod: gPeriod, date: gDate } = useGlobalFilters();
  const [data, setData] = useState<FootTrafficSeriesPoint[]>([]);
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
        params.append("breakdown", breakdown);
        params.append("start_date", toApiDate(start));
        params.append("end_date", toApiDate(end));
        if (gDept) params.append("department", gDept);
        if (gStore) params.append("store", gStore);
        if (camera) params.append("camera", camera);
        const res = await fetch(`/api/v1/analytics/foot-traffic-time-series?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch foot traffic series");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [viewType, breakdown, camera, gDept, gStore, gPeriod, gDate]);

  return { data, isLoading, error };
}
