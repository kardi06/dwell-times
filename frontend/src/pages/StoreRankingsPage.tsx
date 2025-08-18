import React, { useMemo } from "react";
import { GlobalFilterBar } from "../components/Dashboard/GlobalFilterBar";
import { Card } from "../components/ui";
import { useGlobalFilters } from "../store/globalFilters";
import { computeRange, toApiDate } from "../utils/dateRange";
import { analyticsAPI } from "../services/api";
import { useQuery } from "@tanstack/react-query";

interface Row { store: string; division?: string; department?: string; value: number; delta: number }

const StoreRankingsPage: React.FC = () => {
	const { division, department, timePeriod, date } = useGlobalFilters() as any;
	const { start, end } = useMemo(() => computeRange(timePeriod, date ?? new Date()), [timePeriod, date]);

	const { data, isLoading, error } = useQuery({
		queryKey: ["store-rankings", division, department, start, end],
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Store Rankings</h1>
				</div>
				<GlobalFilterBar />

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
					<Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm p-4">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold">Top 5 Stores by Visitors</h2>
						</div>
						{isLoading ? (
							<div className="h-48 animate-pulse bg-gray-100 rounded" />
						) : error ? (
							<div className="text-red-500">Failed to load rankings</div>
						) : (
							<div className="space-y-2">
								{(data?.rows ?? []).map((row, idx) => (
									<div key={`${row.store}-${idx}`} className="flex items-center justify-between">
										<div className="flex-1 pr-4">
											<div className="text-sm font-medium text-gray-800">{row.store || "Unknown"}</div>
											<div className="w-full bg-gray-100 rounded h-2 mt-1">
												<div className="bg-blue-500 h-2 rounded" style={{ width: `${Math.min(100, row.value)}%` }} />
											</div>
										</div>
										<div className="text-sm text-gray-700 min-w-[60px] text-right">{row.value}</div>
									</div>
								))}
								{(data?.rows?.length ?? 0) === 0 && (
									<div className="text-gray-400 italic">No data</div>
								)}
							</div>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
};

export default StoreRankingsPage;
