import { Gender, NewPerson, Person, PersonDraft, PersonDraftErrors } from '../types/records';
import { todayISO } from './format';

export function searchPeople(people: Person[], query: string, limit = 5): Person[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return people.
  filter((p) => p.fullName.toLowerCase().includes(q) || p.regNo.startsWith(q)).
  slice(0, limit);
}

export function emptyDraft(parishId = '', gender: Gender | '' = ''): PersonDraft {
  return { fullName: '', regNo: '', gender, dob: '', fatherName: '', motherName: '', parishId, village: '', phone: '' };
}

export function draftFromPerson(p: Person): PersonDraft {
  return {
    personId: p.id,
    fullName: p.fullName,
    regNo: p.regNo,
    gender: p.gender,
    dob: p.dob,
    fatherName: p.fatherName,
    motherName: p.motherName,
    parishId: p.parishId,
    village: p.village,
    phone: p.phone
  };
}

export function draftToPerson(d: PersonDraft): NewPerson {
  return {
    fullName: d.fullName.trim(),
    gender: (d.gender || 'Male') as Gender,
    dob: d.dob,
    fatherName: d.fatherName.trim(),
    motherName: d.motherName.trim(),
    parishId: d.parishId,
    village: d.village.trim(),
    phone: d.phone.trim(),
    registeredOn: todayISO()
  };
}

export function validateDraft(d: PersonDraft): PersonDraftErrors {
  const errors: PersonDraftErrors = {};
  if (!d.fullName.trim()) errors.fullName = 'Enter the full name';
  if (d.personId) return errors;
  if (!d.gender) errors.gender = 'Select gender';
  if (!d.dob) errors.dob = 'Enter date of birth';
  if (!d.parishId) errors.parishId = 'Choose home parish';
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