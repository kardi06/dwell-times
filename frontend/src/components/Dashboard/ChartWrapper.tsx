import React from "react";

interface ChartWrapperProps {
  isLoading: boolean;
  hasData: boolean;
  children: React.ReactNode;
}

export function ChartWrapper({
  isLoading,
  hasData,
  children,
}: ChartWrapperProps) {
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }
  if (!hasData) {
    return (
      <div className="text-center text-gray-500 py-20">No data available</div>
    );
  }
  return <div className="w-full aspect-[16/9]">{children}</div>;
}
