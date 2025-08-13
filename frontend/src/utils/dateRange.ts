export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export function computeRange(timePeriod: TimePeriod, anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  const end = new Date(anchor);
  switch (timePeriod) {
    case 'day':
      break;
    case 'week': {
      const sunday = new Date(anchor);
      sunday.setDate(anchor.getDate() - anchor.getDay());
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      return { start: sunday, end: saturday };
    }
    case 'month': {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return { start: first, end: last };
    }
    case 'quarter': {
      const q = Math.floor(anchor.getMonth() / 3);
      const startMonth = q * 3;
      const endMonth = startMonth + 2;
      return { start: new Date(anchor.getFullYear(), startMonth, 1), end: new Date(anchor.getFullYear(), endMonth + 1, 0) };
    }
    case 'year':
      return { start: new Date(anchor.getFullYear(), 0, 1), end: new Date(anchor.getFullYear(), 11, 31) };
  }
  return { start, end };
}

export function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
