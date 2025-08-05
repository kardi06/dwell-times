import React from 'react';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import MetricCard from '../MetricCard';

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Total Visitors',
    value: 1234,
    trend: 12.5,
    color: 'teal' as const,
    icon: <Users className="w-5 h-5 text-teal-600" />,
  };

  it('renders correctly with all props', () => {
    render(<MetricCard {...defaultProps} />);
    
    expect(screen.getByText('Total Visitors')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<MetricCard {...defaultProps} loading={true} />);
    
    // Should show skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('displays correct trend colors', () => {
    const { rerender } = render(<MetricCard {...defaultProps} trend={12.5} />);
    expect(screen.getByText('+12.5%')).toHaveClass('text-success-green');

    rerender(<MetricCard {...defaultProps} trend={-5.2} />);
    expect(screen.getByText('-5.2%')).toHaveClass('text-error-red');

    rerender(<MetricCard {...defaultProps} trend={0} />);
    expect(screen.getByText('0.0%')).toHaveClass('text-gray-500');
  });

  it('applies correct color classes', () => {
    const { rerender } = render(<MetricCard {...defaultProps} color="teal" />);
    expect(document.querySelector('.bg-accent-teal')).toBeInTheDocument();

    rerender(<MetricCard {...defaultProps} color="purple" />);
    expect(document.querySelector('.bg-accent-purple')).toBeInTheDocument();

    rerender(<MetricCard {...defaultProps} color="yellow" />);
    expect(document.querySelector('.bg-accent-yellow')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    render(<MetricCard {...defaultProps} value={1000000} />);
    expect(screen.getByText('1.0M')).toBeInTheDocument();

    render(<MetricCard {...defaultProps} value={1500} />);
    expect(screen.getByText('1.5K')).toBeInTheDocument();

    render(<MetricCard {...defaultProps} value={500} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });
}); 