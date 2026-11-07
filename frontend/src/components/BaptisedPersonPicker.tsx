import React, { KeyboardEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, DropletsIcon, ExternalLinkIcon, LockIcon, SearchIcon, XIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { Person, SacramentType } from '../types/records';
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
  onChange: (personId: string | undefined) => void;
  error?: string;
  excludeId?: string;
  onViewPerson: (personId: string) => void;
  onRecordBaptism: () => void;
}

const linkClass = 'font-semibold text-forest underline decoration-gold/60 underline-offset-4 transition-colors duration-150 hover:text-gold';

export function BaptisedPersonPicker({ idPrefix, heading, type, personId, onChange, error, excludeId, onViewPerson, onRecordBaptism }: BaptisedPersonPickerProps) {
  const { people, records, getPerson, recordsFor } = useRecords();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = personId ? getPerson(personId) : undefined;

  const matches = useMemo(
    () =>
    searchPeople(people, query, 6).
    filter((p) => p.id !== excludeId).
    map((person) => ({ person, eligibility: checkEligibility(type, recordsFor(person.id)) })),
    // records is a dependency so eligibility refreshes after new records are saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, records, query, excludeId, type]
  );
  const showList = open && matches.length > 0;

  const select = (p: Person) => {
    onChange(p.id);
    setQuery('');
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
      const m = matches[active];
      if (m?.eligibility.ok) select(m.person);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  if (selected) {
    const baptism = recordsFor(selected.id).find((r) => r.type === 'baptism');
    const facts = [
    // { label: 'Gender', value: selected.gender },
     { label: 'Registration number', value: selected.regNo },
    { label: 'Date of birth', value: formatDate(selected.dob) },
    { label: 'Home parish', value: shortParishName(selected.parishId) },
    { label: "Father's name", value: selected.fatherName || '—' },
    { label: "Mother's name", value: selected.motherName || '—' },
    { label: 'Village', value: selected.village || '—' },
    { label: 'Baptised at', value: baptism ? parishName(baptism.parishId) : '—' },
    { label: 'Baptised on', value: baptism ? formatDate(baptism.date) : '—' },
    { label: 'Baptism Reg. No.', value: baptism?.certificateNo ?? '—' }];

    return (
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-forest">{heading}</legend>
        <div className="overflow-hidden rounded-xl border border-sage-ink/20">
          <div className="flex flex-col gap-3 bg-sage px-4 py-3.5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-sage-ink">{initials(selected.fullName)}</span>
              <div className="min-w-0 text-sm">
                <p className="flex items-center gap-1.5 text-xs font-medium text-sage-ink">
                  <CheckCircle2Icon className="h-3.5 w-3.5" /> Found in the baptism register
                </p>
                <button type="button" onClick={() => onViewPerson(selected.id)} className={`${linkClass} text-base`}>
                  {selected.fullName}
                </button>
                <p className="text-ink/75">
                  Reg. No{' '}
                  <button type="button" onClick={() => onViewPerson(selected.id)} className={linkClass}>{selected.regNo}</button>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => onViewPerson(selected.id)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-paper px-3 py-1.5 text-xs font-medium text-forest transition-colors duration-150 hover:bg-cream">
                <ExternalLinkIcon className="h-3.5 w-3.5" /> View details
              </button>
              <button type="button" onClick={() => onChange(undefined)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-sage-ink transition-colors duration-150 hover:bg-white/60">
                <XIcon className="h-3.5 w-3.5" /> Change
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 bg-paper px-4 py-4 text-sm sm:grid-cols-3">
            {facts.map((f) =>
            <div key={f.label} className="min-w-0">
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="truncate font-medium text-ink">{f.value}</dd>
              </div>
            )}
          </dl>
        </div>
      </fieldset>);

  }

  const noMatch = query.trim().length >= 2 && matches.length === 0;

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-forest">{heading}</legend>
      <div className="relative">
        <Field
          label="Search the baptism register"
          htmlFor={`${idPrefix}-search`}
          required
          error={error}
          hint="Only baptised people can receive this sacrament. Their details fill in automatically.">
          
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id={`${idPrefix}-search`}
              role="combobox"
              aria-expanded={showList}
              aria-controls={`${idPrefix}-results`}
              aria-autocomplete="list"
              autoComplete="off"
              value={query}
              placeholder="Type a name or registration number…"
              onChange={(e) => {
                setQuery(e.target.value);
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
            id={`${idPrefix}-results`}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 right-0 top-[4.6rem] z-20 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-xl">
            
              {matches.map(({ person: p, eligibility }, i) =>
            <li key={p.id} role="option" aria-selected={i === active} aria-disabled={!eligibility.ok}>
                  <button
                type="button"
                disabled={!eligibility.ok}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (eligibility.ok) select(p);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100 disabled:cursor-not-allowed ${
                i === active && eligibility.ok ? 'bg-cream' : ''}`
                }>
                
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${eligibility.ok ? 'bg-sage text-sage-ink' : 'bg-cream text-muted'}`}>
                      {initials(p.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium ${eligibility.ok ? 'text-ink' : 'text-muted'}`}>{p.fullName}</span>
                      <span className="block truncate text-xs text-muted">
                        Reg. {p.regNo} · born {formatDate(p.dob)} · {shortParishName(p.parishId)}
                      </span>
                    </span>
                    {!eligibility.ok &&
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-medium text-amber-ink">
                        <LockIcon className="h-3 w-3" /> {eligibility.reason}
                      </span>
                }
                  </button>
                </li>
            )}
            </motion.ul>
          }
        </AnimatePresence>

        {noMatch &&
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">
              No baptised person matches “{query}”. People enter the register through baptism.
            </p>
            <button type="button" onClick={onRecordBaptism} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gold-soft px-3 py-1.5 text-xs font-semibold text-gold transition-colors duration-150 hover:bg-gold hover:text-white">
              <DropletsIcon className="h-3.5 w-3.5" /> Record baptism first
            </button>
          </div>
        }
      </div>
    </fieldset>);

}