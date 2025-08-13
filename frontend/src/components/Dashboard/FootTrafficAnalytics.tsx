import React, { useState } from 'react';
import { FootTrafficChart, FootTrafficChartConfig } from './Charts/FootTrafficChart';
import { FootTrafficFilters } from './Charts/FootTrafficFilters';
import { useFootTrafficData } from '../../hooks/useFootTrafficData';
import { useCameras } from '../../hooks/useCameras';
import { useGlobalFilters } from '../../store/globalFilters';

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
        
        <FootTrafficChart
          data={data}
          config={config}
          isLoading={isLoading}
        />
    </>
  );
}; 