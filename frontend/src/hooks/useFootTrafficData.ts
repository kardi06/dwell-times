import { useState, useEffect } from 'react';
import { FootTrafficDataPoint, FootTrafficChartConfig } from '../components/Dashboard/Charts/FootTrafficChart';

interface UseFootTrafficDataReturn {
  data: FootTrafficDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFootTrafficData = (config: FootTrafficChartConfig): UseFootTrafficDataReturn => {
  const [data, setData] = useState<FootTrafficDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!config.selectedDate) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Format date for API - use local date to avoid timezone issues
      const year = config.selectedDate.getFullYear();
      const month = String(config.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(config.selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Debug logging
      console.log('Selected date object:', config.selectedDate);
      console.log('Formatted date for API:', dateStr);
      console.log('Time period:', config.timePeriod);
      
      // Build query parameters
      const params = new URLSearchParams({
        time_period: config.timePeriod,
        selected_date: dateStr,
        camera_filter: config.cameraFilter,
        view_type: config.viewType
      });

      // const response = await fetch(`http://localhost:8000/api/v1/analytics/
      //   foot-traffic-data?${params}`);
      // Append global filters
      const { useGlobalFilters } = await import('../store/globalFilters');
      const { computeRange, toApiDate } = await import('../utils/dateRange');
      const { department: gDept, store: gStore, timePeriod: gPeriod, date: gDate } = useGlobalFilters.getState();
      if (gDept) params.append('department', gDept);
      if (gStore) params.append('store', gStore);
      if (gDate) {
        const { start, end } = computeRange(gPeriod, gDate);
        params.append('start_date', toApiDate(start));
        params.append('end_date', toApiDate(end));
      }

      const response = await fetch(`/api/v1/analytics/foot-traffic-data?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching foot traffic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when config changes
  useEffect(() => {
    fetchData();
  }, [config.timePeriod, config.selectedDate, config.cameraFilter, config.viewType]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
}; 