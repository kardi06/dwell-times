import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatNumber, formatTrend, getTrendColor } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  color: 'teal' | 'purple' | 'yellow' | 'red' | 'blue';
  icon: React.ReactNode;
  loading?: boolean;
  subtitle?: string;
}

const colorMap: Record<NonNullable<MetricCardProps['color']>, string> = {
  teal: 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white',
  purple: 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 text-white',
  yellow: 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-gray-900',
  red: 'bg-gradient-to-br from-rose-500 via-red-600 to-red-700 text-white',
  blue: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white',
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  color,
  icon,
  loading = false,
  subtitle,
}) => {
  const getTrendIcon = () => {
    if (trend && trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend && trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4 opacity-70" />;
  };

  if (loading) {
    return (
      <Card className={`h-32 ${colorMap[color]} bg-opacity-60`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-white/30 rounded-lg animate-pulse" />
            <div className="w-16 h-4 bg-white/30 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-white/30 rounded animate-pulse mb-2" />
          <div className="h-4 bg-white/30 rounded w-1/2 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-32 ${colorMap[color]} shadow-sm hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-sm font-medium opacity-90">{title}</p>
          </div>
          {trend !== undefined && (
            <div className="flex items-center space-x-1 opacity-90">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                {formatTrend(trend)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl font-extrabold tracking-tight">
          {typeof value === 'number' ? formatNumber(value) : value}
        </CardTitle>
        {subtitle && <p className="text-xs opacity-90 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 