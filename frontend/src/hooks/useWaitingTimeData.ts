import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { WaitingTimeDataPoint } from '../components/Dashboard/Charts/WaitingTimeChart';

interface UseWaitingTimeDataParams {
  viewType?: 'hourly' | 'daily';
  startDate?: string;
  endDate?: string;
  cameraIds?: string;
  cameraGroups?: string;
}

interface UseWaitingTimeDataReturn {
  data: WaitingTimeDataPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useWaitingTimeData = (params: UseWaitingTimeDataParams = {}): UseWaitingTimeDataReturn => {
  const [data, setData] = useState<WaitingTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyticsAPI.getWaitingTimeData({
        viewType: params.viewType || 'hourly',
        startDate: params.startDate,
        endDate: params.endDate,
        cameraIds: params.cameraIds,
        cameraGroups: params.cameraGroups,
      });

      if (response.data && response.data.data) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch waiting time data';
      setError(new Error(errorMessage));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.viewType, params.startDate, params.endDate, params.cameraIds, params.cameraGroups]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}; 