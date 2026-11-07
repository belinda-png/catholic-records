import { NewPerson, NewRecord, Person, SacramentRecord, SacramentType } from '../types/records';
import { importColumns } from '../data/importColumns';
import { checkEligibility, isEntryType } from './sacraments';
import { getParishStore } from './parishStore';

export interface ImportRow {
  line: number;       // row number in the spreadsheet (header is row 1)
  ok: boolean;
  name: string;
  detail: string;
  message: string;
  payload?: { person?: NewPerson; personId?: string; records: NewRecord[] };
}

type Raw = Record<string, string>;

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');

export function fileKind(name: string): 'excel' | 'access' | 'invalid' {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'xls' || ext === 'xlsx') return 'excel';
  if (ext === 'mdb' || ext === 'accdb') return 'access';
  return 'invalid';
}

const pad = (n: number) => String(n).padStart(2, '0');

function toISO(v: unknown): string {
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); // day/month/year
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : toISO(d);
}

export async function readSpreadsheet(file: File): Promise<Raw[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
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
  const headers = importColumns[type].map((c) => c.header);
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

export function planImport(type: SacramentType, raw: Raw[], ctx: PlanContext): ImportRow[] {
  const parishes = getParishStore();
  const seenRegNos = new Set<string>();

  const resolveParish = (name: string): string => {
    if (!name) return ctx.defaultParishId;
    const n = norm(name);
    return parishes.find((p) => norm(p.name) === n || norm(p.name).includes(n))?.id ?? '';
  };

  return raw.map((row, i): ImportRow => {
    const line = i + 2; // row 1 is the header
    const fail = (name: string, message: string): ImportRow => ({ line, ok: false, name: name || '(no name)', detail: '', message });

    const parishId = resolveParish(row.parish);
    const regNo = row.regno ?? '';

    if (isEntryType(type)) {
      const christian = row.christianname ?? '';
      const surname = row.surname ?? '';
      const name = `${christian} ${surname}`.trim();
      const date = toISO(row.dateofbaptism);
      if (!regNo) return fail(name, 'Reg No is missing');
      if (!christian || !surname) return fail(name, 'Christian name and surname are required');
      if (!date) return fail(name, 'Date of baptism is missing or not a valid date');
      if (!parishId) return fail(name, row.parish ? `Parish "${row.parish}" was not found` : 'No parish: add a Parish column or select a parish first');
      if (ctx.people.some((p) => p.regNo === regNo && p.parishId === parishId) || seenRegNos.has(`${parishId}:${regNo}`)) {
        return fail(name, 'Already in the register (same Reg No)');
      }
      seenRegNos.add(`${parishId}:${regNo}`);
      return {
        line, ok: true, name, detail: `Reg. ${regNo}`, message: `Baptised ${date}`,
        payload: {
          person: {
            fullName: name,
            dob: toISO(row.dateofbirth),
            fatherName: row.father ?? '',
            motherName: row.mother ?? '',
            godparentName: row.godparent ?? '',
            parishId,
            village: row.residence ?? '',
            phone: row.phone ?? '',
            registeredOn: date,
          },
          records: [{
            type: 'baptism', personId: '', parishId, date,
            minister: row.minister ?? '', sponsors: row.godparent ?? '', notes: '', extra: {},
          }],
        },
      };
    }

    // Communion, confirmation, matrimony: must match someone already baptised
    const name = row.name ?? '';
    const date = toISO(row.date);
    const person =
      (regNo && ctx.people.find((p) => p.regNo === regNo)) ||
      (name && ctx.people.find((p) => norm(p.fullName) === norm(name)));
    if (!person) return fail(name || regNo, 'No baptised person matches this Reg No or name');
    if (!date) return fail(person.fullName, 'Date is missing or not a valid date');
    if (!parishId) return fail(person.fullName, 'No parish: add a Parish column or select a parish first');

    const elig = checkEligibility(type, ctx.recordsFor(person.id));
    if (!elig.ok) return fail(person.fullName, elig.reason ?? 'Not eligible');

    const extra: Record<string, string> = {};
    if (type === 'matrimony') extra.spouseName = row.spouse ?? '';
    return {
      line, ok: true, name: person.fullName, detail: `Reg. ${person.regNo}`, message: date,
      payload: {
        personId: person.id,
        records: [{
          type, personId: person.id, parishId, date,
          minister: row.minister ?? '', sponsors: '', notes: '', extra,
        }],
      },
    };
  });
}