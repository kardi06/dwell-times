import React from "react";
import AsyncSelect from "react-select/async";
import type { SingleValue } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalFilters, TimePeriod } from "../../store/globalFilters";

type Option = { value: string; label: string };

async function fetchItems(url: string): Promise<string[]> {
	const res = await fetch(url);
	if (!res.ok) return [];
	const json = await res.json();
	return json.items || [];
}

const toOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));

export const GlobalFilterBar: React.FC = () => {
	const { draft, setDraft, apply, reset } = useGlobalFilters();

	const loadDepartments = async (input: string) => {
		const q = input ? `?search=${encodeURIComponent(input)}` : "";
		const items = await fetchItems(`/api/v1/analytics/filters/departments${q}`);
		return toOptions(items);
	};
	const loadStores = async (input: string) => {
		if (!draft.department) return [];
		const params = new URLSearchParams();
		params.append("department", draft.department);
		if (input) params.append("search", input);
		const qs = params.toString() ? `?${params.toString()}` : "";
		const items = await fetchItems(`/api/v1/analytics/filters/stores${qs}`);
		return toOptions(items);
	};

	const timePeriods: { value: TimePeriod; label: string }[] = [
		{ value: "day", label: "Day" },
		{ value: "week", label: "Week" },
		{ value: "month", label: "Month" },
		{ value: "quarter", label: "Quarter" },
		{ value: "year", label: "Year" },
	];

	const selectedDepartment = draft.department
		? { value: draft.department, label: draft.department }
		: null;
	const selectedStore = draft.store ? { value: draft.store, label: draft.store } : null;

	const selectTheme = (theme: any) => ({
		...theme,
		colors: {
			...theme.colors,
			primary: "#b91c1c", // red-700
			primary75: "#dc2626",
			primary50: "#ef4444",
			primary25: "#fee2e2",
		},
	});

	const selectStyles: any = {
		control: (base: any, state: any) => ({
			...base,
			backgroundColor: "#ffffff",
			borderColor: state.isFocused ? "#dc2626" : "rgba(255,255,255,0.35)",
			boxShadow: "none",
			color: "#111827",
		}),
		singleValue: (base: any) => ({
			...base,
			color: "#111827",
		}),
		placeholder: (base: any) => ({
			...base,
			color: "#6b7280",
		}),
		input: (base: any) => ({
			...base,
			color: "#111827",
		}),
		menu: (base: any) => ({
			...base,
			backgroundColor: "#ffffff",
			color: "#111827",
		}),
		option: (base: any, state: any) => ({
			...base,
			color: "#111827",
			backgroundColor: state.isFocused ? "#fee2e2" : "#ffffff",
		}),
		indicatorSeparator: (base: any) => ({
			...base,
			backgroundColor: "#e5e7eb",
		}),
		dropdownIndicator: (base: any, state: any) => ({
			...base,
			color: state.isFocused ? "#b91c1c" : "#111827",
			":hover": { color: "#b91c1c" },
		}),
		clearIndicator: (base: any, state: any) => ({
			...base,
			color: state.isFocused ? "#b91c1c" : "#111827",
			":hover": { color: "#b91c1c" },
		}),
	};

	// Format preview text similar to ChartFilters.tsx
	const formatDateDisplay = (date: Date | null, period: TimePeriod): string => {
		if (!date) return "";
		switch (period) {
			case "day":
				return date.toLocaleDateString("en-US", {
					month: "long",
					day: "numeric",
					year: "numeric",
				});
			case "week": {
				const startOfWeek = new Date(date);
				startOfWeek.setDate(date.getDate() - date.getDay());
				const endOfWeek = new Date(startOfWeek);
				endOfWeek.setDate(startOfWeek.getDate() + 6);
				return `Week of ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
			}
			case "month":
				return date.toLocaleDateString("en-US", {
					month: "long",
					year: "numeric",
				});
			case "quarter": {
				const quarter = Math.floor(date.getMonth() / 3) + 1;
				const startMonth = (quarter - 1) * 3;
				const startDate = new Date(date.getFullYear(), startMonth, 1);
				const endDate = new Date(date.getFullYear(), startMonth + 2, 0);
				return `Q${quarter} ${date.getFullYear()} (${startDate.toLocaleDateString("en-US", { month: "short" })} - ${endDate.toLocaleDateString("en-US", { month: "short" })})`;
			}
			case "year":
				return String(date.getFullYear());
			default:
				return date.toLocaleDateString();
		}
	};

	return (
		<div className="sticky top-0 z-10 bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-md border-b border-red-900/40 mb-4 rounded-lg">
			<div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-end">
				<div className="min-w-[220px]">
					<label className="text-sm text-white/90 mb-1 block">Department</label>
					<AsyncSelect
						cacheOptions
						defaultOptions
						isClearable
						isSearchable
						value={selectedDepartment}
						onChange={(opt: SingleValue<Option>) =>
							setDraft({ department: opt?.value || "", store: "" })
						}
						loadOptions={loadDepartments}
						placeholder="All departments"
						theme={selectTheme}
						styles={selectStyles}
					/>
				</div>
				<div className="min-w-[220px]">
					<label className="text-sm text-white/90 mb-1 block">Store</label>
					<AsyncSelect
						key={`store-${draft.department || 'none'}`}
						cacheOptions={false}
						defaultOptions
						isClearable
						isSearchable
						isDisabled={!draft.department}
						value={selectedStore}
						onChange={(opt: SingleValue<Option>) => setDraft({ store: opt?.value || "" })}
						loadOptions={loadStores}
						placeholder="All stores"
						theme={selectTheme}
						styles={selectStyles}
					/>
				</div>
				<div className="flex flex-col">
					<label className="text-sm text-white/90 mb-1">Time Period</label>
					<select
						value={draft.timePeriod}
						onChange={(e) => setDraft({ timePeriod: e.target.value as TimePeriod })}
						className="px-3 py-2 rounded bg-white text-gray-900 border border-white/20 focus:outline-none"
					>
						{timePeriods.map((tp) => (
							<option key={tp.value} value={tp.value}>
								{tp.label}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-col">
					<label className="text-sm text-white/90 mb-1">Date</label>
					<div className="flex items-center gap-2">
						<DatePicker
							selected={draft.date}
							onChange={(d) => setDraft({ date: d as Date })}
							dateFormat={
								draft.timePeriod === "day"
									? "yyyy-MM-dd"
									: draft.timePeriod === "month" || draft.timePeriod === "quarter"
									? "yyyy-MM"
									: draft.timePeriod === "year"
									? "yyyy"
									: "yyyy-MM-dd"
							}
							showWeekPicker={draft.timePeriod === "week"}
							showMonthYearPicker={draft.timePeriod === "month" || draft.timePeriod === "quarter"}
							showYearPicker={draft.timePeriod === "year"}
							className="px-3 py-2 rounded bg-white text-gray-900 border border-white/20 focus:outline-none"
						/>
					</div>
				</div>
				<div className="ml-auto flex gap-2">
					{draft.date && (
						<span className="text-sm text-white/90 mt-2 mr-2">
							{formatDateDisplay(draft.date, draft.timePeriod)}
						</span>
					)}
					<button className="px-4 py-2 bg-white text-red-800 font-medium rounded hover:bg-red-50" onClick={apply}>
						Apply
					</button>
					<button className="px-4 py-2 border border-white/70 text-white rounded hover:bg-white/10" onClick={reset}>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
};
