import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NewPerson, NewRecord, Parish, Person, SacramentRecord } from '../types/records';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';
import {
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  fetchMatrimonies,
  fetchParishes,
} from '../api';
import {
  mapBaptism,
  mapCommunion,
  mapConfirmation,
  mapMatrimony,
  mapParish,
  mapPerson,
} from '../utils/apiMappers';

interface RecordsContextValue {
  parishes: Parish[];
  people: Person[];
  records: SacramentRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peopleRef = useRef<Person[]>([]);
  const recordsRef = useRef<SacramentRecord[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pa, ba, co, cf, ma] = await Promise.all([
        fetchParishes(),
        fetchBaptisms(),
        fetchCommunions(),
        fetchConfirmations(),
        fetchMatrimonies(),
      ]);
      const loadedPeople = ba.map(mapPerson);
      const loadedRecords = [
        ...ba.map(mapBaptism),
        ...co.map(mapCommunion),
        ...cf.map(mapConfirmation),
        ...ma.map(mapMatrimony),
      ];
      peopleRef.current = loadedPeople;
      recordsRef.current = loadedRecords;
      setParishes(pa.map(mapParish));
      setPeople(loadedPeople);
      setRecords(loadedRecords);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const getPerson = useCallback((id: string) => peopleRef.current.find((p) => p.id === id), []);

  const recordsFor = useCallback(
    (personId: string) => recordsRef.current.filter((r) => r.personId === personId || r.spouseId === personId),
    []
  );

  // NOTE: these two still save only in browser memory. We connect them to Django next.
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

  const value = useMemo(
    () => ({ parishes, people, records, loading, error, reload, getPerson, recordsFor, addPerson, addRecord }),
    [parishes, people, records, loading, error, reload, getPerson, recordsFor, addPerson, addRecord]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NewPerson, NewRecord, Parish, Person, SacramentRecord } from '../types/records';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';
import {
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  fetchMatrimonies,
  fetchParishes,
} from '../api';
import {
  mapBaptism,
  mapCommunion,
  mapConfirmation,
  mapMatrimony,
  mapParish,
  mapPerson,
} from '../utils/apiMappers';

interface RecordsContextValue {
  parishes: Parish[];
  people: Person[];
  records: SacramentRecord[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peopleRef = useRef<Person[]>([]);
  const recordsRef = useRef<SacramentRecord[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pa, ba, co, cf, ma] = await Promise.all([
        fetchParishes(),
        fetchBaptisms(),
        fetchCommunions(),
        fetchConfirmations(),
        fetchMatrimonies(),
      ]);
      const loadedPeople = ba.map(mapPerson);
      const loadedRecords = [
        ...ba.map(mapBaptism),
        ...co.map(mapCommunion),
        ...cf.map(mapConfirmation),
        ...ma.map(mapMatrimony),
      ];
      peopleRef.current = loadedPeople;
      recordsRef.current = loadedRecords;
      setParishes(pa.map(mapParish));
      setPeople(loadedPeople);
      setRecords(loadedRecords);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const getPerson = useCallback((id: string) => peopleRef.current.find((p) => p.id === id), []);

  const recordsFor = useCallback(
    (personId: string) => recordsRef.current.filter((r) => r.personId === personId || r.spouseId === personId),
    []
  );

  // NOTE: these two still save only in browser memory. We connect them to Django next.
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

  const value = useMemo(
    () => ({ parishes, people, records, loading, error, reload, getPerson, recordsFor, addPerson, addRecord }),
    [parishes, people, records, loading, error, reload, getPerson, recordsFor, addPerson, addRecord]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}