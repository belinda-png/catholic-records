import React from 'react';
import { ChevronDownIcon, MapPinIcon, RefreshCwIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { secondaryButton } from '../utils/styles';

interface ParishSelectorProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function ParishSelector({ refreshing, onRefresh }: ParishSelectorProps) {
  const { selectedParishId, setSelectedParishId, isStaff, myParishId, viewAll, setViewAll } = useUI();
  const { parishes = [] } = useRecords();
  const parish = parishes.find((p) => p.id === selectedParishId);
  const mine = parishes.find((p) => p.id === myParishId);

  const tab = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-forest text-white' : 'text-forest hover:bg-cream'}`;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-sage-ink">
          <MapPinIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="relative min-w-0 flex-1">
          {isStaff ?
          <>
              <p className="block text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR PARISH</p>
              <p className="truncate text-base font-semibold text-forest">{mine?.name ?? '…'}</p>
            </> :

          <>
              <label htmlFor="parish-select" className="block text-[10px] font-semibold tracking-[0.14em] text-muted">SELECT PARISH</label>
              <select
              id="parish-select"
              value={selectedParishId}
              onChange={(e) => setSelectedParishId(e.target.value)}
              className="w-full cursor-pointer appearance-none truncate bg-transparent py-0.5 pr-8 text-base font-semibold text-forest outline-none focus-visible:underline">
                <option value="all">All parishes</option>
                {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 text-muted" aria-hidden="true" />
            </>
          }
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        {isStaff ?
        <div>
            <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted">PEOPLE LIST SHOWS</p>
            <div className="flex gap-1 rounded-xl border border-line p-1">
              <button type="button" onClick={() => setViewAll(true)} className={tab(viewAll)}>All parishes</button>
              <button type="button" onClick={() => setViewAll(false)} className={tab(!viewAll)}>My parish</button>
            </div>
          </div> :

        <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">DEANERY</p>
            <p className="text-sm font-medium text-forest">{parish ? parish.deanery : `${parishes.length} parishes`}</p>
          </div>
        }
        <button type="button" onClick={onRefresh} disabled={refreshing} className={secondaryButton}>
          <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>
    </section>);

}