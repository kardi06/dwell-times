import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";

interface DashboardCardProps {
  title: string;
  subtitle: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  subtitle,
  controls,
  children,
}: DashboardCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
        <div>
          <CardTitle className="text-xl md:text-2xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {subtitle}
          </CardDescription>
        </div>
        {controls && <div className="mt-4 md:mt-0">{controls}</div>}
      </CardHeader>
      <CardContent className="p-6 space-y-6">{children}</CardContent>
    </Card>
  );
}
