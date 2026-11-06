import React, { useMemo } from 'react';
import { AlertTriangleIcon, InfoIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { CandidateType, PersonDraft, PersonDraftErrors } from '../types/records';
import { ageFrom, formatDate } from '../utils/format';
import { searchPeople } from '../utils/people';
import { shortParishName } from '../utils/sacraments';
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

export function BaptismCandidateFields({
  mode, candidateType, onCandidateTypeChange, draft, onChange, errors, onViewPerson,
}: BaptismCandidateFieldsProps) {
  const { people, parishes } = useRecords();
  const update = <K extends keyof PersonDraft,>(key: K, value: PersonDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const fullName = `${draft.christianName} ${draft.surname}`.trim();
  const possibleDuplicates = useMemo(
    () => (fullName.length >= 3 ? searchPeople(people, fullName, 3) : []),
    [people, fullName]
  );

  const age = draft.dob ? ageFrom(draft.dob) : null;
  const ageMismatch =
    mode === 'baptism' && age !== null &&
    ((candidateType === 'child' && age >= 7) || (candidateType === 'adult' && age < 7));

  // Step 1: choose Child or Adult (not needed for conversions)
  if (mode === 'baptism' && !candidateType) {
    return (
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-forest">Who is being baptised?</legend>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['child', 'Child', 'Under 7 years', UserIcon],
            ['adult', 'Adult', '7 years and above', UsersIcon],
          ] as const).map(([value, label, hint, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => onCandidateTypeChange(value)}
              className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper p-6 text-forest transition-colors hover:border-forest hover:bg-sage">
              <Icon className="mb-1 h-6 w-6" aria-hidden="true" />
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  const isChild = candidateType === 'child';

  // Step 2: the card
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-forest">
        <span>
          {mode === 'conversion'
            ? 'Person joining the Catholic Church'
            : `${isChild ? 'Child' : 'Adult'} baptism`}
        </span>
        {mode === 'baptism' && (
          <button
            type="button"
            onClick={() => onCandidateTypeChange(undefined)}
            className="text-xs font-medium text-muted hover:text-gold">
            Change
          </button>
        )}
      </legend>

      {mode === 'conversion' && (
        <p className="flex items-start gap-2 rounded-xl bg-sage px-4 py-3 text-sm text-sage-ink">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Converts are baptised when they are received. Saving records their Catholic baptism.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parish" htmlFor="b-parish" required error={errors.parishId} className="sm:col-span-2" hint="Also becomes their home parish.">
          <select id="b-parish" value={draft.parishId} onChange={(e) => update('parishId', e.target.value)} className={inputClass}>
            <option value="">Select parish…</option>
            {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="Reg No" htmlFor="b-reg" required error={errors.regNo}>
          <input id="b-reg" autoComplete="off" value={draft.regNo} onChange={(e) => update('regNo', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Date of baptism" htmlFor="b-date" required error={errors.dateOfBaptism}>
          <input id="b-date" type="date" value={draft.dateOfBaptism} onChange={(e) => update('dateOfBaptism', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Christian name" htmlFor="b-christian" required error={errors.christianName}>
          <input id="b-christian" autoComplete="off" value={draft.christianName} placeholder="e.g. Bibiana" onChange={(e) => update('christianName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Surname" htmlFor="b-surname" required error={errors.surname}>
          <input id="b-surname" autoComplete="off" value={draft.surname} placeholder="e.g. Mukhaye" onChange={(e) => update('surname', e.target.value)} className={inputClass} />
        </Field>

        {possibleDuplicates.length > 0 && (
          <div className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink sm:col-span-2" role="status">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              Similar names are already baptised. Check this is not the same person.
            </p>
            <ul className="mt-2 space-y-1 pl-6">
              {possibleDuplicates.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onViewPerson(p.id)} className="font-semibold underline underline-offset-2 hover:text-forest">
                    {p.fullName}
                  </button>{' '}
                  · Reg. {p.regNo} · born {formatDate(p.dob)} · {shortParishName(p.parishId)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Field
          label="Date of birth"
          htmlFor="b-dob"
          error={errors.dob}
          className="sm:col-span-2"
          hint={ageMismatch
            ? <span className="text-amber-ink">They are {age}. This is usually recorded as {isChild ? 'an adult' : 'a child'} baptism.</span>
            : undefined}>
          <input id="b-dob" type="date" value={draft.dob} onChange={(e) => update('dob', e.target.value)} className={`${inputClass} sm:max-w-xs`} />
        </Field>

        <Field label="Father" htmlFor="b-father">
          <input id="b-father" value={draft.fatherName} onChange={(e) => update('fatherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Mother" htmlFor="b-mother">
          <input id="b-mother" value={draft.motherName} onChange={(e) => update('motherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label={isChild || mode === 'conversion' ? (isChild ? 'Godparent' : 'Sponsor') : 'Sponsor'} htmlFor="b-godparent">
          <input id="b-godparent" value={draft.godparentName} onChange={(e) => update('godparentName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Residence" htmlFor="b-residence">
          <input id="b-residence" value={draft.village} onChange={(e) => update('village', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Minister" htmlFor="b-minister">
          <input id="b-minister" value={draft.minister} placeholder="e.g. Fr. Charles Okello" onChange={(e) => update('minister', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="b-phone">
          <input id="b-phone" type="tel" value={draft.phone} placeholder="+256…" onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </fieldset>
  );
}