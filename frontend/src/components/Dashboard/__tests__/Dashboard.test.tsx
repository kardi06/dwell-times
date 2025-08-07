import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';

// Mock the API calls
global.fetch = jest.fn();

// Mock the components
jest.mock('../WaitingTimeAnalytics', () => {
  return function MockWaitingTimeAnalytics() {
    return <div data-testid="waiting-time-analytics">Waiting Time Analytics Component</div>;
  };
});

jest.mock('../FootTrafficAnalytics', () => {
  return function MockFootTrafficAnalytics() {
    return <div data-testid="foot-traffic-analytics">Foot Traffic Analytics Component</div>;
  };
});

jest.mock('../Charts', () => ({
  DwellTimeBarChart: () => <div data-testid="dwell-time-bar-chart">Dwell Time Bar Chart</div>,
  DwellTimeLineChart: () => <div data-testid="dwell-time-line-chart">Dwell Time Line Chart</div>,
  ChartFilters: () => <div data-testid="chart-filters">Chart Filters</div>,
}));

const mockToken = 'test-token';

const mockKpiResponse = {
  kpi_metrics: {
    total_unique_visitors: 1500,
    average_dwell_time: 1800, // 30 minutes in seconds
    max_dwell_time: 3600,
    total_events_processed: 5000,
    cameras_with_activity: 8,
  }
};

const mockDemographicResponse = {
  demographic_insights: [
    {
      gender: 'male',
      visitor_count: 800,
      total_dwell_time: 1440000,
      avg_dwell_time: 1800
    },
    {
      gender: 'female',
      visitor_count: 700,
      total_dwell_time: 1260000,
      avg_dwell_time: 1800
    }
  ]
};

const mockWaitingTimeResponse = {
  data: [
    {
      time_period: '2024-01-01',
      waiting_count: 25,
      camera_info: {
        camera_description: 'Camera 1',
        camera_group: 'Group A'
      }
    },
    {
      time_period: '2024-01-02',
      waiting_count: 30,
      camera_info: {
        camera_description: 'Camera 2',
        camera_group: 'Group B'
      }
    }
  ],
  metadata: {
    total_records: 55,
    filtered_records: 55,
    time_range: {
      start: '2024-01-01',
      end: '2024-01-02'
    }
  }
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with all components', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
  });

  it('displays all metric cards including waiting time', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Total Visitors')).toBeInTheDocument();
      expect(screen.getByText('Avg Dwell Time')).toBeInTheDocument();
      expect(screen.getByText('Active Cameras')).toBeInTheDocument();
      expect(screen.getByText('Waiting People')).toBeInTheDocument();
    });
  });

  it('displays correct waiting time metric value', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      // Total waiting people should be 25 + 30 = 55
      expect(screen.getByText('55')).toBeInTheDocument();
    });
  });

  it('renders waiting time analytics section', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting Time Analytics')).toBeInTheDocument();
      expect(screen.getByText('Analyze patterns of people waiting more than 10 minutes')).toBeInTheDocument();
      expect(screen.getByTestId('waiting-time-analytics')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Network error while fetching metrics')).toBeInTheDocument();
    });
  });

  it('handles partial API failures', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: false,
      status: 500
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch metrics')).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    const refreshButton = screen.getByText('Refresh Data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial load
    });

    // Click refresh again
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(6); // Initial load + refresh
    });
  });

  it('displays loading states correctly', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dashboard token={mockToken} />);

    // Should show loading skeleton
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('makes correct API calls with authorization headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/analytics/kpi-metrics',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/analytics/demographic-insights',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/analytics/waiting-time?view_type=daily',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
    });
  });

  it('renders all chart sections', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKpiResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDemographicResponse
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWaitingTimeResponse
    });

    render(<Dashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Dwell Time Analytics')).toBeInTheDocument();
      expect(screen.getByText('Foot Traffic Analytics')).toBeInTheDocument();
      expect(screen.getByText('Waiting Time Analytics')).toBeInTheDocument();
    });
  });
}); 