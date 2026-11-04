import React, { KeyboardEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLinkIcon, InfoIcon, SearchIcon, UserPlusIcon, XIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { Gender, Person, SpouseDraft } from '../types/records';
import { formatDate, initials } from '../utils/format';
import { searchPeople } from '../utils/people';
import { parishName, shortParishName } from '../utils/sacraments';
import { inputClass, lockedClass } from '../utils/styles';
import { Field } from './Field';

interface SpouseLookupProps {
  draft: SpouseDraft;
  onChange: (draft: SpouseDraft) => void;
  error?: string;
  excludeId?: string;
  preferredGender?: Gender;
  onViewPerson: (personId: string) => void;
}

export const emptySpouse: SpouseDraft = { fullName: '', baptisedAt: '', baptisedOn: '', baptismRegNo: '' };

export function SpouseLookup({ draft, onChange, error, excludeId, preferredGender, onViewPerson }: SpouseLookupProps) {
  const { people, getPerson, recordsFor } = useRecords();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const linked = draft.personId ? getPerson(draft.personId) : undefined;
  const linkedBaptism = linked ? recordsFor(linked.id).find((r) => r.type === 'baptism') : undefined;
  const baptismLocked = Boolean(linkedBaptism);

  const matches = useMemo(() => {
    if (linked) return [];
    return searchPeople(people, draft.fullName, 8).
    filter((p) => p.id !== excludeId).
    sort((a, b) => Number(b.gender === preferredGender) - Number(a.gender === preferredGender)).
    slice(0, 5);
  }, [linked, people, draft.fullName, excludeId, preferredGender]);
  const showList = open && matches.length > 0;

  const select = (p: Person) => {
    const baptism = recordsFor(p.id).find((r) => r.type === 'baptism');
    onChange({
      personId: p.id,
      fullName: p.fullName,
      baptisedAt: baptism ? parishName(baptism.parishId) : '',
      baptisedOn: baptism?.date ?? '',
      baptismRegNo: baptism?.certificateNo ?? ''
    });
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(matches[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const linkClass = 'font-semibold text-forest underline decoration-gold/60 underline-offset-4 transition-colors duration-150 hover:text-gold';

  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-forest">Spouse</legend>

      {linked ?
      <div className="flex flex-col gap-3 rounded-xl border border-sage-ink/20 bg-sage px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-sage-ink">
              {initials(linked.fullName)}
            </span>
            <div className="min-w-0 text-sm">
              <button type="button" onClick={() => onViewPerson(linked.id)} className={`${linkClass} text-base`}>
                {linked.fullName}
              </button>
              <p className="text-ink/75">
                Reg. No{' '}
                <button type="button" onClick={() => onViewPerson(linked.id)} className={linkClass}>
                  {linked.regNo}
                </button>{' '}
                · {shortParishName(linked.parishId)} · born {formatDate(linked.dob)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
            type="button"
            onClick={() => onViewPerson(linked.id)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-paper px-3 py-1.5 text-xs font-medium text-forest transition-colors duration-150 hover:bg-cream">
            
              <ExternalLinkIcon className="h-3.5 w-3.5" /> View details
            </button>
            <button
            type="button"
            onClick={() => onChange(emptySpouse)}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-sage-ink transition-colors duration-150 hover:bg-white/60">
            
              <XIcon className="h-3.5 w-3.5" /> Change
            </button>
          </div>
        </div> :

      <div className="relative">
          <Field
          label="Spouse name or Reg. No."
          htmlFor="spouse-name"
          required
          error={error}
          hint={
          draft.fullName.trim().length >= 2 && matches.length === 0 ?
          <span className="inline-flex items-center gap-1">
                  <UserPlusIcon className="h-3.5 w-3.5" /> Not baptised in this register — enter their baptism details from their certificate below.
                </span> :

          'Search the register so the spouse is linked to this marriage.'

          }>
          
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
              id="spouse-name"
              role="combobox"
              aria-expanded={showList}
              aria-controls="spouse-suggestions"
              aria-autocomplete="list"
              autoComplete="off"
              value={draft.fullName}
              placeholder="Type the spouse's name or registration number…"
              onChange={(e) => {
                onChange({ ...draft, fullName: e.target.value });
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
              className={`${inputClass} pl-9`} />
            
            </div>
          </Field>
          <AnimatePresence>
            {showList &&
          <motion.ul
            id="spouse-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 right-0 top-[4.6rem] z-20 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-xl">
            
                <li className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Already registered</li>
                {matches.map((p, i) =>
            <li key={p.id} role="option" aria-selected={i === active}>
                    <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(p);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100 ${i === active ? 'bg-cream' : ''}`}>
                
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage text-xs font-semibold text-sage-ink">{initials(p.fullName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{p.fullName}</span>
                        <span className="block truncate text-xs text-muted">
                          Reg. {p.regNo} · {p.gender} · {shortParishName(p.parishId)}
                        </span>
                      </span>
                    </button>
                  </li>
            )}
              </motion.ul>
          }
          </AnimatePresence>
        </div>
      }

      {linked && !linkedBaptism &&
      <p className="flex items-start gap-2 text-xs text-amber-ink">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No baptism is on record for {linked.fullName}. Enter the details from their baptism certificate.
        </p>
      }

      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
        <Field label="Baptised at" htmlFor="spouse-bap-at">
          <input id="spouse-bap-at" value={draft.baptisedAt} readOnly={baptismLocked} placeholder="Parish of baptism" onChange={(e) => onChange({ ...draft, baptisedAt: e.target.value })} className={`${inputClass} ${baptismLocked ? lockedClass : ''}`} />
        </Field>
        <Field label="On" htmlFor="spouse-bap-on">
          <input id="spouse-bap-on" type="date" value={draft.baptisedOn} readOnly={baptismLocked} onChange={(e) => onChange({ ...draft, baptisedOn: e.target.value })} className={`${inputClass} ${baptismLocked ? lockedClass : ''}`} />
        </Field>
        <Field label="Baptism Reg. No." htmlFor="spouse-bap-reg">
          <input id="spouse-bap-reg" value={draft.baptismRegNo} readOnly={baptismLocked} placeholder="e.g. BAP/1997/0204" onChange={(e) => onChange({ ...draft, baptismRegNo: e.target.value })} className={`${inputClass} ${baptismLocked ? lockedClass : ''}`} />
        </Field>
      </div>
    </fieldset>);

}