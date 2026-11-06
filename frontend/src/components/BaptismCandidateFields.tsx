import React, { useMemo } from 'react';
import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { CandidateType, Gender, PersonDraft, PersonDraftErrors } from '../types/records';
import { ageFrom, formatDate } from '../utils/format';
import { searchPeople } from '../utils/people';
import { shortParishName } from '../utils/sacraments';
import { inputClass } from '../utils/styles';
import { Field } from './Field';

interface BaptismCandidateFieldsProps {
  mode: 'baptism' | 'conversion';
  candidateType: CandidateType;
  onCandidateTypeChange: (value: CandidateType) => void;
  draft: PersonDraft;
  onChange: (draft: PersonDraft) => void;
  errors: PersonDraftErrors;
  onViewPerson: (personId: string) => void;
}

export function BaptismCandidateFields({ mode, candidateType, onCandidateTypeChange, draft, onChange, errors, onViewPerson }: BaptismCandidateFieldsProps) {
  const { people } = useRecords();
  const isChild = mode === 'baptism' && candidateType === 'child';
  const possibleDuplicates = useMemo(
    () => draft.fullName.trim().length >= 3 ? searchPeople(people, draft.fullName, 3) : [],
    [people, draft.fullName]
  );
  const update = <K extends keyof PersonDraft,>(key: K, value: PersonDraft[K]) => onChange({ ...draft, [key]: value });

  const age = draft.dob ? ageFrom(draft.dob) : null;
  const ageMismatch =
  mode === 'baptism' && age !== null && (candidateType === 'child' && age >= 7 || candidateType === 'adult' && age < 7);

  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-forest">
        {mode === 'conversion' ? 'Person joining the Catholic Church' : 'Person being baptised'}
      </legend>

      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'baptism' ?
        <Field label="Baptism of" htmlFor="bap-candidate" required className="sm:col-span-2" hint={isChild ? 'Infant or child under 7 — parents and godparents are recorded.' : 'Person aged 7 or above, baptised after catechumenate.'}>
            <select id="bap-candidate" value={candidateType} onChange={(e) => onCandidateTypeChange(e.target.value as CandidateType)} className={`${inputClass} sm:max-w-xs`}>
              <option value="child">Child (under 7 years)</option>
              <option value="adult">Adult (7 years and above)</option>
            </select>
          </Field> :

        <p className="flex items-start gap-2 rounded-xl bg-sage px-4 py-3 text-sm text-sage-ink sm:col-span-2">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Converts are baptised when they are received. Saving records both the conversion and their Catholic baptism.
          </p>
        }

        <Field label="Full name" htmlFor="bap-name" required error={errors.fullName} className="sm:col-span-2" hint="A registration number is assigned when this is saved.">
          <input id="bap-name" autoComplete="off" value={draft.fullName} placeholder="e.g. Bibiana Mukhaye" onChange={(e) => update('fullName', e.target.value)} className={inputClass} />
        </Field>

        {possibleDuplicates.length > 0 &&
        <div className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink sm:col-span-2" role="status">
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

        <Field label="Gender" htmlFor="bap-gender" required error={errors.gender}>
          <select id="bap-gender" value={draft.gender} onChange={(e) => update('gender', e.target.value as Gender | '')} className={inputClass}>
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>
        <Field
          label="Date of birth"
          htmlFor="bap-dob"
          required
          error={errors.dob}
          hint={ageMismatch ? <span className="text-amber-ink">They are {age} — this is usually recorded as {candidateType === 'child' ? 'an adult' : 'a child'} baptism.</span> : undefined}>
          
          <input id="bap-dob" type="date" value={draft.dob} onChange={(e) => update('dob', e.target.value)} className={inputClass} />
        </Field>
        <Field label={isChild ? "Father's name" : "Father's name (optional)"} htmlFor="bap-father">
          <input id="bap-father" value={draft.fatherName} onChange={(e) => update('fatherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label={isChild ? "Mother's name" : "Mother's name (optional)"} htmlFor="bap-mother">
          <input id="bap-mother" value={draft.motherName} onChange={(e) => update('motherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Village / address" htmlFor="bap-village">
          <input id="bap-village" value={draft.village} onChange={(e) => update('village', e.target.value)} className={inputClass} />
        </Field>
        <Field label={isChild ? 'Phone (parent or guardian)' : 'Phone'} htmlFor="bap-phone">
          <input id="bap-phone" type="tel" value={draft.phone} placeholder="+256…" onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </fieldset>);

}