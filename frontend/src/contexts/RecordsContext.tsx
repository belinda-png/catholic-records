import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppDocument, NewPerson, NewRecord, Parish, Person, PersonDraft, SacramentRecord } from '../types/records'; // changed: AppDocument added
import {
  fetchBaptisms, fetchCommunions, fetchConfirmations, fetchMatrimonies, fetchParishes,
  postBaptism, postCommunion, postConfirmation, postMatrimony,
} from '../api';
import {
  mapBaptism, mapCommunion, mapConfirmation, mapMatrimony, mapParish, mapPerson,
} from '../utils/apiMappers';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';
import { setParishStore } from '../utils/parishStore';
importRows: (items: { draft?: PersonDraft; personId?: string; records: NewRecord[] }[]) => Promise<{ saved: number; failed: string[] }>;
interface RecordsContextValue {
  parishes: Parish[];
  people: Person[];
  records: SacramentRecord[];
  documents: AppDocument[]; // new
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  createBaptism: (draft: PersonDraft, notes?: string) => Promise<{ person: Person; record: SacramentRecord }>;
  createSacrament: (rec: NewRecord) => Promise<SacramentRecord>;
  // Still in-memory only (used by ImportModal)
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
  // Still in-memory only (used by DocumentsModal)
  addDocument: (d: Omit<AppDocument, 'id'>) => void; // new
  removeDocument: (id: string) => void; // new
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]); // new
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peopleRef = useRef<Person[]>([]);
  const recordsRef = useRef<SacramentRecord[]>([]);

  const load = useCallback(async () => {
    const [pa, ba, co, cf, ma] = await Promise.all([
      fetchParishes(), fetchBaptisms(), fetchCommunions(), fetchConfirmations(), fetchMatrimonies(),
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

  const createBaptism = useCallback(async (d: PersonDraft, notes = '') => {
    const created = await postBaptism({
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
    });
    await load();
    return { person: mapPerson(created), record: mapBaptism(created) };
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

  // In-memory only (ImportModal). Not saved to Django yet.
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

  // new: in-memory only (DocumentsModal). Lost on refresh.
  const addDocument = useCallback(
    (d: Omit<AppDocument, 'id'>) => setDocuments((prev) => [{ ...d, id: makeId('d') }, ...prev]),
    []
  );
  const removeDocument = useCallback(
    (id: string) => setDocuments((prev) => prev.filter((d) => d.id !== id)),
    []
  );
  const importRows = useCallback(async (items: { draft?: PersonDraft; personId?: string; records: NewRecord[] }[]) => {
  let saved = 0;
  const failed: string[] = [];
  for (const item of items) {
    try {
      if (item.draft) {
        const d = item.draft;
        await postBaptism({
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
          notes: '',
        });
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

  const value = useMemo(
    () => ({
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, addPerson, addRecord, addDocument, removeDocument,
    }),
    [
      parishes, people, records, documents, loading, error, reload, getPerson, recordsFor,
      createBaptism, createSacrament, addPerson, addRecord, addDocument, removeDocument,
    ]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}