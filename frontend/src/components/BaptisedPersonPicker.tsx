import React, { KeyboardEvent, useMemo, useState } from 'react';
import { ExternalLinkIcon, SearchIcon, UserPlusIcon, XIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { SacramentType } from '../types/records';
import { formatDate, initials } from '../utils/format';
import { searchPeople } from '../utils/people';
import { checkEligibility, parishName, shortParishName } from '../utils/sacraments';
import { inputClass } from '../utils/styles';
import { Field } from './Field';

interface BaptisedPersonPickerProps {
  idPrefix: string;
  heading: string;
  type: SacramentType;
  personId?: string;
  onChange: (id: string | undefined) => void;
  error?: string;
  excludeId?: string;
  onViewPerson: (personId: string) => void;
  onRecordBaptism: () => void;
}

export function BaptisedPersonPicker({ idPrefix, heading, type, personId, onChange, error, excludeId, onViewPerson, onRecordBaptism }: BaptisedPersonPickerProps) {
  const { people, getPerson, recordsFor } = useRecords();
  const { selectedParishId } = useUI();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = personId ? getPerson(personId) : undefined;

  const matches = useMemo(() => {
    const found = searchPeople(people, query, 30).filter((p) => p.id !== excludeId).map((p) => {
      const sameParish = p.parishId === selectedParishId;
      const elig = checkEligibility(type, recordsFor(p.id));
      const reason = !sameParish ? `Registered in ${shortParishName(p.parishId)}` : !elig.ok ? elig.reason : undefined;
      return { p, reason };
    });
    return found.sort((a, b) => Number(!!a.reason) - Number(!!b.reason)).slice(0, 8);
  }, [people, query, excludeId, selectedParishId, type, recordsFor]);

  const showList = open && query.trim().length >= 2;
  const choose = (i: number) => {
    const m = matches[i];
    if (!m || m.reason) return;
    onChange(m.p.id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList || matches.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % matches.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + matches.length) % matches.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
  };

  const linkClass = 'font-semibold text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold';

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-semibold text-forest">{heading}</legend>

      {selected ?
      <div className="flex flex-col gap-3 rounded-xl border border-sage-ink/20 bg-sage px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-sage-ink">{initials(selected.fullName)}</span>
            <div className="min-w-0 text-sm">
              <button type="button" onClick={() => onViewPerson(selected.id)} className={`${linkClass} text-base`}>{selected.fullName}</button>
              <p className="text-ink/75">Reg. No {selected.regNo} · {parishName(selected.parishId)} · born {formatDate(selected.dob)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onViewPerson(selected.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5 text-xs font-medium text-forest hover:bg-cream">
              <ExternalLinkIcon className="h-3.5 w-3.5" /> View
            </button>
            <button type="button" onClick={() => onChange(undefined)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-sage-ink hover:bg-white/60">
              <XIcon className="h-3.5 w-3.5" /> Change
            </button>
          </div>
        </div> :

      <div className="relative">
          <Field label="Name or Reg. No." htmlFor={`${idPrefix}-search`} required error={error} hint="Type a name or registration number. Each result shows the parish the person is registered in.">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
              id={`${idPrefix}-search`}
              role="combobox"
              aria-expanded={showList}
              autoComplete="off"
              value={query}
              placeholder="Search the baptism register…"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
              className={`${inputClass} pl-9`} />
            </div>
          </Field>

          {showList &&
        <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-paper py-1 shadow-xl">
              {matches.length === 0 ?
          <li className="px-3.5 py-3 text-sm text-muted">
                  <span className="flex items-center gap-2"><UserPlusIcon className="h-4 w-4" /> Not in the register.</span>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); onRecordBaptism(); }} className={`${linkClass} mt-1 text-xs`}>Record their baptism first</button>
                </li> :
          matches.map(({ p, reason }, i) =>
          <li key={p.id} role="option" aria-selected={i === active} aria-disabled={!!reason}>
                    <div className={`flex items-center gap-3 px-3.5 py-2.5 ${i === active && !reason ? 'bg-cream' : ''} ${reason ? 'opacity-60' : ''}`} onMouseEnter={() => setActive(i)}>
                      <button type="button" disabled={!!reason} onMouseDown={(e) => { e.preventDefault(); choose(i); }} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage text-xs font-semibold text-sage-ink">{initials(p.fullName)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{p.fullName}</span>
                          <span className="block truncate text-xs text-muted">Reg. {p.regNo} · {shortParishName(p.parishId)}{reason ? ` · ${reason}` : ''}</span>
                        </span>
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); onViewPerson(p.id); }} className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-forest hover:bg-cream">View</button>
                    </div>
                  </li>
          )}
            </ul>
        }
        </div>
      }
    </fieldset>);

}