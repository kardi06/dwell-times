import React from "react";
import { Line } from "react-chartjs-2";
import { chartTheme } from "./index";

export interface WaitingTimeDataPoint {
  time_period: string;
  waiting_count: number;
  camera_info: {
    camera_description: string;
    camera_group: string;
  };
}

interface WaitingTimeChartProps {
  data: WaitingTimeDataPoint[];
  viewType: "hourly" | "daily";
  title?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export const WaitingTimeChart: React.FC<WaitingTimeChartProps> = ({
  data,
  viewType,
  title = "Waiting Time Analytics",
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading waiting time chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-red-500">Error loading chart: {error.message}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">No waiting time data available</div>
      </div>
    );
  }

  let labels: string[];
  if (viewType === 'hourly') {
    // Hours 10–22
    const hours = Array.from({ length: 13 }, (_, i) => i + 10);
    labels = hours.map(h => {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const suffix = h < 12 ? 'AM' : 'PM';
      return `${hour12} ${suffix}`;
    });
  } else {
    // Days Monday–Sunday
    labels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  }

  // Group data by camera group for better visualization
  // const cameraGroups = [
  //   ...new Set(data.map((item) => item.camera_info.camera_group)),
  // ];
  const cameraGroups = [
    ...new Set(
      data.map(item => item.camera_info?.camera_group ?? "All")
    )
  ];

  // Create datasets for each camera group
  const datasets = cameraGroups.map((group, index) => {
    const groupData = data.filter(
      // (item) => item.camera_info.camera_group === group,
      item => (item.camera_info?.camera_group ?? "All") === group
    );

    // Sort by time period to ensure proper line continuity
    // const sortedData = groupData.sort((a, b) => {
    //   const timeA = new Date(a.time_period).getTime();
    //   const timeB = new Date(b.time_period).getTime();
    //   return timeA - timeB;
    // });
    // For each label, find matching data-point (or 0)
    // const series = labels.map(label => {
    //   if (viewType === 'hourly') {
    //     // find the item whose time_period hour matches
    //     const match = groupData.find(d => {
    //       const dt = new Date(d.time_period);
    //       const h = dt.getHours();
    //       // recreate same label string
    //       const hour12 = h % 12 === 0 ? 12 : h % 12;
    //       const suffix = h < 12 ? 'AM' : 'PM';
    //       return `${hour12} ${suffix}` === label;
    //     });
    //     return match ? match.waiting_count : 0;
    //   } else {
    //     // daily: match weekday name
    //     const match = groupData.find(d => {
    //       const weekday = new Date(d.time_period).toLocaleDateString('en-US', { weekday: 'long' });
    //       return weekday === label;
    //     });
    //     return match ? match.waiting_count : 0;
    //   }
    // });
    const series = labels.map(label => {
      // get all items that belong to this label
      const hits = groupData.filter(d => {
        const dt = new Date(d.time_period);
        if (viewType === 'hourly') {
          // recreate your label logic (e.g. "10 AM", "11 PM", etc)
          const h = dt.getHours();
          const hour12 = h % 12 === 0 ? 12 : h % 12;
          const suffix = h < 12 ? 'AM' : 'PM';
          return `${hour12} ${suffix}` === label;
        } else {
          // daily: match weekday names
          const weekday = dt.toLocaleDateString('en-US',{ weekday: 'long' });
          return weekday === label;
        }
      });
    
      // sum them all
      return hits.reduce((sum, row) => sum + row.waiting_count, 0);
    });

    return {
      label: group || "All Group",
      // data: sortedData.map((item) => item.waiting_count),
      data: series,
      borderColor: getColorForIndex(index),
      backgroundColor: getColorForIndex(index),
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  // Get all unique time periods for labels
  // const timeLabels = [...new Set(data.map((item) => item.time_period))].sort(
  //   (a, b) => {
  //     const timeA = new Date(a).getTime();
  //     const timeB = new Date(b).getTime();
  //     return timeA - timeB;
  //   },
  // );

  // const chartData = {
  //   labels: timeLabels,
  //   datasets,
  // };
  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: chartTheme.fonts.title,
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: function (context: any) {
            const timePeriod = context[0].label;
            return `Time: ${timePeriod}`;
          },
          label: function (context: any) {
            const dataset = context.dataset;
            const value = context.parsed.y;
            return `${dataset.label}: ${value} people waiting`;
          },
          // afterLabel: function (context: any) {
          //   // Add camera information if available
          //   const dataIndex = context.dataIndex;
          //   const timePeriod = context[0].label;
          //   const matchingData = data.find(
          //     (item) => item.time_period === timePeriod,
          //   );

          //   if (matchingData) {
          //     return `Camera: ${matchingData.camera_info.camera_description}`;
          //   }
          //   return "";
          // },
          afterLabel: function(tooltipItem: any) {
            // ✅ tooltipItem is a single TooltipItem
            const timePeriod = tooltipItem.label;
            const matching = data.find(d => d.time_period === timePeriod);
            return matching
              ? `Camera: ${matching.camera_info.camera_description}`
              : '';
          }
        },
      },
    },
    scales: {
      x: {
        ticks: { autoSkip: false },  
        title: {
          display: true,
          text: viewType === "hourly" ? "Time (Hour)" : "Day of Week",
          // font: chartTheme.fonts.axis,
        },
        // ticks: {
        //   font: chartTheme.fonts.axis,
        //   maxRotation: 45,
        //   minRotation: 45,
        // },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of People Waiting",
          font: chartTheme.fonts.axis,
        },
        ticks: {
          font: chartTheme.fonts.axis,
          callback: function (value: any) {
            return Math.round(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    animation: {
      duration: chartTheme.animations.duration,
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Helper function to generate colors for different camera groups
function getColorForIndex(index: number): string {
  const colors = [
    "#3B82F6", // Blue
    "#EC4899", // Pink
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#84CC16", // Lime
  ];

  return colors[index % colors.length];
}
