import React from 'react';
import { SacramentRecord } from '../types/records';
import { getSacrament, initiationTypes, toneClass } from '../utils/sacraments';
import { SacramentIcon } from './SacramentIcon';

interface SacramentProgressProps {
  records: SacramentRecord[];
}

export function SacramentProgress({ records }: SacramentProgressProps) {
  const received = initiationTypes.filter((t) => records.some((r) => r.type === t)).map((t) => getSacrament(t).label);
  return (
    <div className="flex gap-1" aria-label={received.length ? `Received: ${received.join(', ')}` : 'No sacraments recorded'}>
      {initiationTypes.map((t) => {
        const has = records.some((r) => r.type === t);
        return (
          <span key={t} title={`${getSacrament(t).label}${has ? '' : ' — not recorded'}`} className={`grid h-6 w-6 place-items-center rounded-md ${has ? toneClass(t) : 'bg-cream text-muted/40'}`}>
            <SacramentIcon type={t} className="h-3 w-3" />
          </span>);

      })}
    </div>);

}