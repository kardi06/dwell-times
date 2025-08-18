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
	const [limit, setLimit] = useState<5 | 10>(5);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedStore, setSelectedStore] = useState<string | null>(null);

	const onRowClick = useCallback((store: string) => {
		setSelectedStore(store);
		setDrawerOpen(true);
	}, []);

	const topVisitorsQuery = useQuery({
		queryKey: ["store-rankings", "visitors", division, department, start, end, limit],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "visitors",
				order: "desc",
				limit,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	const bottomAvgDwellQuery = useQuery({
		queryKey: ["store-rankings", "dwell_avg", division, department, start, end, limit],
		queryFn: async () => {
			const res = await analyticsAPI.getStoreRankings({
				metric: "dwell_avg",
				order: "asc",
				limit,
				division,
				department,
				start_date: toApiDate(start),
				end_date: toApiDate(end),
			});
			return res.data as { metric: string; rows: Row[] };
		},
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">Store Rankings</h1>
					<div className="flex items-center gap-2">
						<button className={`px-3 py-1 rounded ${limit === 5 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setLimit(5)}>Top 5</button>
						<button className={`px-3 py-1 rounded ${limit === 10 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setLimit(10)}>Top 10</button>
					</div>
				</div>
				<GlobalFilterBar />

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Top {limit} Stores by Visitors</h2>
						</div>
						{topVisitorsQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : topVisitorsQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(topVisitorsQuery.data?.rows ?? []).map((row, idx) => (
									<div key={`${row.store}-${idx}`} className="flex items-center justify-between cursor-pointer" onClick={() => onRowClick(row.store)}>
										<div className="flex-1 pr-4">
											<div className="text-sm font-medium text-gray-800">{row.store || "Unknown"}</div>
											<div className="w-full bg-gray-100 rounded h-2 mt-1">
												<div className="bg-blue-500 h-2 rounded" style={{ width: `${Math.min(100, row.value)}%` }} />
											</div>
										</div>
										<div className="text-sm text-gray-700 min-w-[60px] text-right">{row.value}</div>
									</div>
								))}
								{(topVisitorsQuery.data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>

					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Bottom {limit} Stores by Avg Dwell Time</h2>
						</div>
						{bottomAvgDwellQuery.isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : bottomAvgDwellQuery.error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(bottomAvgDwellQuery.data?.rows ?? []).map((row, idx) => (
									<div key={`${row.store}-${idx}`} className="flex items-center justify-between cursor-pointer" onClick={() => onRowClick(row.store)}>
										<div className="flex-1 pr-4">
											<div className="text-sm font-medium text-gray-800">{row.store || "Unknown"}</div>
											<div className="w-full bg-gray-100 rounded h-2 mt-1">
												<div className="bg-rose-500 h-2 rounded" style={{ width: `${Math.min(100, row.value)}%` }} />
											</div>
										</div>
										<div className="text-sm text-gray-700 min-w-[60px] text-right">{row.value.toFixed ? row.value.toFixed(0) : row.value}</div>
									</div>
								))}
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
