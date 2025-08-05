import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, mockData } from '../services/api';

interface DashboardData {
  kpiMetrics: {
    totalVisitors: number;
    avgDwellTime: number;
    activeCameras: number;
    trends: {
      totalVisitors: number;
      avgDwellTime: number;
      activeCameras: number;
    };
  } | null;
  dwellTimeData: any[] | null;
  footTrafficData: any[] | null;
  cameras: string[];
  loading: boolean;
  error: string | null;
}

interface UseDashboardDataProps {
  useMockData?: boolean;
  refreshInterval?: number; // in seconds
}

export const useDashboardData = ({ 
  useMockData = true, 
  refreshInterval = 30 
}: UseDashboardDataProps = {}) => {
  const [data, setData] = useState<DashboardData>({
    kpiMetrics: null,
    dwellTimeData: null,
    footTrafficData: null,
    cameras: [],
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState({
    dwellTime: {
      timePeriod: 'day' as const,
      metricType: 'average' as const,
      selectedDate: new Date(),
    },
    footTraffic: {
      timePeriod: 'day' as const,
      viewType: 'hourly' as const,
      cameraFilter: 'all',
      selectedDate: new Date(),
    },
  });

  const fetchKPIMetrics = useCallback(async () => {
    try {
      if (useMockData) {
        setData(prev => ({
          ...prev,
          kpiMetrics: mockData.kpiMetrics,
          loading: false,
        }));
        return;
      }

      const response = await analyticsAPI.getKPIMetrics();
      setData(prev => ({
        ...prev,
        kpiMetrics: response.data,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to load KPI metrics',
        loading: false,
      }));
    }
  }, [useMockData]);

  const fetchDwellTimeData = useCallback(async () => {
    try {
      if (useMockData) {
        setData(prev => ({
          ...prev,
          dwellTimeData: mockData.dwellTimeData,
        }));
        return;
      }

      const response = await analyticsAPI.getDwellTimeAnalytics({
        timePeriod: filters.dwellTime.timePeriod,
        metricType: filters.dwellTime.metricType,
        selectedDate: filters.dwellTime.selectedDate.toISOString(),
      });
      setData(prev => ({
        ...prev,
        dwellTimeData: response.data,
      }));
    } catch (error) {
      console.error('Error fetching dwell time data:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to load dwell time data',
      }));
    }
  }, [useMockData, filters.dwellTime]);

  const fetchFootTrafficData = useCallback(async () => {
    try {
      if (useMockData) {
        setData(prev => ({
          ...prev,
          footTrafficData: mockData.footTrafficData,
        }));
        return;
      }

      const response = await analyticsAPI.getFootTrafficData({
        timePeriod: filters.footTraffic.timePeriod,
        viewType: filters.footTraffic.viewType,
        cameraFilter: filters.footTraffic.cameraFilter,
        selectedDate: filters.footTraffic.selectedDate.toISOString(),
      });
      setData(prev => ({
        ...prev,
        footTrafficData: response.data,
      }));
    } catch (error) {
      console.error('Error fetching foot traffic data:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to load foot traffic data',
      }));
    }
  }, [useMockData, filters.footTraffic]);

  const fetchCameras = useCallback(async () => {
    try {
      if (useMockData) {
        setData(prev => ({
          ...prev,
          cameras: mockData.cameras,
        }));
        return;
      }

      const response = await analyticsAPI.getCameras();
      setData(prev => ({
        ...prev,
        cameras: response.data,
      }));
    } catch (error) {
      console.error('Error fetching cameras:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to load cameras',
      }));
    }
  }, [useMockData]);

  const refreshData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    await Promise.all([
      fetchKPIMetrics(),
      fetchDwellTimeData(),
      fetchFootTrafficData(),
      fetchCameras(),
    ]);
  }, [fetchKPIMetrics, fetchDwellTimeData, fetchFootTrafficData, fetchCameras]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  return {
    data,
    filters,
    updateFilters,
    refreshData,
    loading: data.loading,
    error: data.error,
  };
}; 