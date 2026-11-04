import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { people as seedPeople } from '../data/people';
import { records as seedRecords } from '../data/records';
import { NewPerson, NewRecord, Person, SacramentRecord } from '../types/records';
import { generateRegNo, makeId } from '../utils/people';
import { getSacrament } from '../utils/sacraments';

interface RecordsContextValue {
  people: Person[];
  records: SacramentRecord[];
  getPerson: (id: string) => Person | undefined;
  recordsFor: (personId: string) => SacramentRecord[];
  addPerson: (input: NewPerson) => Person;
  addRecord: (input: NewRecord) => SacramentRecord;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: {children: ReactNode;}) {
  const [people, setPeople] = useState<Person[]>(seedPeople);
  const [records, setRecords] = useState<SacramentRecord[]>(seedRecords);
  const peopleRef = useRef(people);
  const recordsRef = useRef(records);

  const getPerson = useCallback((id: string) => peopleRef.current.find((p) => p.id === id), []);

  const recordsFor = useCallback(
    (personId: string) => recordsRef.current.filter((r) => r.personId === personId || r.spouseId === personId),
    []
  );

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
      certificateNo: `${prefix}/${year}/${String(seq).padStart(4, '0')}`
    };
    recordsRef.current = [record, ...recordsRef.current];
    setRecords(recordsRef.current);
    return record;
  }, []);

  const value = useMemo(
    () => ({ people, records, getPerson, recordsFor, addPerson, addRecord }),
    [people, records, getPerson, recordsFor, addPerson, addRecord]
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider');
  return ctx;
}