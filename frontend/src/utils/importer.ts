import {
  NewRecord,
  Person,
  PersonDraft,
  SacramentRecord,
  SacramentType,
} from '../types/records';

import { importColumns } from '../data/importColumns';
import { checkEligibility, isEntryType, parishName } from './sacraments';
import { getParishStore } from './parishStore';

export interface ImportRow {
  line: number;
  ok: boolean;
  name: string;
  detail: string;
  message: string;
  payload?: {
    person?: PersonDraft;
    draft?: PersonDraft;
    convert?: { previousReligion: string };
    personId?: string;
    records: NewRecord[];
  };
}

type Raw = Record<string, string>;

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

export function fileKind(name: string): 'excel' | 'access' | 'invalid' {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();

  if (ext === 'xls' || ext === 'xlsx') return 'excel';
  if (ext === 'mdb' || ext === 'accdb') return 'access';

  return 'invalid';
}

const pad = (n: number) => String(n).padStart(2, '0');

function toISO(v: unknown): string {
  if (v instanceof Date) {
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }

  const s = String(v ?? '').trim();

  if (!s) return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }

  // DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);

  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);

    const d = new Date(year, month - 1, day);

    // Validate date
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return '';
    }

    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const d = new Date(s);

  return isNaN(d.getTime()) ? '' : toISO(d);
}

export async function readSpreadsheet(file: File): Promise<Raw[]> {
  const XLSX = await import('xlsx');

  const wb = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  });

  const sheet = wb.Sheets[wb.SheetNames[0]];

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  });

  return rows
    .map((r) => {
      const out: Raw = {};

      Object.entries(r).forEach(([k, v]) => {
        out[norm(k)] = v instanceof Date ? toISO(v) : String(v ?? '').trim();
      });

      return out;
    })
    .filter((r) => Object.values(r).some((v) => v !== ''));
}

export async function downloadTemplate(type: SacramentType) {
  const XLSX = await import('xlsx');

  const headers = (importColumns[type] ?? []).map((c) => c.header);

  const ws = XLSX.utils.aoa_to_sheet([headers]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, 'Records');

  XLSX.writeFile(wb, `${type}-import-template.xlsx`);
}

interface PlanContext {
  people: Person[];

  recordsFor: (personId: string) => SacramentRecord[];

  defaultParishId: string;
}

export function planImport(
  type: SacramentType,
  raw: Raw[],
  ctx: PlanContext
): ImportRow[] {
  const parishes = getParishStore();

  const seenRegNos = new Set<string>();

  const seenRecords = new Set<string>();

  const resolveParish = (name: string): string => {
    if (!name) return ctx.defaultParishId;

    const n = norm(name);

    return (
      parishes.find(
        (p) => norm(p.name) === n || norm(p.name).includes(n)
      )?.id ?? ''
    );
  };

  return raw.map((row, i): ImportRow => {
    const line = i + 2; // Header is row 1

    const fail = (name: string, message: string): ImportRow => ({
      line,
      ok: false,
      name: name || '(no name)',
      detail: '',
      message,
    });

    const parishNameFromRow = row.parish ?? '';

    const parishId = resolveParish(parishNameFromRow);

    const regNo = (row.regno ?? '').trim();

    // --------------------------------------------------
    // BAPTISM / CONVERSION / PERSON ENTRY
    // --------------------------------------------------

    if (isEntryType(type)) {
      const christian = (row.christianname ?? '').trim();

      const surname = (row.surname ?? '').trim();

      const name = `${christian} ${surname}`.trim();

      const date = toISO(row.dateofbaptism);

      if (!regNo) {
        return fail(name, 'Reg No is missing');
      }

      if (!christian || !surname) {
        return fail(name, 'Christian name and surname are required');
      }

      if (!date) {
        return fail(name, 'Date of baptism is missing or not a valid date');
      }

      if (!parishId) {
        return fail(
          name,
          parishNameFromRow
            ? `Parish "${parishNameFromRow}" was not found`
            : 'No parish: add a Parish column or select a parish first'
        );
      }

      if (parishId !== ctx.defaultParishId) {
        return fail(name, 'You can only import for your own parish');
      }

      // Check if registration number already exists
      // Check whether registration number already exists
      const taken = ctx.people.find((p) => p.regNo === regNo);

      if (taken) {
        if (taken.parishId !== parishId) {
          return fail(
            name,
            `This person is in ${parishName(taken.parishId)}`
          );
        }

        return fail(
          name,
          'This person is already in the register (same Reg No)'
        );
      }

      // Check for duplicate registration numbers in this import file
      if (seenRegNos.has(regNo)) {
        return fail(
          name,
          'This person is already in the register (same Reg No)'
        );
      }

      seenRegNos.add(regNo);

      return {
        line,
        ok: true,
        name,
        detail: `Reg. ${regNo}`,
        message: `Baptised ${date}`,

        payload: {
          draft: {
            regNo,
            parishId,
            dateOfBaptism: date,
            christianName: christian,
            surname,
            dob: toISO(row.dateofbirth),
            fatherName: row.father ?? '',
            motherName: row.mother ?? '',
            godparentName: row.godparent ?? '',
            village: row.residence ?? '',
            minister: row.minister ?? '',
            phone: row.phone ?? '',
          },

          convert:
            type === 'conversion'
              ? {
                  previousReligion: row.previousreligion ?? '',
                }
              : undefined,

          records: [],
        },
      };
    }

    // --------------------------------------------------
    // COMMUNION / CONFIRMATION / MATRIMONY
    // Existing baptised person required
    // --------------------------------------------------

    const name = (row.name ?? '').trim();

    const date = toISO(row.date);

    const person =
      (regNo && ctx.people.find((p) => p.regNo === regNo)) ||
      (name &&
        ctx.people.find((p) => norm(p.fullName) === norm(name)));

    if (!person) {
      return fail(
        name || regNo,
        'No baptised person matches this Reg No or name'
      );
    }

    if (!date) {
      return fail(person.fullName, 'Date is missing or not a valid date');
    }

    if (!parishId) {
      return fail(
        person.fullName,
        parishNameFromRow
          ? `Parish "${parishNameFromRow}" was not found`
          : 'No parish: add a Parish column or select a parish first'
      );
    }

    // Check eligibility
    const elig = checkEligibility(type, ctx.recordsFor(person.id));

    if (!elig.ok) {
      return fail(person.fullName, elig.reason ?? 'Not eligible');
    }

    // Prevent duplicate records for the same person in this import
    const recordKey = `${type}:${person.id}`;

    if (seenRecords.has(recordKey)) {
      return fail(person.fullName, 'Duplicate record in this import file');
    }

    seenRecords.add(recordKey);

    const extra: Record<string, string> = {};

    if (type === 'matrimony') {
      extra.spouseName = row.spouse ?? '';
    }

    return {
      line,
      ok: true,
      name: person.fullName,
      detail: `Reg. ${person.regNo}`,
      message: date,

      payload: {
        personId: person.id,

        records: [
          {
            type,
            personId: person.id,
            parishId,
            date,
            minister: row.minister ?? '',
            sponsors: '',
            notes: '',
            extra,
          },
        ],
      },
    };
  });
}