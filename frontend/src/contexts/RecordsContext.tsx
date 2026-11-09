import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppDocument, NewPerson, NewRecord, Parish, Person, PersonDraft, SacramentRecord } from '../types/records';
import {
  fetchBaptisms, fetchCommunions, fetchConfirmations, fetchMatrimonies, fetchParishes, fetchDocuments,
  postBaptism, postCommunion, postConfirmation, postMatrimony,
  uploadDocument, deleteDocument,
} from '../api';
import {
  mapBaptism, mapCommunion, mapConfirmation, mapMatrimony, mapParish, mapPerson,
  mapDocument, categoryCode,
} from '../utils/apiMappers';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';
import { setParishStore } from '../utils/parishStore';

type ImportItem = { draft?: PersonDraft; personId?: string; records: NewRecord[] };

interface RecordsContextValue {
  parishes: Parish[];
  people: Person[];
  records: SacramentRecord[];
  documents: AppDocument[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  createBaptism: (draft: PersonDraft, notes?: string) => Promise<{ person: Person; record: SacramentRecord }>;
  createSacrament: (rec: NewRecord) => Promise<SacramentRecord>;
  importRows: (items: ImportItem[]) => Promise<{ saved: number; failed: string[] }>;
  // In-memory only (kept for any old callers)
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
  // Saved in Django
  addDocument: (d: { file: File; category: string; personId?: string }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

const baptismBody = (d: PersonDraft, notes = '', convert?: { previousReligion: string }) => ({
  registration_number: d.regNo.trim(),
  parish: Number(d.parishId),
  home_parish: Number(d.parishId),
  christian_name: d.christianName.trim(),
  surname: d.surname.trim(),
  date_of_birth: d.dob || null,
  date_of_baptism: d.dateOfBaptism,
  father_name: d.fatherName.trim(),
  mother_name: d.motherName.trim(),
  godparent_name: d.godparentName.trim(),
  residence: d.village.trim(),
  phone_number: d.phone.trim(),
  minister: d.minister.trim(),
  notes,
  is_conversion: !!convert,
  previous_religion: convert?.previousReligion ?? '',
});

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peopleRef = useRef<Person[]>([]);
  const recordsRef = useRef<SacramentRecord[]>([]);

  const load = useCallback(async () => {
    const [pa, ba, co, cf, ma, dc] = await Promise.all([
      fetchParishes(), fetchBaptisms(), fetchCommunions(), fetchConfirmations(), fetchMatrimonies(), fetchDocuments(),
    ]);
    const loadedParishes = pa.map(mapParish);
    const loadedPeople = ba.map(mapPerson);
    const loadedRecords = [
      ...ba.map(mapBaptism), ...co.map(mapCommunion),
      ...cf.map(mapConfirmation), ...ma.map(mapMatrimony),
    ];
    setParishStore(loadedParishes);
    peopleRef.current = loadedPeople;
    recordsRef.current = loadedRecords;
    setParishes(loadedParishes);
    setPeople(loadedPeople);
    setRecords(loadedRecords);
    setDocuments(dc.map((d) => mapDocument(d, loadedPeople)));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { reload(); }, [reload]);import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppDocument, NewPerson, NewRecord, Parish, Person, PersonDraft, SacramentRecord } from '../types/records';
import {
  fetchBaptisms, fetchCommunions, fetchConfirmations, fetchMatrimonies, fetchParishes, fetchDocuments,
  postBaptism, postCommunion, postConfirmation, postMatrimony,
  uploadDocument, deleteDocument,
} from '../api';
import {
  mapBaptism, mapConversion, mapCommunion, mapConfirmation, mapMatrimony, mapParish, mapPerson,
  mapDocument, categoryCode,
} from '../utils/apiMappers';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';
import { setParishStore } from '../utils/parishStore';

type ImportItem = { draft?: PersonDraft; personId?: string; records: NewRecord[] };
type Convert = { previousReligion: string };

interface RecordsContextValue {
  parishes: Parish[];
  people: Person[];
  records: SacramentRecord[];
  documents: AppDocument[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  createBaptism: (draft: PersonDraft, notes?: string, convert?: Convert) => Promise<{ person: Person; record: SacramentRecord }>;
  createSacrament: (rec: NewRecord) => Promise<SacramentRecord>;
  importRows: (items: ImportItem[]) => Promise<{ saved: number; failed: string[] }>;
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
  addDocument: (d: { file: File; category: string; personId?: string }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

const baptismBody = (d: PersonDraft, notes = '', convert?: Convert) => ({
  registration_number: d.regNo.trim(),
  parish: Number(d.parishId),
  home_parish: Number(d.parishId),
  christian_name: d.christianName.trim(),
  surname: d.surname.trim(),
  date_of_birth: d.dob || null,
  date_of_baptism: d.dateOfBaptism,
  father_name: d.fatherName.trim(),
  mother_name: d.motherName.trim(),
  godparent_name: d.godparentName.trim(),
  residence: d.village.trim(),
  phone_number: d.phone.trim(),
  minister: d.minister.trim(),
  notes,
  is_conversion: !!convert,
  previous_religion: convert?.previousReligion ?? '',
});

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peopleRef = useRef<Person[]>([]);
  const recordsRef = useRef<SacramentRecord[]>([]);

  const load = useCallback(async () => {
    const [pa, ba, co, cf, ma, dc] = await Promise.all([
      fetchParishes(), fetchBaptisms(), fetchCommunions(), fetchConfirmations(), fetchMatrimonies(), fetchDocuments(),
    ]);
    const loadedParishes = pa.map(mapParish);
    const loadedPeople = ba.map(mapPerson);
    const loadedRecords = [
      ...ba.map(mapBaptism),
      ...ba.filter((b) => b.is_conversion).map(mapConversion),
      ...co.map(mapCommunion),
      ...cf.map(mapConfirmation),
      ...ma.map(mapMatrimony),
    ];
    setParishStore(loadedParishes);
    peopleRef.current = loadedPeople;
    recordsRef.current = loadedRecords;
    setParishes(loadedParishes);
    setPeople(loadedPeople);
    setRecords(loadedRecords);
    setDocuments(dc.map((d) => mapDocument(d, loadedPeople)));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { reload(); }, [reload]);

  const getPerson = useCallback((id: string) => peopleRef.current.find((p) => p.id === id), []);

  const recordsFor = useCallback(
    (personId: string) => recordsRef.current.filter((r) => r.personId === personId || r.spouseId === personId),
    []
  );

  const createBaptism = useCallback(async (d: PersonDraft, notes = '', convert?: Convert) => {
    const created = await postBaptism(baptismBody(d, notes, convert));
    await load();
    return {
      person: mapPerson(created),
      record: convert ? mapConversion(created) : mapBaptism(created),
    };
  }, [load]);

  const createSacrament = useCallback(async (rec: NewRecord) => {
    let created: any;
    let mapped: SacramentRecord;
    if (rec.type === 'communion') {
      created = await postCommunion({
        baptism: Number(rec.personId), parish: Number(rec.parishId),
        date_received: rec.date, minister: rec.minister,
      });
      mapped = mapCommunion(created);
    } else if (rec.type === 'confirmation') {
      created = await postConfirmation({
        baptism: Number(rec.personId), parish: Number(rec.parishId),
        date_received: rec.date, minister: rec.minister,
      });
      mapped = mapConfirmation(created);
    } else if (rec.type === 'matrimony') {
      created = await postMatrimony({
        baptism: Number(rec.personId),
        spouse_baptism: rec.spouseId ? Number(rec.spouseId) : null,
        spouse_name: rec.extra.spouseName ?? '',
        spouse_baptism_registration_number: rec.extra.spouseBaptismRegNo ?? '',
        parish: Number(rec.parishId),
        date_of_marriage: rec.date,
        notes: rec.notes,
      });
      mapped = mapMatrimony(created);
    } else {
      throw new Error(`Saving ${rec.type} records is not supported yet`);
    }
    await load();
    return mapped;
  }, [load]);

  const importRows = useCallback(async (items: ImportItem[]) => {
    let saved = 0;
    const failed: string[] = [];
    for (const item of items) {
      try {
        if (item.draft) {
          await postBaptism(baptismBody(item.draft));
        } else {
          for (const rec of item.records) {
            const base = { baptism: Number(item.personId), parish: Number(rec.parishId), minister: rec.minister };
            if (rec.type === 'communion') await postCommunion({ ...base, date_received: rec.date });
            else if (rec.type === 'confirmation') await postConfirmation({ ...base, date_received: rec.date });
            else if (rec.type === 'matrimony') {
              await postMatrimony({ ...base, date_of_marriage: rec.date, spouse_name: rec.extra.spouseName ?? '' });
            }
          }
        }
        saved++;
      } catch (e) {
        failed.push(e instanceof Error ? e.message : 'Unknown error');
      }
    }
    await load();
    return { saved, failed };
  }, [load]);

  const addPerson = useCallback((input: NewPerson) => {
    const person: Person = { ...input, id: makeId('p'), regNo: generateRegNo(peopleRef.current) };
    peopleRef.current = [person, ...peopleRef.current];
    setPeople(peopleRef.current);
    return person;
  }, []);

  const addRecord = useCallback((input: NewRecord) => {
    const prefix = getSacrament(input.type).short;
    const year = input.date.slice(0, 4);
    const seq = recordsRef.current.filter((r) => r.type === input.type).length + 1;
    const record: SacramentRecord = {
      ...input,
      id: makeId('r'),
      certificateNo: `${prefix}/${year}/${String(seq).padStart(4, '0')}`,
    };
    recordsRef.current = [record, ...recordsRef.current];
    setRecords(recordsRef.current);
    return record;
  }, []);

  const addDocument = useCallback(async (d: { file: File; category: string; personId?: string }) => {
    await uploadDocument(d.file, categoryCode(d.category), d.personId ? Number(d.personId) : undefined);
    await load();
  }, [load]);

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocument(id);
    await load();
  }, [load]);

  const value = useMemo(
    () => ({
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, importRows, addPerson, addRecord, addDocument, removeDocument,
    }),
    [
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, importRows, addPerson, addRecord, addDocument, removeDocument,
    ]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}

  const getPerson = useCallback((id: string) => peopleRef.current.find((p) => p.id === id), []);

  const recordsFor = useCallback(
    (personId: string) => recordsRef.current.filter((r) => r.personId === personId || r.spouseId === personId),
    []
  );

 const createBaptism = useCallback(async (d: PersonDraft, notes = '', convert?: { previousReligion: string }) => {
  const created = await postBaptism(baptismBody(d, notes, convert));
  await load();
  return { person: mapPerson(created), record: mapBaptism(created) };
}, [load]);
const loadedRecords = [
  ...ba.map(mapBaptism),
  ...ba.filter((b) => b.is_conversion).map(mapConversion),
  ...co.map(mapCommunion), ...cf.map(mapConfirmation), ...ma.map(mapMatrimony),
];
  const createSacrament = useCallback(async (rec: NewRecord) => {
    let created: any;
    let mapped: SacramentRecord;
    if (rec.type === 'communion') {
      created = await postCommunion({
        baptism: Number(rec.personId), parish: Number(rec.parishId),
        date_received: rec.date, minister: rec.minister,
      });
      mapped = mapCommunion(created);
    } else if (rec.type === 'confirmation') {
      created = await postConfirmation({
        baptism: Number(rec.personId), parish: Number(rec.parishId),
        date_received: rec.date, minister: rec.minister,
      });
      mapped = mapConfirmation(created);
    } else if (rec.type === 'matrimony') {
      created = await postMatrimony({
        baptism: Number(rec.personId),
        spouse_baptism: rec.spouseId ? Number(rec.spouseId) : null,
        spouse_name: rec.extra.spouseName ?? '',
        spouse_baptism_registration_number: rec.extra.spouseBaptismRegNo ?? '',
        parish: Number(rec.parishId),
        date_of_marriage: rec.date,
        notes: rec.notes,
      });
      mapped = mapMatrimony(created);
    } else {
      throw new Error(`Saving ${rec.type} records is not supported yet`);
    }
    await load();
    return mapped;
  }, [load]);

  const importRows = useCallback(async (items: ImportItem[]) => {
    let saved = 0;
    const failed: string[] = [];
    for (const item of items) {
      try {
        if (item.draft) {
          await postBaptism(baptismBody(item.draft));
        } else {
          for (const rec of item.records) {
            const base = { baptism: Number(item.personId), parish: Number(rec.parishId), minister: rec.minister };
            if (rec.type === 'communion') await postCommunion({ ...base, date_received: rec.date });
            else if (rec.type === 'confirmation') await postConfirmation({ ...base, date_received: rec.date });
            else if (rec.type === 'matrimony') {
              await postMatrimony({ ...base, date_of_marriage: rec.date, spouse_name: rec.extra.spouseName ?? '' });
            }
          }
        }
        saved++;
      } catch (e) {
        failed.push(e instanceof Error ? e.message : 'Unknown error');
      }
    }
    await load();
    return { saved, failed };
  }, [load]);

  const addPerson = useCallback((input: NewPerson) => {
    const person: Person = { ...input, id: makeId('p'), regNo: generateRegNo(peopleRef.current) };
    peopleRef.current = [person, ...peopleRef.current];
    setPeople(peopleRef.current);
    return person;
  }, []);

  const addRecord = useCallback((input: NewRecord) => {
    const prefix = getSacrament(input.type).short;
    const year = input.date.slice(0, 4);
    const seq = recordsRef.current.filter((r) => r.type === input.type).length + 1;
    const record: SacramentRecord = {
      ...input,
      id: makeId('r'),
      certificateNo: `${prefix}/${year}/${String(seq).padStart(4, '0')}`,
    };
    recordsRef.current = [record, ...recordsRef.current];
    setRecords(recordsRef.current);
    return record;
  }, []);

  const addDocument = useCallback(async (d: { file: File; category: string; personId?: string }) => {
    await uploadDocument(d.file, categoryCode(d.category), d.personId ? Number(d.personId) : undefined);
    await load();
  }, [load]);

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocument(id);
    await load();
  }, [load]);

  const value = useMemo(
    () => ({
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, importRows, addPerson, addRecord, addDocument, removeDocument,
    }),
    [
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, importRows, addPerson, addRecord, addDocument, removeDocument,
    ]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}