import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Chart theme configuration
export const chartTheme = {
  colors: {
    male: '#3B82F6', // Blue
    female: '#EC4899', // Pink
    other: '#10B981', // Green
  },
  fonts: {
    title: {
      size: 16,
      weight: 'bold' as const
    },
    axis: {
      size: 12
    }
  },
  animations: {
    duration: 750
  }
};

// Export chart components
export { DwellTimeBarChart } from './DwellTimeBarChart';
export { DwellTimeLineChart } from './DwellTimeLineChart';
export { ChartFilters } from './ChartFilters';
export { FootTrafficChart } from './FootTrafficChart';
export { FootTrafficFilters } from './FootTrafficFilters';
export { WaitingTimeChart } from './WaitingTimeChart';
export { WaitingTimeFilters } from './WaitingTimeFilters'; 