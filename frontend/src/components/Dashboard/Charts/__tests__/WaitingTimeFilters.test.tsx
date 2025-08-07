import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaitingTimeFilters } from '../WaitingTimeFilters';

const mockCameras = [
  { id: 'camera1', description: 'Camera 1', group: 'Group A' },
  { id: 'camera2', description: 'Camera 2', group: 'Group B' },
  { id: 'camera3', description: 'Camera 3', group: 'Group A' },
];

const defaultProps = {
  viewType: 'hourly' as const,
  onViewTypeChange: jest.fn(),
  selectedCameras: [],
  onCameraChange: jest.fn(),
  dateRange: [new Date('2024-01-01'), new Date('2024-01-07')] as [Date, Date],
  onDateRangeChange: jest.fn(),
  cameras: mockCameras,
  isLoading: false,
};

describe('WaitingTimeFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter controls', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    expect(screen.getByLabelText('View Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Cameras')).toBeInTheDocument();
    expect(screen.getByText('Quick Date Ranges')).toBeInTheDocument();
  });

  it('handles view type change', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const viewTypeSelect = screen.getByLabelText('View Type');
    fireEvent.change(viewTypeSelect, { target: { value: 'daily' } });

    expect(defaultProps.onViewTypeChange).toHaveBeenCalledWith('daily');
  });

  it('handles camera selection', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const cameraSelect = screen.getByLabelText('Cameras');
    fireEvent.change(cameraSelect, { target: { value: 'camera1' } });

    expect(defaultProps.onCameraChange).toHaveBeenCalledWith(['camera1']);
  });

  it('handles date range changes', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2024-01-02' } });

    expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith([
      new Date('2024-01-02'),
      new Date('2024-01-07')
    ]);
  });

  it('handles quick date range presets', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const last7DaysButton = screen.getByText('Last 7 days');
    fireEvent.click(last7DaysButton);

    expect(defaultProps.onDateRangeChange).toHaveBeenCalled();
  });

  it('handles clear all cameras', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(defaultProps.onCameraChange).toHaveBeenCalledWith([]);
  });

  it('handles select all cameras', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    expect(defaultProps.onCameraChange).toHaveBeenCalledWith(['camera1', 'camera2', 'camera3']);
  });

  it('displays active filters summary', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    expect(screen.getByText('Active Filters:')).toBeInTheDocument();
    expect(screen.getByText(/View Type: Hourly/)).toBeInTheDocument();
    expect(screen.getByText(/Date Range: 2024-01-01 to 2024-01-07/)).toBeInTheDocument();
    expect(screen.getByText(/Selected Cameras: All Cameras/)).toBeInTheDocument();
  });

  it('displays selected cameras in summary', () => {
    render(<WaitingTimeFilters {...defaultProps} selectedCameras={['camera1', 'camera2']} />);

    expect(screen.getByText(/Selected Cameras: camera1, camera2/)).toBeInTheDocument();
  });

  it('disables controls when loading', () => {
    render(<WaitingTimeFilters {...defaultProps} isLoading={true} />);

    const viewTypeSelect = screen.getByLabelText('View Type');
    const startDateInput = screen.getByLabelText('Start Date');
    const cameraSelect = screen.getByLabelText('Cameras');

    expect(viewTypeSelect).toBeDisabled();
    expect(startDateInput).toBeDisabled();
    expect(cameraSelect).toBeDisabled();
  });

  it('renders quick date range buttons', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 days')).toBeInTheDocument();
  });

  it('displays camera options with group information', () => {
    render(<WaitingTimeFilters {...defaultProps} />);

    expect(screen.getByText('Camera 1 (Group A)')).toBeInTheDocument();
    expect(screen.getByText('Camera 2 (Group B)')).toBeInTheDocument();
    expect(screen.getByText('Camera 3 (Group A)')).toBeInTheDocument();
  });
}); 