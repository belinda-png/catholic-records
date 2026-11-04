import { sacraments } from '../data/sacraments';
import { parishes } from '../data/parishes';
import { SacramentConfig, SacramentRecord, SacramentType } from '../types/records';

export function getSacrament(type: SacramentType): SacramentConfig {
  return sacraments.find((s) => s.type === type) ?? sacraments[0];
}

export function toneClass(type: SacramentType): string {
  return getSacrament(type).tone === 'gold' ? 'bg-gold-soft text-gold' : 'bg-sage text-sage-ink';
}

export function parishName(id: string): string {
  return parishes.find((p) => p.id === id)?.name ?? '—';
}

export function shortParishName(id: string): string {
  const name = parishName(id);
  return name.split(',')[0];
}

export function spouseIdOf(record: SacramentRecord, personId: string): string | undefined {
  if (record.type !== 'matrimony') return undefined;
  return record.personId === personId ? record.spouseId : record.personId;
}

export interface Eligibility {
  ok: boolean;
  reason?: string;
}

/**
 * Sacraments follow the order of initiation: baptism is the entry point to the
 * register, First Holy Communion follows baptism, and Confirmation follows
 * First Holy Communion. Matrimony requires baptism.
 */
export function checkEligibility(type: SacramentType, recs: SacramentRecord[]): Eligibility {
  const has = (t: SacramentType) => recs.some((r) => r.type === t);
  if (type === 'baptism') return has('baptism') ? { ok: false, reason: 'Already baptised' } : { ok: true };
  if (!has('baptism')) return { ok: false, reason: 'Needs baptism first' };
  if (type === 'communion' && has('communion')) return { ok: false, reason: 'Already received First Holy Communion' };
  if (type === 'confirmation') {
    if (has('confirmation')) return { ok: false, reason: 'Already confirmed' };
    if (!has('communion')) return { ok: false, reason: 'Needs First Holy Communion first' };
  }
  return { ok: true };
}