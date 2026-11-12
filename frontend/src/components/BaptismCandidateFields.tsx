import React, { useMemo, useState } from 'react';
import { AlertTriangleIcon, InfoIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { CandidateType, Person, PersonDraft, PersonDraftErrors } from '../types/records';
import { ageFrom, formatDate } from '../utils/format';
import { parishName } from '../utils/sacraments';
import { inputClass } from '../utils/styles';
import { Field } from './Field';

interface BaptismCandidateFieldsProps {
  mode: 'baptism' | 'conversion';
  candidateType: CandidateType | undefined;
  onCandidateTypeChange: (value: CandidateType | undefined) => void;
  draft: PersonDraft;
  onChange: (draft: PersonDraft) => void;
  errors: PersonDraftErrors;
  onViewPerson: (personId: string) => void;
}

const INFANT_AGE = 4;

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const stripZeros = (s: string) => clean(s).replace(/^0+/, '');

function findPeople(people: Person[], query: string, byReg: boolean, limit = 6): Person[] {
  const q = query.trim();
  if (!q) return [];

  if (byReg) {
    const c = clean(q);
    const z = stripZeros(q);
    if (!c) return [];
    return people
      .filter((p) => {
        const r = clean(p.regNo);
        return r.includes(c) || (z.length > 0 && stripZeros(p.regNo).includes(z));
      })
      .slice(0, limit);
  }

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.join('').length < 2) return [];
  return people
    .filter((p) => {
      const hay = `${p.fullName} ${p.regNo}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

const splitName = (p: Person) => {
  const parts = p.fullName.trim().split(/\s+/);
  return {
    christian: p.christianName ?? parts[0] ?? '',
    surname: p.surname ?? parts.slice(1).join(' ')
  };
};

export function BaptismCandidateFields({ mode, candidateType, onCandidateTypeChange, draft, onChange, errors, onViewPerson }: BaptismCandidateFieldsProps) {
  const { people } = useRecords();
  const [focus, setFocus] = useState<'reg' | 'name' | null>(null);
  const update = <K extends keyof PersonDraft,>(key: K, value: PersonDraft[K]) => onChange({ ...draft, [key]: value });

  const fullName = `${draft.christianName} ${draft.surname}`.trim();

  const matches = useMemo(
    () => (focus === 'reg' ? findPeople(people, draft.regNo, true) : focus === 'name' ? findPeople(people, fullName, false) : []),
    [people, draft.regNo, fullName, focus]
  );

  const alreadyIn = useMemo(
    () => people.filter((p) =>
    stripZeros(draft.regNo).length > 0 && stripZeros(p.regNo) === stripZeros(draft.regNo) ||
    fullName.length >= 3 && p.fullName.toLowerCase() === fullName.toLowerCase()
    ).slice(0, 3),
    [people, draft.regNo, fullName]
  );

  const pick = (p: Person) => {
    const n = splitName(p);
    onChange({
      ...draft,
      christianName: n.christian,
      surname: n.surname,
      dob: p.dob,
      fatherName: p.fatherName,
      motherName: p.motherName,
      godparentName: p.godparentName ?? '',
      village: p.village,
      phone: p.phone
    });
    setFocus(null);
  };

  const suggestions =
  matches.length > 0 &&
  <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-paper py-1 shadow-xl">
      <li className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Already in the system</li>
      {matches.map((p) =>
    <li key={p.id} role="option" aria-selected="false">
          <div className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-cream">
            <button type="button" onMouseDown={(e) => {e.preventDefault();pick(p);}} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-ink">{p.fullName}</span>
              <span className="block truncate text-xs text-muted">Reg. {p.regNo} · Baptised in {parishName(p.parishId)}</span>
            </button>
            <button type="button" onMouseDown={(e) => {e.preventDefault();onViewPerson(p.id);}} className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-forest hover:bg-paper">View</button>
          </div>
        </li>
    )}
    </ul>;

  // Step 1: choose Infant or Adult (baptism only)
  if (mode === 'baptism' && !candidateType) {
    return (
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-forest">Who is being baptised?</legend>
        <div className="grid grid-cols-2 gap-3">
          {([
          ['infant', 'Infant', `Under ${INFANT_AGE} years`, UserIcon],
          ['adult', 'Adult', `${INFANT_AGE} years and above`, UsersIcon]] as
          const).map(([value, label, hint, Icon]) =>
          <button
            key={value}
            type="button"
            onClick={() => onCandidateTypeChange(value)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper p-8 text-forest transition-colors duration-150 hover:border-forest hover:bg-sage">
              <Icon className="mb-2 h-6 w-6" aria-hidden="true" />
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </button>
          )}
        </div>
      </fieldset>);
  }

  const isInfant = candidateType === 'infant';
  const age = draft.dob ? ageFrom(draft.dob) : null;
  const ageMismatch =
  mode === 'baptism' && age !== null && (isInfant && age >= INFANT_AGE || candidateType === 'adult' && age < INFANT_AGE);

  // Step 2: the card, in the order of the register card
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-forest">
        <span>
          {mode === 'conversion' ? 'Person joining the Catholic Church' : `${isInfant ? 'Infant' : 'Adult'} baptism`}
          {draft.parishId && <span className="ml-2 font-normal text-muted">· {parishName(draft.parishId)}</span>}
        </span>
        {mode === 'baptism' &&
        <button type="button" onClick={() => onCandidateTypeChange(undefined)} className="text-xs font-medium text-muted hover:text-gold">
            Change
          </button>
        }
      </legend>

      <div className="space-y-4">
        {mode === 'conversion' &&
        <p className="flex items-start gap-2 rounded-xl bg-sage px-4 py-3 text-sm text-sage-ink">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Converts are baptised when they are received. Saving records their Catholic baptism.
          </p>
        }

        {alreadyIn.length > 0 &&
        <div className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink" role="status">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              This person is already registered in the system.
            </p>
            <ul className="mt-2 space-y-1 pl-6">
              {alreadyIn.map((p) =>
            <li key={p.id}>
                  <button type="button" onClick={() => onViewPerson(p.id)} className="font-semibold underline underline-offset-2 hover:text-forest">{p.fullName}</button>
                  {' '}· Reg. {p.regNo} · baptised in {parishName(p.parishId)} on {formatDate(p.registeredOn)}
                </li>
            )}
            </ul>
          </div>
        }

        <div className="relative">
          <Field label="Reg. No. (INF/AD)" htmlFor="bap-reg" required error={errors.regNo}>
            <input id="bap-reg" autoComplete="off" value={draft.regNo}
            onChange={(e) => {update('regNo', e.target.value);setFocus('reg');}}
            onFocus={() => setFocus('reg')} onBlur={() => setFocus(null)} className={inputClass} />
          </Field>
          {focus === 'reg' && suggestions}
        </div>

        <Field label="Date of Baptism" htmlFor="bap-date" required error={errors.dateOfBaptism}>
          <input id="bap-date" type="date" value={draft.dateOfBaptism} onChange={(e) => update('dateOfBaptism', e.target.value)} className={inputClass} />
        </Field>

        <div className="relative">
          <Field label="Christian Name" htmlFor="bap-christian" required error={errors.christianName}>
            <input id="bap-christian" autoComplete="off" value={draft.christianName}
            onChange={(e) => {update('christianName', e.target.value);setFocus('name');}}
            onFocus={() => setFocus('name')} onBlur={() => setFocus(null)} className={inputClass} />
          </Field>
        </div>
        <div className="relative">
          <Field label="Surname" htmlFor="bap-surname" required error={errors.surname}>
            <input id="bap-surname" autoComplete="off" value={draft.surname}
            onChange={(e) => {update('surname', e.target.value);setFocus('name');}}
            onFocus={() => setFocus('name')} onBlur={() => setFocus(null)} className={inputClass} />
          </Field>
          {focus === 'name' && suggestions}
        </div>

        <Field
          label="Date of Birth"
          htmlFor="bap-dob"
          required
          error={errors.dob}
          hint={ageMismatch ? <span className="text-amber-ink">They are {age}. This is usually recorded as {isInfant ? 'an adult' : 'an infant'} baptism.</span> : undefined}>
          <input id="bap-dob" type="date" value={draft.dob} onChange={(e) => update('dob', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Father" htmlFor="bap-father" required error={errors.fatherName}>
          <input id="bap-father" value={draft.fatherName} onChange={(e) => update('fatherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Mother" htmlFor="bap-mother" required error={errors.motherName}>
          <input id="bap-mother" value={draft.motherName} onChange={(e) => update('motherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="God Parent" htmlFor="bap-godparent" required error={errors.godparentName}>
          <input id="bap-godparent" value={draft.godparentName} onChange={(e) => update('godparentName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Residence" htmlFor="bap-village" required error={errors.village}>
          <input id="bap-village" value={draft.village} onChange={(e) => update('village', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Minister" htmlFor="bap-minister" required error={errors.minister}>
          <input id="bap-minister" value={draft.minister} placeholder="e.g. Fr. Charles Okello" onChange={(e) => update('minister', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone (optional)" htmlFor="bap-phone">
          <input id="bap-phone" type="tel" value={draft.phone} placeholder="+256…" onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </fieldset>);

}