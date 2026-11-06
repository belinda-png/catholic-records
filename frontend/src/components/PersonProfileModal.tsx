import React, { ReactNode } from 'react';
import { ArrowLeftIcon, FileTextIcon, PlusIcon, UserIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { sacraments } from '../data/sacraments';
import { SacramentRecord, SacramentType } from '../types/records';
import { ageFrom, formatDate, initials } from '../utils/format';
import { checkEligibility, parishName, spouseIdOf, toneClass } from '../utils/sacraments';
import { Modal } from './Modal';
import { SacramentIcon } from './SacramentIcon';

interface PersonProfileModalProps {
  stack: string[];
  onClose: () => void;
  onOpenPerson: (personId: string) => void;
  onBack: () => void;
  onRecord?: (type: SacramentType, personId: string) => void;
}

const linkClass = 'font-semibold text-forest underline decoration-gold/60 underline-offset-4 transition-colors duration-150 hover:text-gold';

export function PersonProfileModal({ stack, onClose, onOpenPerson, onBack, onRecord }: PersonProfileModalProps) {
  const { getPerson, recordsFor, documents } = useRecords();
  const personId = stack[stack.length - 1];
  const person = getPerson(personId);
  const previous = stack.length > 1 ? getPerson(stack[stack.length - 2]) : undefined;

  const back = previous ?
  <button
    type="button"
    onClick={onBack}
    aria-label={`Back to ${previous.fullName}`}
    title={`Back to ${previous.fullName}`}
    className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-cream hover:text-ink">
    
      <ArrowLeftIcon className="h-5 w-5" />
    </button> :
  undefined;

  if (!person) {
    return (
      <Modal title="Person not found" onClose={onClose} size="md">
        <p className="text-sm text-muted">This record may have been removed.</p>
      </Modal>);

  }

  const recs = recordsFor(person.id);
  const personDocs = documents.filter((d) => d.personId === person.id);
  const age = person.dob ? ageFrom(person.dob) : null;
  const details = [
  { label: 'Registration no.', value: person.regNo },
  { label: 'Date of birth', value: `${formatDate(person.dob)}${age !== null ? ` · ${age} yrs` : ''}` },
  { label: 'Gender', value: person.gender },
  { label: 'Home parish', value: parishName(person.parishId) },
  { label: "Father's name", value: person.fatherName || '—' },
  { label: "Mother's name", value: person.motherName || '—' },
  { label: 'Village / address', value: person.village || '—' },
  { label: 'Phone', value: person.phone || '—' }];


  const renderMarriage = (r: SacramentRecord) => {
    const spouseId = spouseIdOf(r, person.id);
    const spouse = spouseId ? getPerson(spouseId) : undefined;
    const spouseBaptism = spouse ? recordsFor(spouse.id).find((x) => x.type === 'baptism') : undefined;
    const storedForSpouse = r.personId === person.id;
    const baptisedAt = spouseBaptism ? parishName(spouseBaptism.parishId) : storedForSpouse ? r.extra.spouseBaptisedAt : '';
    const baptisedOn = spouseBaptism ? spouseBaptism.date : storedForSpouse ? r.extra.spouseBaptisedOn : '';
    const baptismReg = spouseBaptism ? spouseBaptism.certificateNo : storedForSpouse ? r.extra.spouseBaptismRegNo : '';

    const rows: {label: string;value: ReactNode;}[] = [
    { label: 'Date', value: formatDate(r.date) },
    { label: 'Reg. No.', value: r.extra.marriageRegNo || r.certificateNo },
    { label: 'Parish', value: parishName(r.parishId) },
    {
      label: 'Spouse',
      value: spouse ?
      <button type="button" onClick={() => onOpenPerson(spouse.id)} className={linkClass}>
            {spouse.fullName}
          </button> :
      r.extra.spouseName ?
      <span>
            {r.extra.spouseName} <span className="text-muted">(baptised outside this register)</span>
          </span> :

      '—'

    },
    {
      label: 'Spouse Reg. No.',
      value: spouse ?
      <button type="button" onClick={() => onOpenPerson(spouse.id)} className={linkClass}>
            {spouse.regNo}
          </button> :

      '—'

    },
    { label: 'Baptised at', value: baptisedAt || '—' },
    { label: 'On', value: baptisedOn ? formatDate(baptisedOn) : '—' },
    { label: 'Baptism Reg. No.', value: baptismReg || '—' },
    { label: 'Minister', value: r.minister },
    { label: 'Witnesses', value: r.sponsors || '—' }];


    return (
      <dl key={r.id} className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-cream/80 p-3.5 text-xs">
        {rows.map((row) =>
        <React.Fragment key={row.label}>
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-ink">{row.value}</dd>
          </React.Fragment>
        )}
      </dl>);

  };

  return (
    <Modal
      title={person.fullName}
      subtitle={`Reg. No ${person.regNo} · Registered ${formatDate(person.registeredOn)}`}
      leading={back}
      icon={
      <span className="grid h-10 w-10 place-items-center rounded-full bg-sage text-sm font-semibold text-sage-ink">
          {initials(person.fullName) || <UserIcon className="h-5 w-5" />}
        </span>
      }
      onClose={onClose}>
      
      <div key={person.id} className="grid gap-8 md:grid-cols-[1fr_1.15fr]">
        <section aria-labelledby="profile-details">
          <h3 id="profile-details" className="mb-3 text-sm font-semibold text-forest">Personal details</h3>
          <dl className="divide-y divide-line rounded-xl border border-line">
            {details.map((d) =>
            <div key={d.label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-muted">{d.label}</dt>
                <dd className="text-right font-medium text-ink">{d.value}</dd>
              </div>
            )}
          </dl>
          {personDocs.length > 0 &&
          <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-forest">Documents</h3>
              <ul className="space-y-1.5">
                {personDocs.map((d) =>
              <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-cream">
                      <FileTextIcon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-ink">{d.name}</span>
                      <span className="shrink-0 text-xs text-muted">{d.category}</span>
                    </a>
                  </li>
              )}
              </ul>
            </div>
          }
        </section>

        <section aria-labelledby="profile-history">
          <h3 id="profile-history" className="mb-3 text-sm font-semibold text-forest">Sacramental history</h3>
          <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-line">
            {sacraments.filter((s) => s.type !== 'conversion' || recs.some((r) => r.type === 'conversion')).map((s) => {
              const matching = recs.filter((r) => r.type === s.type);
              return (
                <li key={s.type} className="relative flex gap-3">
                  <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-paper ${matching.length ? toneClass(s.type) : 'bg-cream text-muted/60'}`}>
                    <SacramentIcon type={s.type} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <p className="text-sm font-semibold text-ink">{s.label}</p>
                    {matching.length === 0 ?
                    !checkEligibility(s.type, recs).ok ?
                    <p className="text-xs text-muted">Not recorded · {checkEligibility(s.type, recs).reason}</p> :
                    onRecord ?
                    <button
                      type="button"
                      onClick={() => onRecord(s.type, person.id)}
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-gold transition-colors duration-150 hover:text-forest">
                      
                          <PlusIcon className="h-3.5 w-3.5" /> Not recorded — add record
                        </button> :

                    <p className="text-xs text-muted">Not recorded</p> :

                    s.type === 'matrimony' ?
                    matching.map(renderMarriage) :

                    matching.map((r) =>
                    <div key={r.id} className="mt-1 space-y-0.5 text-xs text-muted">
                          <p>{formatDate(r.date)} · {parishName(r.parishId)}</p>
                          <p>
                            {s.ministerLabel}: {r.minister}
                            {r.sponsors ? ` · ${s.sponsorsLabel}: ${r.sponsors}` : ''}
                          </p>
                          {r.extra.candidateType &&
                      <p>{r.extra.candidateType === 'adult' ? 'Adult baptism' : 'Child baptism'}{r.extra.conversion === 'yes' ? ' · on reception into the Church' : ''}</p>
                      }
                          {s.extraFields.filter((f) => r.extra[f.key]).map((f) =>
                      <p key={f.key}>{f.label}: {r.extra[f.key]}</p>
                      )}
                          <p className="font-medium text-ink/70">Reg. No. {r.certificateNo}</p>
                        </div>
                    )
                    }
                  </div>
                </li>);

            })}
          </ol>
        </section>
      </div>
    </Modal>);

}