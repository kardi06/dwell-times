import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, Loading } from '../ui';
import FileUpload from '../FileUpload/FileUpload';
import KPICards from './KPICards';
import EventTable from './EventTable';
import { DwellTimeBarChart, DwellTimeLineChart, ChartFilters } from './Charts';
import { ChartDataPoint } from './Charts/DwellTimeBarChart';
import { TimePeriod, MetricType } from './Charts/ChartFilters';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

interface KPIMetrics {
  total_unique_visitors?: number;
  average_dwell_time?: number;
  max_dwell_time?: number;
  total_events_processed?: number;
  cameras_with_activity?: number;
  // Demographic metrics
  gender_analytics?: Array<{
    gender: string;
    visitor_count: number;
    total_dwell_time: number;
    avg_dwell_time: number;
  }>;
  age_group_analytics?: Array<{
    age_group: string;
    visitor_count: number;
    total_dwell_time: number;
    avg_dwell_time: number;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chart state
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [metricType, setMetricType] = useState<MetricType>('average');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch basic KPI metrics
      const kpiResponse = await fetch('http://localhost:8000/api/v1/analytics/kpi-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch demographic analytics
      const demographicResponse = await fetch('http://localhost:8000/api/v1/analytics/demographic-insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (kpiResponse.ok && demographicResponse.ok) {
        const kpiData = await kpiResponse.json();
        const demographicData = await demographicResponse.json();
        
        // Combine the metrics
        const combinedMetrics = {
          ...kpiData.kpi_metrics,
          gender_analytics: demographicData.demographic_insights?.filter((item: any) => item.gender) || [],
          age_group_analytics: demographicData.demographic_insights?.filter((item: any) => item.age_group) || []
        };
        
        setMetrics(combinedMetrics);
      } else {
        setError('Failed to fetch metrics');
      }
    } catch (err) {
      setError('Network error while fetching metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/analytics/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh metrics after successful upload
        await fetchMetrics();
        await fetchChartData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Upload failed');
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/analytics/chart-data?time_period=${timePeriod}&metric_type=${metricType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChartData(data.chart_data || []);
      } else {
        console.error('Failed to fetch chart data');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchChartData();
  }, [token]);

  useEffect(() => {
    fetchChartData();
  }, [timePeriod, metricType]);

  const tabs = [
    { id: 0, name: 'Upload Data', icon: '📁', description: 'Upload camera event data' },
    { id: 1, name: 'Analytics', icon: '📊', description: 'View detailed analytics' },
    { id: 2, name: 'Charts', icon: '📈', description: 'Dwell time analytics charts' },
    { id: 3, name: 'Event Table', icon: '📋', description: 'Browse event data' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 font-display">
                  Dwell-Insight Analytics
                </h1>
                <p className="text-sm text-secondary-600">
                  Camera Event Analytics Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-secondary-600">Welcome back!</p>
                <p className="text-sm font-medium text-secondary-900">Admin User</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-secondary-600 hover:text-secondary-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900 font-display">
                Key Performance Indicators
              </h2>
              <p className="text-secondary-600 mt-1">
                Real-time analytics overview
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-24 bg-secondary-200 rounded"></div>
                </Card>
              ))}
            </div>
          ) : (
            <KPICards metrics={metrics} loading={loading} />
          )}
        </section>

        {/* Error Display */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Card variant="elevated" className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-secondary-200 bg-secondary-50">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-white'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    Upload Camera Event Data
                  </h3>
                  <p className="text-secondary-600">
                    Drag and drop a CSV file with camera event data to process and analyze. 
                    The file should contain columns for camera ID, timestamp, and visitor ID.
                  </p>
                </div>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    Analytics Overview
                  </h3>
                  <p className="text-secondary-600">
                    Detailed analytics and insights will be displayed here.
                  </p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-secondary-900 mb-2">
                    Analytics Coming Soon
                  </h4>
                  <p className="text-secondary-600">
                    Advanced analytics features are under development.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    Dwell Time Analytics Charts
                  </h3>
                  <p className="text-secondary-600">
                    Interactive charts showing dwell time patterns by demographics and time periods.
                  </p>
                </div>
                
                {/* Chart Filters */}
                <ChartFilters
                  timePeriod={timePeriod}
                  metricType={metricType}
                  onTimePeriodChange={setTimePeriod}
                  onMetricTypeChange={setMetricType}
                />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <Card variant="elevated" className="p-6">
                    <DwellTimeBarChart
                      data={chartData}
                      isLoading={chartLoading}
                      title="Average Dwell Time by Gender"
                    />
                  </Card>

                  {/* Line Chart */}
                  <Card variant="elevated" className="p-6">
                    <DwellTimeLineChart
                      data={chartData}
                      isLoading={chartLoading}
                      title="Average Dwell Time by Age and Gender"
                    />
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    Event Data Table
                  </h3>
                  <p className="text-secondary-600">
                    Browse and search through processed camera event data.
                  </p>
                </div>
                <EventTable token={token} />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 