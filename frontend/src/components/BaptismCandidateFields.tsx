import React, { useMemo } from 'react';
import { AlertTriangleIcon, InfoIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { CandidateType, PersonDraft, PersonDraftErrors } from '../types/records';
import { ageFrom, formatDate } from '../utils/format';
import { searchPeople } from '../utils/people';
import { parishName, shortParishName } from '../utils/sacraments';
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

export function BaptismCandidateFields({ mode, candidateType, onCandidateTypeChange, draft, onChange, errors, onViewPerson }: BaptismCandidateFieldsProps) {
  const { people } = useRecords();
  const update = <K extends keyof PersonDraft,>(key: K, value: PersonDraft[K]) => onChange({ ...draft, [key]: value });

  const fullName = `${draft.christianName} ${draft.surname}`.trim();
  const possibleDuplicates = useMemo(
    () => fullName.length >= 3 ? searchPeople(people, fullName, 3) : [],
    [people, fullName]
  );

  // Step 1: choose Child or Adult (baptism only)
  if (mode === 'baptism' && !candidateType) {
    return (
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-forest">Who is being baptised?</legend>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['infant', 'Infant', 'Under 4 years', UserIcon],
            ['adult', 'Adult', '4 years and above', UsersIcon]
          ] as const).map(([value, label, hint, Icon]) =>
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

  const isChild = candidateType === 'child';
  const age = draft.dob ? ageFrom(draft.dob) : null;
  const ageMismatch =
  mode === 'baptism' && age !== null && (isChild && age >= 7 || candidateType === 'adult' && age < 7);

  // Step 2: the card, in the order of the register card
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-forest">
        <span>
          {mode === 'conversion' ? 'Person joining the Catholic Church' : `${isChild ? 'Child' : 'Adult'} baptism`}
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

        
        <Field label="Reg. No. (INF/AD)" htmlFor="bap-reg" required error={errors.regNo}>
          <input id="bap-reg" autoComplete="on" value={draft.regNo} onChange={(e) => update('regNo', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Date of Baptism" htmlFor="bap-date" required error={errors.dateOfBaptism}>
          <input id="bap-date" type="date" value={draft.dateOfBaptism} onChange={(e) => update('dateOfBaptism', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Christian Name" htmlFor="bap-christian" required error={errors.christianName}>
          <input id="bap-christian" autoComplete="on" value={draft.christianName} onChange={(e) => update('christianName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Surname" htmlFor="bap-surname" required error={errors.surname}>
          <input id="bap-surname" autoComplete="on" value={draft.surname} onChange={(e) => update('surname', e.target.value)} className={inputClass} />
        </Field>
        

        {possibleDuplicates.length > 0 &&
        <div className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink" role="status">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              Similar names are already baptised. Check this is not the same person.
            </p>
            <ul className="mt-2 space-y-1 pl-6">
              {possibleDuplicates.map((p) =>
            <li key={p.id}>
                  <button type="button" onClick={() => onViewPerson(p.id)} className="font-semibold underline underline-offset-2 hover:text-forest">
                    {p.fullName}
                  </button>{' '}
                  · Reg. {p.regNo} · born {formatDate(p.dob)} · {shortParishName(p.parishId)}
                </li>
            )}
            </ul>
          </div>
        }

        <Field
          label="Date of Birth"
          htmlFor="bap-dob"
          required
          error={errors.dob}
          hint={ageMismatch ? <span className="text-amber-ink">They are {age}. This is usually recorded as {isChild ? 'an adult' : 'a child'} baptism.</span> : undefined}>
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