import React, { FormEvent, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, CheckIcon, FileTextIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { CandidateType, PersonDraft, PersonDraftErrors, SacramentRecord, SacramentType, SpouseDraft } from '../types/records';
import { acceptAttr, documentExtensions, extensionOf, formatBytes } from '../utils/files';
import { formatDate } from '../utils/format';
import { emptyDraft } from '../utils/people';
import { checkEligibility, getSacrament, isEntryType, parishName, toneClass } from '../utils/sacraments';
import { inputClass, primaryButton, secondaryButton } from '../utils/styles';
import { BaptisedPersonPicker } from './BaptisedPersonPicker';
import { BaptismCandidateFields } from './BaptismCandidateFields';
import { Field } from './Field';
import { FileDropZone } from './FileDropZone';
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

const filled = (s?: string) => !!s && s.trim().length > 0;

export function SacramentFormModal({ type, initialPersonId, onClose }: SacramentFormModalProps) {
  const config = getSacrament(type);
  const isEntry = isEntryType(type);
  const isConversion = type === 'conversion';
  const isMarriage = type === 'matrimony';
  const isBaptism = type === 'baptism';
  const { people, getPerson, createBaptism, createSacrament, recordsFor, addDocument } = useRecords();
  const { selectedParishId, openProfile, openSacrament } = useUI();
  const defaultParish = selectedParishId === 'all' ? '' : selectedParishId;
  const emptyDetails: Details = { parishId: defaultParish, date: '', minister: '', sponsors: '', notes: '', extra: {} };

  const [candidateType, setCandidateType] = useState<CandidateType | undefined>(isConversion ? 'adult' : undefined);
  const [candidate, setCandidate] = useState<PersonDraft>(emptyDraft(defaultParish));
  const [personId, setPersonId] = useState<string | undefined>(() =>
  !isEntry && initialPersonId && checkEligibility(type, recordsFor(initialPersonId)).ok ? initialPersonId : undefined
  );
  const [spouse, setSpouse] = useState<SpouseDraft>(emptySpouse);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [candidateErrors, setCandidateErrors] = useState<PersonDraftErrors>({});
  const [personError, setPersonError] = useState<string>();
  const [spouseError, setSpouseError] = useState<string>();
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saved, setSaved] = useState<SacramentRecord | null>(null);
  const [peek, setPeek] = useState<string[]>([]);

  const viewPerson = (id: string) => setPeek([id]);

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
    setCandidateType(isConversion ? 'adult' : undefined);
    setPersonId(undefined);
    setSpouse(emptySpouse);
    setDetails(emptyDetails);
    setCertFiles([]);
    setCandidateErrors({});
    setPersonError(undefined);
    setSpouseError(undefined);
    setDetailErrors({});
    setSubmitError(undefined);
    setSaved(null);
    setStatus('idle');
  };
  const candidateName = `${candidate.christianName} ${candidate.surname}`.trim().toLowerCase();
  const alreadyBaptised = isEntry && candidateName.length > 2 && people.some(
    (p) => p.fullName.toLowerCase() === candidateName && p.dob === candidate.dob
  );
  const canSave =
  !!details.parishId && (
  isEntry ?
  (!isBaptism || !!candidateType) &&
  [
  candidate.regNo, candidate.dateOfBaptism, candidate.christianName, candidate.surname, candidate.dob,
  candidate.fatherName, candidate.motherName, candidate.godparentName, candidate.village, candidate.minister].
  every(filled) && (
  !isConversion || filled(details.extra.previousReligion)) :
  !!personId && !!details.date && (
  isMarriage ?
  filled(spouse.fullName) && filled(details.extra.marriageRegNo) :
  filled(details.minister)));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cErr: PersonDraftErrors = {};
    let pErr: string | undefined;
    if (isEntry) {
      if (alreadyBaptised) cErr.surname = 'This person is already baptised in the system. A person is baptised only once.';
      if (!candidate.regNo.trim()) cErr.regNo = 'Enter the registration number';
      if (!candidate.dateOfBaptism) cErr.dateOfBaptism = 'Enter the date of baptism';
      if (!candidate.christianName.trim()) cErr.christianName = 'Enter the Christian name';
      if (!candidate.surname.trim()) cErr.surname = 'Enter the surname';
      if (!candidate.dob) cErr.dob = 'Enter date of birth';
      if (!candidate.fatherName.trim()) cErr.fatherName = 'Enter the father’s name';
      if (!candidate.motherName.trim()) cErr.motherName = 'Enter the mother’s name';
      if (!candidate.godparentName.trim()) cErr.godparentName = 'Enter the god parent';
      if (!candidate.village.trim()) cErr.village = 'Enter the residence';
      if (!candidate.minister.trim()) cErr.minister = 'Enter the minister';
    } else if (!personId) {
      pErr = 'Select a baptised person from the register';
    } else {
  const el = checkEligibility(type, recordsFor(personId));
  if (!el.ok) pErr = el.reason;
}
    const sErr = isMarriage && !spouse.fullName.trim() ? "Enter the spouse's name" : undefined;
    const dErr: DetailErrors = {};
    if (!isEntry && !details.date) dErr.date = 'Enter the date';
    if (!isEntry && !isMarriage && !details.minister.trim()) dErr.minister = 'Enter the minister';
    if (isConversion && !details.extra.previousReligion?.trim()) dErr.previousReligion = 'Enter their previous religion';
    setCandidateErrors(cErr);
    setPersonError(pErr);
    setSpouseError(sErr);
    setDetailErrors(dErr);
    if (Object.keys(cErr).length || pErr || sErr || Object.keys(dErr).length) return;

    setStatus('saving');
    setSubmitError(undefined);
    (async () => {
      try {
        if (isEntry) {
          const { record } = await createBaptism(
            { ...candidate, parishId: details.parishId },
            details.notes.trim(),
            isConversion ? { previousReligion: details.extra.previousReligion.trim() } : undefined
          );
          setSaved(record);
        } else {
          let extra = details.extra;
          if (isMarriage) {
            extra = {
              ...extra,
              spouseName: spouse.fullName.trim(),
              spouseBaptisedAt: spouse.baptisedAt,
              spouseBaptisedOn: spouse.baptisedOn,
              spouseBaptismRegNo: spouse.baptismRegNo
            };
          }
          const record = await createSacrament({
            personId: personId as string,
            parishId: details.parishId,
            date: details.date,
            minister: details.minister.trim(),
            sponsors: details.sponsors.trim(),
            type,
            spouseId: isMarriage ? spouse.personId : undefined,
            notes: details.notes.trim(),
            extra
          });
          if (isMarriage && certFiles.length) {
            for (const f of certFiles) {
              await addDocument({ file: f, category: 'Marriage', personId: personId as string, parishId: details.parishId });
            }
          }
          setSaved(record);
        }
        setStatus('saved');
      } catch (err) {
        console.error(err);
        setSubmitError(err instanceof Error ? err.message : 'Could not save the record');
        setStatus('idle');
      }
    })();
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
    const main = getPerson(saved.personId);
    const other = saved.spouseId ? getPerson(saved.spouseId) : undefined;
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
          <p className="text-2xl font-semibold tracking-wide text-forest">{saved.certificateNo}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {main && <button type="button" onClick={() => openProfile(main.id)} className={secondaryButton}>View {main.fullName}</button>}
            {other && <button type="button" onClick={() => openProfile(other.id)} className={secondaryButton}>View {other.fullName}</button>}
          </div>
        </div>
      </Modal>);
  }

  const showNotes = !isBaptism || !!candidateType;

  return (
    <>
      <Modal
        title={`Record ${config.label}`}
        subtitle={isBaptism ? 'Baptism is how a person enters the register.' : config.description}
        icon={icon}
        onClose={onClose}
        footer={
        <>
            <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
            <button
            type="submit"
            form="sacrament-form"
            disabled={status === 'saving' || !canSave}
            className={`${primaryButton} disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300`}>
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

          {isConversion &&
          <fieldset className="border-t border-line pt-6">
              <legend className="mb-3 text-sm font-semibold text-forest">Reception & baptism</legend>
              {config.extraFields.
            filter((f) => f.key === 'previousReligion').
            map((f) =>
            <Field key={f.key} label={f.label} htmlFor={`d-${f.key}`} required error={detailErrors.previousReligion}>
                    <input
                id={`d-${f.key}`}
                value={details.extra[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setDetail('extra', { ...details.extra, [f.key]: e.target.value })}
                className={inputClass} />
                  </Field>
            )}
            </fieldset>
          }

          {!isEntry &&
          <div className="space-y-4 border-t border-line pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-forest">{config.label}</h3>

              {isMarriage ?
            <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date" htmlFor="d-date" required error={detailErrors.date}>
                    <input id="d-date" type="date" value={details.date} onChange={(e) => setDetail('date', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Reg. No." htmlFor="d-marriageRegNo" required>
                    <input id="d-marriageRegNo" value={details.extra.marriageRegNo ?? ''} onChange={(e) => setDetail('extra', { ...details.extra, marriageRegNo: e.target.value })} className={inputClass} />
                  </Field>
                </div> :

            <Field label="Date" htmlFor="d-date" required error={detailErrors.date}>
                  <input id="d-date" type="date" value={details.date} onChange={(e) => setDetail('date', e.target.value)} className={inputClass} />
                </Field>
            }

              <Field label="Parish" htmlFor="d-parish">
                <input id="d-parish" value={parishName(details.parishId)} readOnly className={`${inputClass} cursor-default opacity-80`} />
              </Field>

              {!isMarriage &&
            <Field label="Minister" htmlFor="d-minister" required error={detailErrors.minister}>
                  <input id="d-minister" value={details.minister} placeholder="e.g. Fr. Charles Okello" onChange={(e) => setDetail('minister', e.target.value)} className={inputClass} />
                </Field>
            }
            </div>
          }

          {isMarriage &&
          <div className="border-t border-line pt-6">
              <SpouseLookup
              draft={spouse}
              onChange={setSpouse}
              error={spouseError}
              excludeId={personId}
              onViewPerson={viewPerson} />
            </div>
          }

          {isMarriage &&
          <div className="space-y-3 border-t border-line pt-6">
              <h3 className="text-sm font-semibold text-forest">Marriage certificate</h3>
              <FileDropZone
              accept={acceptAttr(documentExtensions)}
              multiple
              title="Upload the marriage certificate"
              hint="PDF, Word or a scan (.jpg, .png) · saved with this person"
              onFiles={(files) => setCertFiles((prev) => [...prev, ...files.filter((f) => documentExtensions.includes(extensionOf(f.name)))])} />
              {certFiles.length > 0 &&
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {certFiles.map((f, i) =>
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <FileTextIcon className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-ink">{f.name}</span>
                      <span className="text-xs text-muted">{formatBytes(f.size)}</span>
                      <button type="button" onClick={() => setCertFiles((prev) => prev.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="text-muted hover:text-danger">
                        <XIcon className="h-4 w-4" />
                      </button>
                    </li>
              )}
                </ul>
            }
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

          {submitError &&
          <p className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-danger" role="alert">{submitError}</p>
          }

          {showNotes &&
          <Field label="Notes" htmlFor="d-notes">
              <textarea id="d-notes" rows={2} value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} className={`${inputClass} resize-none`} />
            </Field>
          }
        </form>
      </Modal>
      {peekLayer}
    </>);
}