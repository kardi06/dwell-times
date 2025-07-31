import React from "react";
import { Card } from "../ui";

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
  trend?: string;
  subtitle?: string;
}> = ({ title, value, icon, color, loading = false, trend, subtitle }) => (
  <Card
    variant="elevated"
    className="h-full transition-all duration-300 hover:scale-105 hover:shadow-large"
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-secondary-600 uppercase tracking-wide">
              {title}
            </h3>
            {trend && (
              <p className="text-xs text-success-600 font-medium">{trend}</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-secondary-200 rounded w-1/2"></div>
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold text-secondary-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-secondary-600 mb-1">{subtitle}</p>
          )}
          <p className="text-sm text-secondary-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
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

  const formatDwellTimeSeconds = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate demographic insights
  const getTopGender = () => {
    if (!metrics?.gender_analytics || metrics.gender_analytics.length === 0) {
      return { gender: 'N/A', count: 0 };
    }
    const topGender = metrics.gender_analytics.reduce((prev, current) => 
      prev.visitor_count > current.visitor_count ? prev : current
    );
    return { gender: topGender.gender, count: topGender.visitor_count };
  };

  const getTopAgeGroup = () => {
    if (!metrics?.age_group_analytics || metrics.age_group_analytics.length === 0) {
      return { age_group: 'N/A', count: 0 };
    }
    const topAgeGroup = metrics.age_group_analytics.reduce((prev, current) => 
      prev.visitor_count > current.visitor_count ? prev : current
    );
    return { age_group: topAgeGroup.age_group, count: topAgeGroup.visitor_count };
  };

  const getAverageDwellTimeByGender = () => {
    if (!metrics?.gender_analytics || metrics.gender_analytics.length === 0) {
      return 0;
    }
    const totalDwellTime = metrics.gender_analytics.reduce((sum, item) => sum + item.total_dwell_time, 0);
    const totalVisitors = metrics.gender_analytics.reduce((sum, item) => sum + item.visitor_count, 0);
    return totalVisitors > 0 ? totalDwellTime / totalVisitors : 0;
  };

  const topGender = getTopGender();
  const topAgeGroup = getTopAgeGroup();
  const avgDwellTimeByGender = getAverageDwellTimeByGender();

  const cards = [
    {
      title: "Total Visitors",
      value: metrics?.total_unique_visitors || 0,
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      color: "#3b82f6",
      trend: "+12% from last week",
    },
    {
      title: "Avg Dwell Time",
      value: metrics?.average_dwell_time
        ? formatDwellTime(metrics.average_dwell_time)
        : "0m",
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "#10b981",
      trend: "+5% from last week",
    },
    {
      title: "Top Gender",
      value: topGender.gender,
      subtitle: `${topGender.count} visitors`,
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      color: "#ec4899",
      trend: "Demographic insight",
    },
    {
      title: "Top Age Group",
      value: topAgeGroup.age_group,
      subtitle: `${topAgeGroup.count} visitors`,
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "#f59e0b",
      trend: "Demographic insight",
    },
    {
      title: "Events Processed",
      value: metrics?.total_events_processed || 0,
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      color: "#8b5cf6",
      trend: "+15% from last week",
    },
    {
      title: "Active Cameras",
      value: metrics?.cameras_with_activity || 0,
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "#ef4444",
      trend: "+3% from last week",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card, index) => (
        <KPICard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          loading={loading}
          trend={card.trend}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  );
};

export default KPICards;
