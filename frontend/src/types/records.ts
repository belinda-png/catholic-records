export type SacramentType = 'baptism' | 'conversion' | 'communion' | 'confirmation' | 'matrimony';
export type Gender = 'Male' | 'Female';
export type AppView = 'dashboard' | 'people' | 'records';
export type CandidateType = 'child' | 'adult';

export interface Parish {
  id: string;
  name: string;
  deanery: string;
}

export interface Person {
  id: string;
  regNo: string;
  fullName: string;
  gender?: Gender;
  dob: string;
  fatherName: string;
  motherName: string;
  godparentName?: string;
  parishId: string;
  village: string;
  phone: string;
  registeredOn: string;
}

export interface SacramentRecord {
  id: string;
  type: SacramentType;
  personId: string;
  /** Matrimony only: the bride (personId is the groom). */
  spouseId?: string;
  parishId: string;
  date: string;
  minister: string;
  sponsors: string;
  notes: string;
  certificateNo: string;
  extra: Record<string, string>;
}

export type NewPerson = Omit<Person, 'id' | 'regNo'>;
export type NewRecord = Omit<SacramentRecord, 'id' | 'certificateNo'>;

export interface PersonDraft {
  personId?: string;
  regNo: string;
  gender?: Gender | '';
  parishId: string;
  dateOfBaptism: string;
  christianName: string;
  surname: string;
  dob: string;
  fatherName: string;
  motherName: string;
  godparentName: string;
  village: string; // Residence
  minister: string;
  phone: string;
}

export interface SpouseDraft {
  personId?: string;
  fullName: string;
  baptisedAt: string;
  baptisedOn: string;
  baptismRegNo: string;
}

export type PersonDraftErrors = Partial<Record<keyof PersonDraft, string>>;

export interface AppDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: string;
  personId?: string;
  parishId: string;
  uploadedOn: string;
  url: string;
}

export interface SacramentConfig {
  type: SacramentType;
  label: string;
  plural: string;
  short: string;
  description: string;
  ministerLabel: string;
  sponsorsLabel: string;
  sponsorsPlaceholder: string;
  tone: 'gold' | 'sage';
  extraFields: {key: string;label: string;placeholder: string;}[];
}