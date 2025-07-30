import React from "react";
import { Card } from "../ui";

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
  trend?: string;
}> = ({ title, value, icon, color, loading = false, trend }) => (
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
      title: "Max Dwell Time",
      value: metrics?.max_dwell_time
        ? formatDwellTime(metrics.max_dwell_time)
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
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: "#f59e0b",
      trend: "+8% from last week",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <KPICard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          loading={loading}
          trend={card.trend}
        />
      ))}
    </div>
  );
};

export default KPICards;
