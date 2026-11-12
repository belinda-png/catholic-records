import React, { FormEvent, useState } from 'react';
import { Loader2Icon, PencilIcon } from 'lucide-react';
import { PersonEdit, useRecords } from '../contexts/RecordsContext';
import { inputClass, primaryButton, secondaryButton } from '../utils/styles';
import { Field } from './Field';
import { Modal } from './Modal';

interface EditPersonModalProps {
  personId: string;
  onClose: () => void;
}

export function EditPersonModal({ personId, onClose }: EditPersonModalProps) {
  const { getPerson, updatePerson } = useRecords();
  const person = getPerson(personId);

  const [form, setForm] = useState<PersonEdit>(() => ({
    regNo: person?.regNo ?? '',
    dateOfBaptism: person?.registeredOn ?? '',
    christianName: person?.christianName ?? '',
    surname: person?.surname ?? '',
    dob: person?.dob ?? '',
    fatherName: person?.fatherName ?? '',
    motherName: person?.motherName ?? '',
    godparentName: person?.godparentName ?? '',
    village: person?.village ?? '',
    phone: person?.phone ?? ''
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const set = <K extends keyof PersonEdit,>(key: K, value: PersonEdit[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.regNo.trim() || !form.christianName.trim() || !form.surname.trim() || !form.dateOfBaptism) {
      setError('Reg No, date of baptism, Christian name and surname are required.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await updatePerson(personId, form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the changes.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit person"
      subtitle="Correct a mistake in the baptism register."
      icon={
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage text-sage-ink">
          <PencilIcon className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
      footer={
      <>
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="submit" form="edit-person-form" disabled={saving} className={primaryButton}>
            {saving && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }>
      <form id="edit-person-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reg No" htmlFor="e-reg" required>
            <input id="e-reg" value={form.regNo} onChange={(e) => set('regNo', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date of baptism" htmlFor="e-date" required>
            <input id="e-date" type="date" value={form.dateOfBaptism} onChange={(e) => set('dateOfBaptism', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Christian name" htmlFor="e-christian" required>
            <input id="e-christian" value={form.christianName} onChange={(e) => set('christianName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Surname" htmlFor="e-surname" required>
            <input id="e-surname" value={form.surname} onChange={(e) => set('surname', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date of birth" htmlFor="e-dob">
            <input id="e-dob" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="e-phone">
            <input id="e-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Father" htmlFor="e-father">
            <input id="e-father" value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Mother" htmlFor="e-mother">
            <input id="e-mother" value={form.motherName} onChange={(e) => set('motherName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Godparent" htmlFor="e-godparent">
            <input id="e-godparent" value={form.godparentName} onChange={(e) => set('godparentName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Residence" htmlFor="e-residence">
            <input id="e-residence" value={form.village} onChange={(e) => set('village', e.target.value)} className={inputClass} />
          </Field>
        </div>
        {error && <p className="rounded-xl bg-amber-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      </form>
    </Modal>);

}