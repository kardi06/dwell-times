// import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaitingTimeChart, WaitingTimeDataPoint } from '../WaitingTimeChart';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

const mockData: WaitingTimeDataPoint[] = [
  {
    time_period: '2024-01-01 10:00:00',
    waiting_count: 5,
    camera_info: {
      camera_description: 'Camera 1',
      camera_group: 'Group A',
    },
  },
  {
    time_period: '2024-01-01 11:00:00',
    waiting_count: 8,
    camera_info: {
      camera_description: 'Camera 2',
      camera_group: 'Group B',
    },
  },
  {
    time_period: '2024-01-01 12:00:00',
    waiting_count: 3,
    camera_info: {
      camera_description: 'Camera 1',
      camera_group: 'Group A',
    },
  },
];

describe('WaitingTimeChart', () => {
  it('renders loading state correctly', () => {
    render(
      <WaitingTimeChart
        data={[]}
        viewType="hourly"
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading waiting time chart...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const error = new Error('Failed to load data');
    render(
      <WaitingTimeChart
        data={[]}
        viewType="hourly"
        error={error}
      />
    );

    expect(screen.getByText('Error loading chart: Failed to load data')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(
      <WaitingTimeChart
        data={[]}
        viewType="hourly"
      />
    );

    expect(screen.getByText('No waiting time data available')).toBeInTheDocument();
  });

  it('renders chart with data correctly', () => {
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="hourly"
        title="Test Chart"
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-data')).toBeInTheDocument();
    expect(screen.getByTestId('chart-options')).toBeInTheDocument();
  });

  it('groups data by camera group correctly', () => {
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="hourly"
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Should have 2 datasets (one for each camera group)
    expect(chartData.datasets).toHaveLength(2);
    
    // Check that datasets are properly labeled
    const labels = chartData.datasets.map((dataset: any) => dataset.label);
    expect(labels).toContain('Group A');
    expect(labels).toContain('Group B');
  });

  it('sorts time periods correctly', () => {
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="hourly"
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Check that labels are sorted chronologically
    const labels = chartData.labels;
    expect(labels[0]).toBe('2024-01-01 10:00:00');
    expect(labels[1]).toBe('2024-01-01 11:00:00');
    expect(labels[2]).toBe('2024-01-01 12:00:00');
  });

  it('applies correct styling for hourly view', () => {
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="hourly"
      />
    );

    const chartOptions = JSON.parse(screen.getByTestId('chart-options').textContent || '{}');
    
    expect(chartOptions.scales.x.title.text).toBe('Time (Hour)');
  });

  it('applies correct styling for daily view', () => {
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="daily"
      />
    );

    const chartOptions = JSON.parse(screen.getByTestId('chart-options').textContent || '{}');
    
    expect(chartOptions.scales.x.title.text).toBe('Date');
  });

  it('handles custom title correctly', () => {
    const customTitle = 'Custom Waiting Time Chart';
    render(
      <WaitingTimeChart
        data={mockData}
        viewType="hourly"
        title={customTitle}
      />
    );

    const chartOptions = JSON.parse(screen.getByTestId('chart-options').textContent || '{}');
    
    expect(chartOptions.plugins.title.text).toBe(customTitle);
  });
}); 