import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../../layout/AppLayout';
import KeyMetricsSection from '../KeyMetricsSection';

// Mock the data hook
jest.mock('../../../hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    data: {
      kpiMetrics: {
        totalVisitors: 1234,
        avgDwellTime: 45,
        activeCameras: 8,
        trends: {
          totalVisitors: 12.5,
          avgDwellTime: -2.3,
          activeCameras: 0,
        },
      },
    },
    loading: false,
    error: null,
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Responsive Design', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders layout components correctly', () => {
    renderWithRouter(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders key metrics section with responsive grid', () => {
    renderWithRouter(
      <KeyMetricsSection 
        data={{
          totalVisitors: 1234,
          avgDwellTime: 45,
          activeCameras: 8,
          trends: {
            totalVisitors: 12.5,
            avgDwellTime: -2.3,
            activeCameras: 0,
          },
        }}
        loading={false}
      />
    );
    
    // Should render all three metric cards
    expect(screen.getByText('Total Visitor')).toBeInTheDocument();
    expect(screen.getByText('Avg Dwell Time')).toBeInTheDocument();
    expect(screen.getByText('Active Camera')).toBeInTheDocument();
  });

  it('applies responsive grid classes', () => {
    const { container } = renderWithRouter(
      <KeyMetricsSection 
        data={{
          totalVisitors: 1234,
          avgDwellTime: 45,
          activeCameras: 8,
          trends: {
            totalVisitors: 12.5,
            avgDwellTime: -2.3,
            activeCameras: 0,
          },
        }}
        loading={false}
      />
    );
    
    // Check for responsive grid classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('handles mobile breakpoint correctly', () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });
    
    renderWithRouter(
      <AppLayout>
        <div>Mobile Test</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Mobile Test')).toBeInTheDocument();
  });

  it('handles tablet breakpoint correctly', () => {
    // Mock tablet screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });
    
    renderWithRouter(
      <AppLayout>
        <div>Tablet Test</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Tablet Test')).toBeInTheDocument();
  });

  it('handles desktop breakpoint correctly', () => {
    // Mock desktop screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
    
    renderWithRouter(
      <AppLayout>
        <div>Desktop Test</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Desktop Test')).toBeInTheDocument();
  });
}); 