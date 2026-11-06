import { Parish, Person, SacramentRecord } from '../types/records';

export const mapParish = (p: any): Parish => ({
  id: String(p.id),
  name: p.name,
  deanery: p.location || p.archdiocese || '',
});

// A baptism record IS the person.
export const mapPerson = (b: any): Person => ({
  id: String(b.id),
  regNo: b.registration_number,
  fullName: `${b.christian_name} ${b.surname}`.trim(),
//   gender: 'Male',
  motherName: b.mother_name ?? '',
  parishId: String(b.home_parish ?? b.parish),
  village: b.residence ?? '',
  phone: b.phone_number ?? '',
  registeredOn: b.date_of_baptism ?? '',
});

export const mapBaptism = (b: any): SacramentRecord => ({
  id: `baptism-${b.id}`,
  type: 'baptism',
  personId: String(b.id),
  parishId: String(b.parish),
  date: b.date_of_baptism ?? '',
  minister: b.minister ?? '',
  sponsors: b.godparent_name ?? '',
  notes: b.notes ?? '',
  certificateNo: b.registration_number,
  extra: { place: b.parish_name ?? '' },
});

export const mapCommunion = (r: any): SacramentRecord => ({
  id: `communion-${r.id}`,
  type: 'communion',
  personId: String(r.baptism),
  parishId: String(r.parish),
  date: r.date_received,
  minister: r.minister ?? '',
  sponsors: '',
  notes: '',
  certificateNo: r.registration_number ?? '',
  extra: { class: '' },
});

export const mapConfirmation = (r: any): SacramentRecord => ({
  id: `confirmation-${r.id}`,
  type: 'confirmation',
  personId: String(r.baptism),
  parishId: String(r.parish),
  date: r.date_received,
  minister: r.minister ?? '',
  sponsors: '',
  notes: '',
  certificateNo: r.registration_number ?? '',
  extra: { confirmationName: '' },
});

export const mapMatrimony = (r: any): SacramentRecord => ({
  id: `matrimony-${r.id}`,
  type: 'matrimony',
  personId: String(r.baptism),
  spouseId: r.spouse_baptism ? String(r.spouse_baptism) : undefined,
  parishId: String(r.parish),
  date: r.date_of_marriage,
  minister: '',
  sponsors: '',
  notes: r.notes ?? '',
  certificateNo: r.registration_number ?? '',
  extra: { marriageRegNo: r.registration_number ?? '', spouseName: r.spouse_name ?? '' },
});