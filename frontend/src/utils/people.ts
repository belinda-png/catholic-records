import { NewPerson, Person, PersonDraft, PersonDraftErrors } from '../types/records';
import { todayISO } from './format';

export function searchPeople(people: Person[], query: string, limit = 5): Person[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.join('').length < 2) return [];
  return people
    .filter((p) => {
      const hay = `${p.fullName} ${p.regNo}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

export function emptyDraft(parishId = '', _unused?: unknown): PersonDraft {
  return {
    regNo: '', parishId, dateOfBaptism: '', christianName: '', surname: '',
    dob: '', fatherName: '', motherName: '', godparentName: '',
    village: '', minister: '', phone: '',
  };
}

export function draftFromPerson(p: Person): PersonDraft {
  const parts = p.fullName.trim().split(/\s+/);
  return {
    personId: p.id,
    regNo: p.regNo,
    parishId: p.parishId,
    dateOfBaptism: p.registeredOn,
    christianName: parts[0] ?? '',
    surname: parts.slice(1).join(' '),
    dob: p.dob,
    fatherName: p.fatherName,
    motherName: p.motherName,
    godparentName: p.godparentName ?? '',
    village: p.village,
    minister: '',
    phone: p.phone,
  };
}

export function draftToPerson(d: PersonDraft): NewPerson {
  return {
    fullName: `${d.christianName.trim()} ${d.surname.trim()}`.trim(),
    dob: d.dob,
    fatherName: d.fatherName.trim(),
    motherName: d.motherName.trim(),
    godparentName: d.godparentName.trim(),
    parishId: d.parishId,
    village: d.village.trim(),
    phone: d.phone.trim(),
    registeredOn: d.dateOfBaptism || todayISO(),
  };
}

export function validateDraft(d: PersonDraft): PersonDraftErrors {
  const errors: PersonDraftErrors = {};
  if (!d.parishId) errors.parishId = 'Choose the parish';
  if (!d.regNo.trim()) errors.regNo = 'Enter the registration number';
  if (!d.dateOfBaptism) errors.dateOfBaptism = 'Enter the date of baptism';
  if (!d.christianName.trim()) errors.christianName = 'Enter the Christian name';
  if (!d.surname.trim()) errors.surname = 'Enter the surname';
  return errors;
}

export function generateRegNo(existing: Person[]): string {
  let candidate = '';
  do {
    candidate = String(Math.floor(10000 + Math.random() * 90000));
  } while (existing.some((p) => p.regNo === candidate));
  return candidate;
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}