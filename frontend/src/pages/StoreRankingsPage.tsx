import React, { useMemo, useState, useCallback } from "react";
import { GlobalFilterBar } from "../components/Dashboard/GlobalFilterBar";
import { Card } from "../components/ui";
import { useGlobalFilters } from "../store/globalFilters";
import { computeRange, toApiDate } from "../utils/dateRange";
import { analyticsAPI } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { Drawer } from "antd";

interface Row { store: string; division?: string; department?: string; value: number; delta: number }

const StoreRankingsPage: React.FC = () => {
	const { division, department, timePeriod, date } = useGlobalFilters() as any;
	const { start, end } = useMemo(() => computeRange(timePeriod, date ?? new Date()), [timePeriod, date]);
	// const [limit, setLimit] = useState<5 | 10>(5);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedStore, setSelectedStore] = useState<string | null>(null);

	const onRowClick = useCallback((store: string) => {
		setSelectedStore(store);
		setDrawerOpen(true);
	}, []);

	// Top 5 by visitors
	const topVisitorsQuery = useQuery({
		queryKey: ["store-rankings", "visitors", "top", division, department, start, end],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "visitors",
				order: "desc",
				limit: 5,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	// Bottom 5 by visitors
	const bottomVisitorsQuery = useQuery({
		queryKey: ["store-rankings", "visitors", "bottom", division, department, start, end],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "visitors",
				order: "asc",
				limit: 5,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	// Top 5 by avg dwell time (seconds -> minutes shown)
	const topAvgDwellQuery = useQuery({
		queryKey: ["store-rankings", "dwell_avg", "top", division, department, start, end],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "dwell_avg",
				order: "desc",
				limit: 5,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	// Bottom 5 by avg dwell time
	const bottomAvgDwellQuery = useQuery({
		queryKey: ["store-rankings", "dwell_avg", "bottom", division, department, start, end],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "dwell_avg",
				order: "asc",
				limit: 5,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	const renderVisitorRow = (row: Row, idx: number) => (
		<div key={`${row.store}-${idx}`} className="flex items-center justify-between cursor-pointer" onClick={() => onRowClick(row.store)}>
			<div className="flex-1 pr-4">
				<div className="text-sm font-medium text-gray-800">{row.store || "Unknown"}</div>
				<div className="w-full bg-gray-100 rounded h-2 mt-1">
					<div className="bg-blue-500 h-2 rounded" style={{ width: `${Math.min(100, row.value)}%` }} />
				</div>
			</div>
			<div className="text-sm text-gray-700 min-w-[90px] text-right">{row.value} visitor</div>
		</div>
	);

	const renderDwellRow = (row: Row, idx: number, color: string) => {
		const minutes = Math.round((row.value || 0) / 60);
		return (
			<div key={`${row.store}-${idx}`} className="flex items-center justify-between cursor-pointer" onClick={() => onRowClick(row.store)}>
				<div className="flex-1 pr-4">
					<div className="text-sm font-medium text-gray-800">{row.store || "Unknown"}</div>
					<div className="w-full bg-gray-100 rounded h-2 mt-1">
						<div className={`${color} h-2 rounded`} style={{ width: `${Math.min(100, minutes)}%` }} />
					</div>
				</div>
				<div className="text-sm text-gray-700 min-w-[90px] text-right">{minutes} minutes</div>
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Store Rankings</h1>
				</div>
				<GlobalFilterBar />

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
					{/* Top Visitors */}
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Top 5 Stores by Visitors</h2>
						</div>
						{topVisitorsQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : topVisitorsQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(topVisitorsQuery.data?.rows ?? []).map((row, idx) => renderVisitorRow(row, idx))}
								{(topVisitorsQuery.data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>

					{/* Bottom Visitors */}
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Bottom 5 Stores by Visitors</h2>
						</div>
						{bottomVisitorsQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : bottomVisitorsQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(bottomVisitorsQuery.data?.rows ?? []).map((row, idx) => renderVisitorRow(row, idx))}
								{(bottomVisitorsQuery.data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>

					{/* Top Avg Dwell Time */}
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Top 5 Stores by Avg Dwell Time (Longest)</h2>
						</div>
						{topAvgDwellQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : topAvgDwellQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(topAvgDwellQuery.data?.rows ?? []).map((row, idx) => renderDwellRow(row, idx, "bg-emerald-500"))}
								{(topAvgDwellQuery.data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>

					{/* Bottom Avg Dwell Time */}
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Bottom 5 Stores by Avg Dwell Time (Fastest)</h2>
						</div>
						{bottomAvgDwellQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : bottomAvgDwellQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(bottomAvgDwellQuery.data?.rows ?? []).map((row, idx) => renderDwellRow(row, idx, "bg-rose-500"))}
								{(bottomAvgDwellQuery.data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>
				</div>

				<Drawer title={selectedStore || 'Store Profile'} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={480}>
					<div className="space-y-3">
						<p className="text-gray-700">This is a placeholder drill-down. We will add store profile charts and camera list here.</p>
						<ul className="list-disc pl-5 text-gray-600">
							<li>Hourly/Daily trends</li>
							<li>Violations over time</li>
							<li>Camera list</li>
						</ul>
					</div>
				</Drawer>
			</div>
		</div>
	);
};

export default StoreRankingsPage;
