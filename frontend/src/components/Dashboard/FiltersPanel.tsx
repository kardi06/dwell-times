import React from "react";
import { Select } from "../ui/select";
import { Input } from "../ui/Input";

interface FiltersPanelProps {
  timePeriod: string;
  metricType: string;
  selectedDate: string;
  onTimePeriodChange: (v: string) => void;
  onMetricTypeChange: (v: string) => void;
  onDateChange: (v: string) => void;
}

export function FiltersPanel({ timePeriod, metricType, selectedDate, onTimePeriodChange, onMetricTypeChange, onDateChange }: FiltersPanelProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label htmlFor="date" className="sr-only">Date</label>
        <Input
          id="date"
          type="date"
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="timePeriod" className="sr-only">Time Period</label>
        <Select
        //   id="timePeriod"
          value={timePeriod}
          onValueChange={onTimePeriodChange}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </div>
      <div>
        <label htmlFor="metricType" className="sr-only">Metric Type</label>
        <Select
          // id="metricType"
          value={metricType}
          onValueChange={onMetricTypeChange}
        >
          <option value="average">Average</option>
          <option value="total">Total</option>
        </Select>
      </div>
    </div>
  );
}