export type SacramentType = 'baptism' | 'communion' | 'confirmation' | 'matrimony';
export type Gender = 'Male' | 'Female';
export type AppView = 'dashboard' | 'people' | 'records';
export type CandidateType = 'child' | 'adult'; // new

export interface Parish {
  id: string;
  name: string;
  deanery: string;
}

export interface Person {
  id: string;
  regNo: string;
  fullName: string;
  gender?: Gender;          // changed: optional
  dob: string;
  fatherName: string;
  motherName: string;
  godparentName?: string;   // new
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
  gender?: Gender | '';     // changed: optional, so the untouched Gender dropdown still compiles
  parishId: string;
  dateOfBaptism: string;    // new
  christianName: string;    // new (replaces fullName)
  surname: string;          // new
  dob: string;
  fatherName: string;
  motherName: string;
  godparentName: string;    // new
  village: string;          // Residence
  minister: string;         // new
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

// new: used by DocumentsModal
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