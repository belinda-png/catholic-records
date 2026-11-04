import React, { useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { sacraments } from '../data/sacraments';
import { SacramentRecord, SacramentType } from '../types/records';
import { formatDate } from '../utils/format';
import { getSacrament, shortParishName, toneClass } from '../utils/sacraments';
import { primaryButton } from '../utils/styles';
import { SacramentIcon } from './SacramentIcon';

type Filter = 'all' | SacramentType;

export function RecordsTable() {
  const { records, getPerson } = useRecords();
  const { selectedParishId, openProfile, openSacrament } = useUI();
  const [filter, setFilter] = useState<Filter>('all');

  const inParish = useMemo(
    () => records.filter((r) => selectedParishId === 'all' || r.parishId === selectedParishId),
    [records, selectedParishId]
  );
  const visible = [...inParish.filter((r) => filter === 'all' || r.type === filter)].sort((a, b) => b.date.localeCompare(a.date));

  const tabs: {id: Filter;label: string;count: number;}[] = [
  { id: 'all', label: 'All', count: inParish.length },
  ...sacraments.map((s) => ({ id: s.type as Filter, label: s.plural, count: inParish.filter((r) => r.type === s.type).length }))];


  const PersonLinks = ({ record }: {record: SacramentRecord;}) => {
    const a = getPerson(record.personId);
    const b = record.spouseId ? getPerson(record.spouseId) : undefined;
    const link = (id: string, name: string) =>
    <button type="button" onClick={() => openProfile(id)} className="font-semibold text-forest underline decoration-line underline-offset-4 transition-colors duration-150 hover:decoration-gold">
        {name}
      </button>;

    return (
      <span>
        {a ? link(a.id, a.fullName) : '—'}
        {b ?
        <> <span className="text-muted">&amp;</span> {link(b.id, b.fullName)}</> :
        record.extra.spouseName ?
        <> <span className="text-muted">&amp;</span> <span className="font-medium text-ink">{record.extra.spouseName}</span></> :
        null}
      </span>);

  };

  return (
    <section className="rounded-2xl border border-line bg-paper">
      <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div role="tablist" aria-label="Filter by sacrament" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((t) =>
          <button
            key={t.id}
            role="tab"
            aria-selected={filter === t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 ${
            filter === t.id ? 'bg-forest font-medium text-white' : 'text-muted hover:bg-cream hover:text-ink'}`
            }>
            
              {t.label} <span className={filter === t.id ? 'text-white/70' : 'text-muted/70'}>{t.count}</span>
            </button>
          )}
        </div>
        {filter !== 'all' &&
        <button type="button" onClick={() => openSacrament(filter)} className={primaryButton}>
            <PlusIcon className="h-4 w-4" /> New {getSacrament(filter).label}
          </button>
        }
      </div>

      {visible.length === 0 ?
      <p className="px-6 py-14 text-center text-sm text-muted">No records for this selection yet.</p> :

      <>
          <div className="mt-4 hidden overflow-x-auto px-6 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-left text-[10px] font-semibold tracking-[0.12em] text-muted">
                  <th className="rounded-l-lg px-3 py-3">SACRAMENT</th>
                  <th className="px-3 py-3">PERSON</th>
                  <th className="px-3 py-3">DATE</th>
                  <th className="px-3 py-3">PARISH</th>
                  <th className="px-3 py-3">MINISTER</th>
                  <th className="rounded-r-lg px-3 py-3">CERTIFICATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((r) =>
              <tr key={r.id}>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneClass(r.type)}`}><SacramentIcon type={r.type} className="h-3.5 w-3.5" /></span>
                        {getSacrament(r.type).label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5"><PersonLinks record={r} /></td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatDate(r.date)}</td>
                    <td className="px-3 py-3.5 text-gold">{shortParishName(r.parishId)}</td>
                    <td className="px-3 py-3.5 text-muted">{r.minister}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-medium text-forest">{r.certificateNo}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 divide-y divide-line md:hidden">
            {visible.map((r) =>
          <li key={r.id} className="flex gap-3 px-4 py-3.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toneClass(r.type)}`}><SacramentIcon type={r.type} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 text-sm">
                  <PersonLinks record={r} />
                  <p className="text-xs text-muted">{getSacrament(r.type).label} · {formatDate(r.date)}</p>
                  <p className="text-xs text-muted">{shortParishName(r.parishId)} · {r.certificateNo}</p>
                </div>
              </li>
          )}
          </ul>
        </>
      }
      <div className="border-t border-line px-4 py-3 text-[11px] text-muted sm:px-6">{visible.length} records</div>
    </section>);

}