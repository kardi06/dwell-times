import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatNumber, formatTrend, getTrendColor } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  color: 'teal' | 'purple' | 'yellow';
  icon: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  color,
  icon,
  loading = false
}) => {
  const getTrendIcon = () => {
    if (trend && trend > 0) return <TrendingUp className="w-4 h-4 text-success-green" />;
    if (trend && trend < 0) return <TrendingDown className="w-4 h-4 text-error-red" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getColorClasses = () => {
    switch (color) {
      case 'teal':
        return 'bg-accent-teal border-teal-200';
      case 'purple':
        return 'bg-accent-purple border-purple-200';
      case 'yellow':
        return 'bg-accent-yellow border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={`${getColorClasses()} h-32`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getColorClasses()} h-32 transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-secondary-900 mb-2">{title}</p>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
            {icon}
          </div>
          {trend !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                {formatTrend(trend)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? formatNumber(value) : value}
        </CardTitle>
        
      </CardContent>
    </Card>
  );
};

export default MetricCard; 