import React from 'react';
import { ChevronDownIcon, MapPinIcon, RefreshCwIcon } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useRecords } from '../contexts/RecordsContext';
import { secondaryButton } from '../utils/styles';

interface ParishSelectorProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function ParishSelector({ refreshing, onRefresh }: ParishSelectorProps) {
  const { selectedParishId, setSelectedParishId } = useUI();
  const parish = parishes.find((p) => p.id === selectedParishId);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-sage-ink">
          <MapPinIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="relative min-w-0 flex-1">
          <label htmlFor="parish-select" className="block text-[10px] font-semibold tracking-[0.14em] text-muted">
            SELECT PARISH
          </label>
          <select
            id="parish-select"
            value={selectedParishId}
            onChange={(e) => setSelectedParishId(e.target.value)}
            className="w-full cursor-pointer appearance-none truncate bg-transparent py-0.5 pr-8 text-base font-semibold text-forest outline-none focus-visible:underline">
            
            <option value="all">All parishes</option>
            {parishes.map((p) =>
            <option key={p.id} value={p.id}>
                {p.name}
              </option>
            )}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 text-muted" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-6 border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">DEANERY</p>
          <p className="text-sm font-medium text-forest">{parish ? parish.deanery : `${parishes.length} parishes`}</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing} className={secondaryButton}>
          <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>
    </section>);

}