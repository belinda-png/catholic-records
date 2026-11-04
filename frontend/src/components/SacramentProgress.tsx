import React from 'react';
import { sacraments } from '../data/sacraments';
import { SacramentRecord } from '../types/records';
import { toneClass } from '../utils/sacraments';
import { SacramentIcon } from './SacramentIcon';

interface SacramentProgressProps {
  records: SacramentRecord[];
}

export function SacramentProgress({ records }: SacramentProgressProps) {
  const received = sacraments.filter((s) => records.some((r) => r.type === s.type)).map((s) => s.label);
  return (
    <div className="flex gap-1" aria-label={received.length ? `Received: ${received.join(', ')}` : 'No sacraments recorded'}>
      {sacraments.map((s) => {
        const has = records.some((r) => r.type === s.type);
        return (
          <span key={s.type} title={`${s.label}${has ? '' : ' — not recorded'}`} className={`grid h-6 w-6 place-items-center rounded-md ${has ? toneClass(s.type) : 'bg-cream text-muted/40'}`}>
            <SacramentIcon type={s.type} className="h-3 w-3" />
          </span>);

      })}
    </div>);

}