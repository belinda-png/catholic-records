import React, { useMemo, useState } from 'react';
import { ArrowRightIcon, SearchIcon, UserIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { formatDate } from '../utils/format';
import { shortParishName } from '../utils/sacraments';
import { secondaryButton } from '../utils/styles';
import { SacramentProgress } from './SacramentProgress';

interface PeopleDirectoryProps {
  limit?: number;
  onViewAll?: () => void;
}

export function PeopleDirectory({ limit, onViewAll }: PeopleDirectoryProps) {
  const { people, records } = useRecords();
  const { selectedParishId, openProfile } = useUI();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
      (selectedParishId === 'all' || p.parishId === selectedParishId) && (
      !q || p.fullName.toLowerCase().includes(q) || p.regNo.includes(q))
    );
  }, [people, query, selectedParishId]);

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const recordsOf = (id: string) => records.filter((r) => r.personId === id || r.spouseId === id);

  return (
    <section className="rounded-2xl border border-line bg-paper" aria-labelledby="directory-title">
      <div className="flex items-start justify-between gap-4 px-4 pt-5 sm:px-6">
        <div>
          <h2 id="directory-title" className="text-lg font-semibold text-forest">People directory</h2>
          <p className="text-xs text-muted">Everyone baptised into the register · search by name or registration number</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-sage px-3 py-1 text-xs font-semibold text-sage-ink">
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <label htmlFor="directory-search" className="sr-only">Search people</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="directory-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a name or registration number…"
            className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-4 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15" />
          
        </div>
      </div>

      {visible.length === 0 ?
      <div className="px-6 py-12 text-center">
          <p className="font-medium text-forest">No one matches “{query}”</p>
          <p className="mt-1 text-sm text-muted">Try another spelling. People enter the register when their baptism is recorded.</p>
        </div> :

      <>
          <div className="mt-4 hidden overflow-x-auto px-6 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-left text-[10px] font-semibold tracking-[0.12em] text-muted">
                  <th className="rounded-l-lg px-3 py-3">PERSON</th>
                  <th className="px-3 py-3">REGISTRATION NO.</th>
                  <th className="px-3 py-3">HOME PARISH</th>
                  <th className="px-3 py-3">DATE OF BIRTH</th>
                  <th className="px-3 py-3">SACRAMENTS</th>
                  <th className="rounded-r-lg px-3 py-3 text-right">PROFILE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((p) =>
              <tr key={p.id}>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-sage text-sage-ink"><UserIcon className="h-4 w-4" aria-hidden="true" /></span>
                        <span className="font-semibold text-ink">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-forest">{p.regNo}</td>
                    <td className="px-3 py-3.5 text-gold">{shortParishName(p.parishId)}</td>
                    <td className="px-3 py-3.5 text-muted">{formatDate(p.dob)}</td>
                    <td className="px-3 py-3.5"><SacramentProgress records={recordsOf(p.id)} /></td>
                    <td className="px-3 py-3.5 text-right">
                      <button type="button" onClick={() => openProfile(p.id)} className={`${secondaryButton} px-3 py-1.5 text-xs`}>View history</button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 divide-y divide-line md:hidden">
            {visible.map((p) =>
          <li key={p.id}>
                <button type="button" onClick={() => openProfile(p.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 active:bg-cream">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage text-sage-ink"><UserIcon className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{p.fullName}</span>
                    <span className="block truncate text-xs text-muted">Reg. {p.regNo} · {shortParishName(p.parishId)}</span>
                    <span className="mt-1.5 block"><SacramentProgress records={recordsOf(p.id)} /></span>
                  </span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </button>
              </li>
          )}
          </ul>
        </>
      }

      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[11px] text-muted sm:px-6">
        <span>Showing {visible.length} of {filtered.length}</span>
        {onViewAll && filtered.length > visible.length ?
        <button type="button" onClick={onViewAll} className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-gold">
            View all people <ArrowRightIcon className="h-3.5 w-3.5" />
          </button> :

        <span>{filtered.length} results</span>
        }
      </div>
    </section>);

}