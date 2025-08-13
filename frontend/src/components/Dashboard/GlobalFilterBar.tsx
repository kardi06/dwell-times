import React from 'react';
import AsyncSelect from 'react-select/async';
import type { SingleValue } from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useGlobalFilters, TimePeriod } from '../../store/globalFilters';

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
    const q = input ? `?search=${encodeURIComponent(input)}` : '';
    const items = await fetchItems(`/api/v1/analytics/filters/departments${q}`);
    return toOptions(items);
  };
  const loadStores = async (input: string) => {
    const params = new URLSearchParams();
    if (draft.department) params.append('department', draft.department);
    if (input) params.append('search', input);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const items = await fetchItems(`/api/v1/analytics/filters/stores${qs}`);
    return toOptions(items);
  };

  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  const selectedDepartment = draft.department ? { value: draft.department, label: draft.department } : null;
  const selectedStore = draft.store ? { value: draft.store, label: draft.store } : null;

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b mb-4">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="min-w-[220px]">
          <label className="text-sm text-gray-700 mb-1 block">Department</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            isClearable
            isSearchable
            value={selectedDepartment}
            onChange={(opt: SingleValue<Option>) => setDraft({ department: opt?.value || '', store: '' })}
            loadOptions={loadDepartments}
            placeholder="All departments"
          />
        </div>
        <div className="min-w-[220px]">
          <label className="text-sm text-gray-700 mb-1 block">Store</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            isClearable
            isSearchable
            isDisabled={!draft.department}
            value={selectedStore}
            onChange={(opt: SingleValue<Option>) => setDraft({ store: opt?.value || '' })}
            loadOptions={loadStores}
            placeholder="All stores"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 mb-1">Time Period</label>
          <select
            value={draft.timePeriod}
            onChange={(e) => setDraft({ timePeriod: e.target.value as TimePeriod })}
            className="px-3 py-2 border rounded"
          >
            {timePeriods.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 mb-1">Date</label>
          <DatePicker
            selected={draft.date}
            onChange={(d) => setDraft({ date: d as Date })}
            dateFormat={draft.timePeriod === 'day' ? 'yyyy-MM-dd' : draft.timePeriod === 'month' || draft.timePeriod === 'quarter' ? 'yyyy-MM' : draft.timePeriod === 'year' ? 'yyyy' : 'yyyy-MM-dd'}
            showWeekPicker={draft.timePeriod === 'week'}
            showMonthYearPicker={draft.timePeriod === 'month' || draft.timePeriod === 'quarter'}
            showYearPicker={draft.timePeriod === 'year'}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={apply}>Apply</button>
          <button className="px-4 py-2 border rounded" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
};
