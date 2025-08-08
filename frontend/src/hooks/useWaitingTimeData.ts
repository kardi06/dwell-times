import { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { WaitingTimeDataPoint } from "../components/Dashboard/Charts/WaitingTimeChart";

interface UseWaitingTimeDataParams {
  timePeriod?: "day" | "week" | "month" | "quarter" | "year"; // ← NEW
  viewType?: "hourly" | "daily";
  start_date?: string;
  end_date?: string;
  cameraIds?: string;
  cameraGroups?: string;
}
/* util untuk cari awal & akhir periode */
function getRange(
  tp: NonNullable<UseWaitingTimeDataParams["timePeriod"]>,
  ref: Date,
) {
  const start = new Date(ref); // clone
  const end = new Date(ref);
  switch (tp) {
    case "day":
      break;
    case "week":
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case "month":
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case "quarter": {
      const q = Math.floor(start.getMonth() / 3);
      start.setMonth(q * 3, 1);
      end.setMonth(q * 3 + 3, 0);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      end.setFullYear(start.getFullYear(), 11, 31);
      break;
  }
  return [start, end];
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

  // const fetchData = async () => {
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     const response = await analyticsAPI.getWaitingTimeData({
  //       viewType: params.viewType || "hourly",
  //       startDate: params.startDate,
  //       endDate: params.endDate,
  //       cameraIds: params.cameraIds,
  //       cameraGroups: params.cameraGroups,
  //     });

  //     if (response.data && response.data.data) {
  //       setData(response.data.data);
  //     } else {
  //       setData([]);
  //     }
  //   } catch (err) {
  //     const errorMessage =
  //       err instanceof Error
  //         ? err.message
  //         : "Failed to fetch waiting time data";
  //     setError(new Error(errorMessage));
  //     setData([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    /* ---- range fallback ---- */
    let { start_date, end_date } = params;
    if (!start_date || !end_date) {
      const tp = params.timePeriod ?? "day";
      const now = new Date();
      const [s, e] = getRange(tp, now);
      start_date = s.toISOString().split("T")[0];
      end_date = e.toISOString().split("T")[0];
    }

    try {
      const response = await analyticsAPI.getWaitingTimeData({
        viewType: params.viewType ?? "hourly",
        start_date: params.start_date, 
        end_date: params.end_date, 
        cameraIds: params.cameraIds,
        cameraGroups: params.cameraGroups,
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
    // params.viewType,
    // params.startDate,
    // params.endDate,
    // params.cameraIds,
    // params.cameraGroups,
    params.timePeriod, params.viewType,
    params.start_date,  params.end_date,
    params.cameraIds,  params.cameraGroups
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
