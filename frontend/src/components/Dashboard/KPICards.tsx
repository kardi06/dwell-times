import React from 'react';
import {
//   Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton
} from '@mui/material';
import {
  People,
  AccessTime,
  TrendingUp,
  Videocam,
  Event
} from '@mui/icons-material';

interface KPIMetrics {
  total_unique_visitors?: number;
  average_dwell_time?: number;
  max_dwell_time?: number;
  total_events_processed?: number;
  cameras_with_activity?: number;
}

interface KPICardsProps {
  metrics: KPIMetrics | null;
  loading: boolean;
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, color, loading = false }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 1,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      
      {loading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const KPICards: React.FC<KPICardsProps> = ({ metrics, loading }) => {
  const formatDwellTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const cards = [
    {
      title: 'Total Visitors',
      value: metrics?.total_unique_visitors || 0,
      icon: <People sx={{ color: 'white' }} />,
      color: '#1976d2'
    },
    {
      title: 'Avg Dwell Time',
      value: metrics?.average_dwell_time ? formatDwellTime(metrics.average_dwell_time) : '0m',
      icon: <AccessTime sx={{ color: 'white' }} />,
      color: '#388e3c'
    },
    {
      title: 'Max Dwell Time',
      value: metrics?.max_dwell_time ? formatDwellTime(metrics.max_dwell_time) : '0m',
      icon: <TrendingUp sx={{ color: 'white' }} />,
      color: '#f57c00'
    },
    {
      title: 'Events Processed',
      value: metrics?.total_events_processed || 0,
      icon: <Event sx={{ color: 'white' }} />,
      color: '#7b1fa2'
    },
    {
      title: 'Active Cameras',
      value: metrics?.cameras_with_activity || 0,
      icon: <Videocam sx={{ color: 'white' }} />,
      color: '#d32f2f'
    }
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3 }}>
      {cards.map((card, index) => (
        <KPICard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          loading={loading}
        />
      ))}
    </Box>
  );
};

export default KPICards; 