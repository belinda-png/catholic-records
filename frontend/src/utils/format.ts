import { differenceInYears, format, isValid, parseISO } from 'date-fns';

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = parseISO(value);
  return isValid(date) ? format(date, 'dd MMM yyyy') : value;
}

export function ageFrom(value: string): number | null {
  const date = parseISO(value);
  return isValid(date) ? differenceInYears(new Date(), date) : null;
}

export function initials(name: string): string {
  return name.
  split(/\s+/).
  filter(Boolean).
  slice(0, 2).
  map((part) => part.charAt(0).toUpperCase()).
  join('');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}