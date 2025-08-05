import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DwellTimeBarChart, ChartDataPoint } from './Charts/DwellTimeBarChart';
import { FootTrafficChart, FootTrafficDataPoint, FootTrafficChartConfig } from './Charts/FootTrafficChart';

interface AnalyticsChartsSectionProps {
  dwellTimeData: ChartDataPoint[] | null;
  footTrafficData: FootTrafficDataPoint[] | null;
  footTrafficConfig: FootTrafficChartConfig;
  loading: boolean;
}

const AnalyticsChartsSection: React.FC<AnalyticsChartsSectionProps> = ({
  dwellTimeData,
  footTrafficData,
  footTrafficConfig,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Dwell Time Chart */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dwell Time by Gender</CardTitle>
        </CardHeader>
        <CardContent>
          <DwellTimeBarChart
            data={dwellTimeData || []}
            title="Dwell Time by Gender"
            isLoading={loading}
            metricType="average"
          />
        </CardContent>
      </Card>

      {/* Foot Traffic Chart */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Foot Traffic Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <FootTrafficChart
            data={footTrafficData || []}
            config={footTrafficConfig}
            title="Foot Traffic Analytics"
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsChartsSection; 