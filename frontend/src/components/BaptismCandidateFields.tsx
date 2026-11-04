import React, { useMemo } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { Gender, PersonDraft, PersonDraftErrors } from '../types/records';
import { formatDate } from '../utils/format';
import { searchPeople } from '../utils/people';
import { shortParishName } from '../utils/sacraments';
import { inputClass } from '../utils/styles';
import { Field } from './Field';

interface BaptismCandidateFieldsProps {
  draft: PersonDraft;
  onChange: (draft: PersonDraft) => void;
  errors: PersonDraftErrors;
  onViewPerson: (personId: string) => void;
}

export function BaptismCandidateFields({ draft, onChange, errors, onViewPerson }: BaptismCandidateFieldsProps) {
  const { people } = useRecords();
  const possibleDuplicates = useMemo(
    () => draft.fullName.trim().length >= 3 ? searchPeople(people, draft.fullName, 3) : [],
    [people, draft.fullName]
  );
  const update = <K extends keyof PersonDraft,>(key: K, value: PersonDraft[K]) => onChange({ ...draft, [key]: value });

  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-forest">Person being baptised</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="bap-name" required error={errors.fullName} className="sm:col-span-2" hint="A registration number is assigned when the baptism is saved.">
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
        <Field label="Date of birth" htmlFor="bap-dob" required error={errors.dob}>
          <input id="bap-dob" type="date" value={draft.dob} onChange={(e) => update('dob', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Father's name" htmlFor="bap-father">
          <input id="bap-father" value={draft.fatherName} onChange={(e) => update('fatherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Mother's name" htmlFor="bap-mother">
          <input id="bap-mother" value={draft.motherName} onChange={(e) => update('motherName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Village / address" htmlFor="bap-village">
          <input id="bap-village" value={draft.village} onChange={(e) => update('village', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone (parent or guardian)" htmlFor="bap-phone">
          <input id="bap-phone" type="tel" value={draft.phone} placeholder="+256…" onChange={(e) => update('phone', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </fieldset>);

}