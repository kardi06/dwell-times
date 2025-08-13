import { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { WaitingTimeDataPoint } from "../components/Dashboard/Charts/WaitingTimeChart";

interface UseWaitingTimeDataParams {
  timePeriod?: "day" | "week" | "month" | "quarter" | "year";
  viewType?: "hourly" | "daily";
  start_date?: string;
  end_date?: string;
  cameraIds?: string;
  cameraGroups?: string;
  department?: string;
  store?: string;
}

interface UseWaitingTimeDataReturn {
  data: WaitingTimeDataPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useWaitingTimeData = (
  params: UseWaitingTimeDataParams = {},
): UseWaitingTimeDataReturn => {
  const [data, setData] = useState<WaitingTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getWaitingTimeData({
        viewType: params.viewType ?? "hourly",
        start_date: params.start_date,
        end_date: params.end_date,
        cameraIds: params.cameraIds,
        cameraGroups: params.cameraGroups,
        department: params.department,
        store: params.store,
      });
      setData(response.data?.data ?? []);
    } catch (err) {
      setError(
        new Error(err instanceof Error ? err.message : "Failed to fetch data"),
      );
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    params.timePeriod, params.viewType,
    params.start_date,  params.end_date,
    params.cameraIds,  params.cameraGroups,
    params.department, params.store,
  ]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
