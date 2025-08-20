import React, { useState } from 'react';
import { 
  // FootTrafficChart, 
  FootTrafficChartConfig } 
from './Charts/FootTrafficChart';
import { FootTrafficFilters } from './Charts/FootTrafficFilters';
import { useFootTrafficData } from '../../hooks/useFootTrafficData';
import { useCameras } from '../../hooks/useCameras';
import { useGlobalFilters } from '../../store/globalFilters';
import { useFootTrafficTimeSeries } from '../../hooks/useFootTrafficTimeSeries';
import { FootTrafficTimeChart } from './Charts/FootTrafficTimeChart';

export const FootTrafficAnalytics: React.FC = () => {
  const [config, setConfig] = useState<FootTrafficChartConfig>({
    timePeriod: 'day',
    selectedDate: new Date(),
    cameraFilter: 'all',
    viewType: 'hourly'
  });

  const { data, isLoading, error } = useFootTrafficData(config);
  const { department: gDept, store: gStore } = useGlobalFilters();
  const { cameras, isLoading: camerasLoading } = useCameras({ department: gDept || undefined, store: gStore || undefined });

  // Map to unique camera names for the select (value-only to avoid object render)
  const availableCameraNames: string[] = Array.from(new Set((cameras || []).map((c) => c.value)));

  const handleConfigChange = (newConfig: FootTrafficChartConfig) => {
    setConfig(newConfig);
  };

  // Local series controls (view type + breakdown)
  const [seriesView, setSeriesView] = useState<'hourly' | 'daily'>('hourly');
  const [seriesBreakdown, setSeriesBreakdown] = useState<'none' | 'gender' | 'age' | 'gender_age'>('none');
  const { data: seriesData, isLoading: seriesLoading } = useFootTrafficTimeSeries({ viewType: seriesView, breakdown: seriesBreakdown, camera: config.cameraFilter !== 'all' ? config.cameraFilter : undefined });

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium">Error loading foot traffic data</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <>
        <FootTrafficFilters
          config={config}
          onConfigChange={handleConfigChange}
          availableCameras={availableCameraNames}
          isLoading={camerasLoading}
        />

        {/* New: Foot Traffic Time Series with breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded ${seriesView === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSeriesView('hourly')}
            >
              Hourly
            </button>
            <button
              className={`px-3 py-1 rounded ${seriesView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSeriesView('daily')}
            >
              Daily
            </button>
            <select
              value={seriesBreakdown}
              onChange={(e) => setSeriesBreakdown(e.target.value as any)}
              className="ml-2 px-3 py-1 rounded border border-gray-300 bg-white text-gray-800"
            >
              <option value="none">Default (Male+Female)</option>
              <option value="gender">By Gender</option>
              <option value="age">By Age</option>
              <option value="gender_age">By Gender & Age</option>
            </select>
          </div>
          <FootTrafficTimeChart
            data={seriesData as any}
            isLoading={seriesLoading}
            viewType={seriesView}
            breakdown={seriesBreakdown}
          />
        </div>
        
        {/* <FootTrafficChart
          data={data}
          config={config}
          isLoading={isLoading}
        /> */}
    </>
  );
}; 