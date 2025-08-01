import React, { useState } from 'react';
import { FootTrafficChart, FootTrafficChartConfig } from './Charts/FootTrafficChart';
import { FootTrafficFilters } from './Charts/FootTrafficFilters';
import { useFootTrafficData } from '../../hooks/useFootTrafficData';
import { useCameras } from '../../hooks/useCameras';

export const FootTrafficAnalytics: React.FC = () => {
  const [config, setConfig] = useState<FootTrafficChartConfig>({
    timePeriod: 'day',
    selectedDate: new Date(),
    cameraFilter: 'all',
    viewType: 'hourly'
  });

  const { data, isLoading, error } = useFootTrafficData(config);
  const { cameras, isLoading: camerasLoading } = useCameras();

  const handleConfigChange = (newConfig: FootTrafficChartConfig) => {
    setConfig(newConfig);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium">Error loading foot traffic data</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Foot Traffic Analytics
        </h2>
        <p className="text-gray-600 mb-6">
          Analyze visitor patterns and traffic flow across different time periods and demographics.
        </p>
        
        <FootTrafficFilters
          config={config}
          onConfigChange={handleConfigChange}
          availableCameras={cameras}
          isLoading={camerasLoading}
        />
        
        <FootTrafficChart
          data={data}
          config={config}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}; 