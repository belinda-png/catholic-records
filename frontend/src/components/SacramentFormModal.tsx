import React, { FormEvent, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { parishes } from '../data/parishes';
import { CandidateType, PersonDraft, PersonDraftErrors, SacramentRecord, SacramentType, SpouseDraft } from '../types/records';
import { formatDate } from '../utils/format';
import { draftToPerson, emptyDraft } from '../utils/people';
import { checkEligibility, getSacrament, isEntryType, toneClass } from '../utils/sacraments';
import { inputClass, primaryButton, secondaryButton } from '../utils/styles';
import { BaptisedPersonPicker } from './BaptisedPersonPicker';
import { BaptismCandidateFields } from './BaptismCandidateFields';
import { Field } from './Field';
import { Modal } from './Modal';
import { PersonProfileModal } from './PersonProfileModal';
import { SacramentIcon } from './SacramentIcon';
import { emptySpouse, SpouseLookup } from './SpouseLookup';

interface SacramentFormModalProps {
  type: SacramentType;
  initialPersonId?: string;
  onClose: () => void;
}

interface Details {
  parishId: string;
  date: string;
  minister: string;
  sponsors: string;
  notes: string;
  extra: Record<string, string>;
}

type DetailErrors = Partial<Record<'parishId' | 'date' | 'minister' | 'previousReligion', string>>;

export function SacramentFormModal({ type, initialPersonId, onClose }: SacramentFormModalProps) {
  const config = getSacrament(type);
  const isEntry = isEntryType(type);
  const isConversion = type === 'conversion';
  const isMarriage = type === 'matrimony';
  const { getPerson, addPerson, addRecord, recordsFor } = useRecords();
  const { selectedParishId, openProfile, openSacrament } = useUI();
  const defaultParish = selectedParishId === 'all' ? '' : selectedParishId;
  const emptyDetails: Details = { parishId: defaultParish, date: '', minister: '', sponsors: '', notes: '', extra: {} };

  const [candidate, setCandidate] = useState<PersonDraft>(emptyDraft(defaultParish));
  const [candidateType, setCandidateType] = useState<CandidateType>(isConversion ? 'adult' : 'child');
  const [personId, setPersonId] = useState<string | undefined>(() =>
  !isEntry && initialPersonId && checkEligibility(type, recordsFor(initialPersonId)).ok ? initialPersonId : undefined
  );
  const [spouse, setSpouse] = useState<SpouseDraft>(emptySpouse);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [candidateErrors, setCandidateErrors] = useState<PersonDraftErrors>({});
  const [personError, setPersonError] = useState<string>();
  const [spouseError, setSpouseError] = useState<string>();
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saved, setSaved] = useState<{record: SacramentRecord;baptism?: SacramentRecord;} | null>(null);
  const [peek, setPeek] = useState<string[]>([]);

  const person = personId ? getPerson(personId) : undefined;
  const viewPerson = (id: string) => setPeek([id]);
  const sponsorsLabel = type === 'baptism' && candidateType === 'adult' ? 'Sponsor' : config.sponsorsLabel;

  const warnings: string[] = [];
  if (isMarriage) {
    [personId, spouse.personId].forEach((id) => {
      const p = id ? getPerson(id) : undefined;
      const prior = id ? recordsFor(id).find((r) => r.type === 'matrimony') : undefined;
      if (p && prior) warnings.push(`${p.fullName} already has a marriage on record (${prior.certificateNo}, ${formatDate(prior.date)}).`);
    });
  }

  const setDetail = <K extends keyof Details,>(key: K, value: Details[K]) => setDetails((d) => ({ ...d, [key]: value }));

  const reset = () => {
    setCandidate(emptyDraft(defaultParish));
    setPersonId(undefined);
    setSpouse(emptySpouse);
    setDetails(emptyDetails);
    setSaved(null);
    setStatus('idle');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cErr: PersonDraftErrors = {};
    let pErr: string | undefined;
    if (isEntry) {
      if (!candidate.fullName.trim()) cErr.fullName = 'Enter the full name';
      // if (!candidate.gender) cErr.gender = 'Select gender';
      if (!candidate.dob) cErr.dob = 'Enter date of birth';
    } else if (!personId) {
      pErr = 'Select a baptised person from the register';
    }
    const sErr = isMarriage && !spouse.fullName.trim() ? "Enter the spouse's name" : undefined;
    const dErr: DetailErrors = {};
    if (!details.parishId) dErr.parishId = 'Choose the parish';
    if (!details.date) dErr.date = 'Enter the date';
    if (!details.minister.trim()) dErr.minister = 'Enter the minister';
    if (isConversion && !details.extra.previousReligion?.trim()) dErr.previousReligion = 'Enter their previous religion';
    setCandidateErrors(cErr);
    setPersonError(pErr);
    setSpouseError(sErr);
    setDetailErrors(dErr);
    if (Object.keys(cErr).length || pErr || sErr || Object.keys(dErr).length) return;

    setStatus('saving');
    window.setTimeout(() => {
      const subjectId = isEntry ? addPerson(draftToPerson({ ...candidate, parishId: details.parishId })).id : personId as string;
      const common = {
        personId: subjectId,
        parishId: details.parishId,
        date: details.date,
        minister: details.minister.trim(),
        sponsors: details.sponsors.trim()
      };
      let extra = details.extra;
      if (type === 'baptism') extra = { ...extra, candidateType };
      if (isMarriage) {
        extra = {
          ...extra,
          spouseName: spouse.fullName.trim(),
          spouseBaptisedAt: spouse.baptisedAt,
          spouseBaptisedOn: spouse.baptisedOn,
          spouseBaptismRegNo: spouse.baptismRegNo
        };
      }
      const record = addRecord({ ...common, type, spouseId: isMarriage ? spouse.personId : undefined, notes: details.notes.trim(), extra });
      const baptism = isConversion ?
      addRecord({ ...common, type: 'baptism', notes: 'Baptised on reception into the Catholic Church', extra: { candidateType: 'adult', conversion: 'yes' } }) :
      undefined;
      setSaved({ record, baptism });
      setStatus('saved');
    }, 500);
  };

  const icon =
  <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass(type)}`}>
      <SacramentIcon type={type} className="h-5 w-5" />
    </span>;


  const peekLayer =
  <AnimatePresence>
      {peek.length > 0 &&
    <PersonProfileModal
      key="peek"
      stack={peek}
      onClose={() => setPeek([])}
      onOpenPerson={(id) => setPeek((s) => [...s, id])}
      onBack={() => setPeek((s) => s.slice(0, -1))} />

    }
    </AnimatePresence>;


  if (status === 'saved' && saved) {
    const main = getPerson(saved.record.personId);
    const other = saved.record.spouseId ? getPerson(saved.record.spouseId) : undefined;
    return (
      <Modal
        title={`${config.label} recorded`}
        subtitle={isEntry ? 'A new member has entered the register.' : 'The register has been updated.'}
        icon={icon}
        onClose={onClose}
        size="md"
        footer={
        <>
            <button type="button" onClick={reset} className={secondaryButton}>Record another</button>
            <button type="button" onClick={onClose} className={primaryButton}>Done</button>
          </>
        }>
        
        <div className="flex flex-col items-center py-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-sage text-sage-ink">
            <CheckIcon className="h-7 w-7" />
          </span>
          {isEntry && main &&
          <>
              <p className="mt-4 text-lg font-semibold text-forest">{main.fullName}</p>
              <p className="text-sm text-muted">Registration number <span className="font-semibold tracking-widest text-forest">{main.regNo}</span></p>
            </>
          }
          <p className="mt-4 text-sm text-muted">{config.label} Reg. No.</p>
          <p className="text-2xl font-semibold tracking-wide text-forest">{saved.record.certificateNo}</p>
          {saved.baptism &&
          <p className="mt-2 text-sm text-muted">
              Baptism Reg. No. <span className="font-semibold text-forest">{saved.baptism.certificateNo}</span>
            </p>
          }
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {main && <button type="button" onClick={() => openProfile(main.id)} className={secondaryButton}>View {main.fullName}</button>}
            {other && <button type="button" onClick={() => openProfile(other.id)} className={secondaryButton}>View {other.fullName}</button>}
          </div>
        </div>
      </Modal>);

  }

  return (
    <>
      <Modal
        title={`Record ${config.label}`}
        subtitle={type === 'baptism' ? 'Baptism is how a person enters the register.' : config.description}
        icon={icon}
        onClose={onClose}
        footer={
        <>
            <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
            <button type="submit" form="sacrament-form" disabled={status === 'saving'} className={primaryButton}>
              {status === 'saving' && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {status === 'saving' ? 'Saving…' : 'Save record'}
            </button>
          </>
        }>
        
        <form id="sacrament-form" onSubmit={handleSubmit} noValidate className="space-y-7">
          {isEntry ?
          <BaptismCandidateFields
            mode={isConversion ? 'conversion' : 'baptism'}
            candidateType={candidateType}
            onCandidateTypeChange={setCandidateType}
            draft={candidate}
            onChange={setCandidate}
            errors={candidateErrors}
            onViewPerson={viewPerson} /> :


          <BaptisedPersonPicker
            idPrefix="subject"
            heading={isMarriage ? 'Person getting married' : 'Person receiving the sacrament'}
            type={type}
            personId={personId}
            onChange={(id) => {
              setPersonId(id);
              setPersonError(undefined);
            }}
            error={personError}
            excludeId={spouse.personId}
            onViewPerson={viewPerson}
            onRecordBaptism={() => openSacrament('baptism')} />

          }

          <fieldset className="border-t border-line pt-6">
            <legend className="mb-3 text-sm font-semibold text-forest">
              {isMarriage ? 'Marriage' : isConversion ? 'Reception & baptism' : `${config.label} details`}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={isMarriage ? 'Date of marriage' : isConversion ? 'Date received & baptised' : `Date of ${config.label.toLowerCase()}`}
                htmlFor="d-date"
                required
                error={detailErrors.date}>
                
                <input id="d-date" type="date" value={details.date} onChange={(e) => setDetail('date', e.target.value)} className={inputClass} />
              </Field>
              {config.extraFields.map((f) =>
              <Field
                key={f.key}
                label={f.label}
                htmlFor={`d-${f.key}`}
                required={f.key === 'previousReligion'}
                error={f.key === 'previousReligion' ? detailErrors.previousReligion : undefined}>
                
                  <input
                  id={`d-${f.key}`}
                  value={details.extra[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setDetail('extra', { ...details.extra, [f.key]: e.target.value })}
                  className={inputClass} />
                
                </Field>
              )}
              <Field label="Parish" htmlFor="d-parish" required error={detailErrors.parishId} hint={isEntry ? 'Also becomes their home parish.' : undefined}>
                <select id="d-parish" value={details.parishId} onChange={(e) => setDetail('parishId', e.target.value)} className={inputClass}>
                  <option value="">Select parish…</option>
                  {parishes.map((p) =>
                  <option key={p.id} value={p.id}>{p.name}</option>
                  )}
                </select>
              </Field>
              <Field label={config.ministerLabel} htmlFor="d-minister" required error={detailErrors.minister}>
                <input id="d-minister" value={details.minister} placeholder="e.g. Fr. Charles Okello" onChange={(e) => setDetail('minister', e.target.value)} className={inputClass} />
              </Field>
              <Field label={sponsorsLabel} htmlFor="d-sponsors" className="sm:col-span-2">
                <input id="d-sponsors" value={details.sponsors} placeholder={config.sponsorsPlaceholder} onChange={(e) => setDetail('sponsors', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          {isMarriage &&
          <div className="border-t border-line pt-6">
              <SpouseLookup
              draft={spouse}
              onChange={setSpouse}
              error={spouseError}
              excludeId={personId}
              preferredGender={person?.gender === 'Female' ? 'Male' : person?.gender === 'Male' ? 'Female' : undefined}
              onViewPerson={viewPerson} />
            
            </div>
          }

          {warnings.length > 0 &&
          <div className="space-y-1.5 rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink" role="status">
              {warnings.map((w) =>
            <p key={w} className="flex gap-2">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {w}
                </p>
            )}
            </div>
          }

          <Field label="Notes" htmlFor="d-notes">
            <textarea id="d-notes" rows={2} value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} className={`${inputClass} resize-none`} />
          </Field>
        </form>
      </Modal>
      {peekLayer}
    </>);

}