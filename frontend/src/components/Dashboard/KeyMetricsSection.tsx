import React from 'react';
import { Users, Clock, Camera } from 'lucide-react';
import MetricCard from './MetricCard';

interface KeyMetricsData {
  totalVisitors: number;
  avgDwellTime: number; // in minutes
  activeCameras: number;
  trends: {
    totalVisitors: number;
    avgDwellTime: number;
    activeCameras: number;
  };
}

interface KeyMetricsSectionProps {
  data: KeyMetricsData | null;
  loading: boolean;
}

const KeyMetricsSection: React.FC<KeyMetricsSectionProps> = ({ data, loading }) => {
  const formatDwellTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const metrics = [
    {
      title: "Total Visitor",
      value: data?.totalVisitors || 0,
      trend: data?.trends.totalVisitors || 0,
      color: 'teal' as const,
      icon: <Users className="w-5 h-5 text-teal-600" />
    },
    {
      title: "Avg Dwell Time",
      value: data?.avgDwellTime ? formatDwellTime(data.avgDwellTime) : "0m",
      trend: data?.trends.avgDwellTime || 0,
      color: 'purple' as const,
      icon: <Clock className="w-5 h-5 text-purple-600" />
    },
    {
      title: "Active Camera",
      value: data?.activeCameras || 0,
      trend: data?.trends.activeCameras || 0,
      color: 'yellow' as const,
      icon: <Camera className="w-5 h-5 text-yellow-600" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          trend={metric.trend}
          color={metric.color}
          icon={metric.icon}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default KeyMetricsSection; 