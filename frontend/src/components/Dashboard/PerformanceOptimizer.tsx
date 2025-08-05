import React, { Suspense, lazy } from 'react';
import { Spin } from 'antd';

// Lazy load heavy components for better performance
const AnalyticsChartsSection = lazy(() => import('./AnalyticsChartsSection'));
const ProjectManagementSection = lazy(() => import('./ProjectManagementSection'));

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Spin size="large" />
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
};

// Lazy loaded components with performance optimization
export const LazyAnalyticsCharts = () => (
  <PerformanceOptimizer>
    <AnalyticsChartsSection
      dwellTimeData={[]}
      footTrafficData={[]}
      footTrafficConfig={{
        timePeriod: 'day',
        selectedDate: new Date(),
        cameraFilter: 'all',
        viewType: 'hourly',
      }}
      loading={false}
    />
  </PerformanceOptimizer>
);

export const LazyProjectManagement = () => (
  <PerformanceOptimizer>
    <ProjectManagementSection
      projects={[]}
      loading={false}
      onCreateProject={() => {}}
    />
  </PerformanceOptimizer>
);

export default PerformanceOptimizer; 