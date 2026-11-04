import React from 'react';
import { PlusIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { sacraments } from '../data/sacraments';
import { toneClass } from '../utils/sacraments';
import { SacramentIcon } from './SacramentIcon';

interface SacramentCardsProps {
  loading: boolean;
}

export function SacramentCards({ loading }: SacramentCardsProps) {
  const { records } = useRecords();
  const { selectedParishId, openSacrament } = useUI();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {sacraments.map((s) => {
        const count = records.filter((r) => r.type === s.type && (selectedParishId === 'all' || r.parishId === selectedParishId)).length;
        return (
          <button
            key={s.type}
            type="button"
            onClick={() => openSacrament(s.type)}
            aria-label={`Record a new ${s.label}. ${count} total records.`}
            className="group flex flex-col rounded-2xl border border-line bg-paper p-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/30 active:translate-y-0 sm:p-5">
            
            <div className="flex items-start justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass(s.type)}`}>
                <SacramentIcon type={s.type} className="h-5 w-5" />
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted transition-colors duration-150 group-hover:border-forest group-hover:bg-forest group-hover:text-white">
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-5 text-sm text-muted">{s.plural}</p>
            {loading ?
            <span className="mt-2 block h-8 w-12 animate-pulse rounded-md bg-line" /> :

            <p className="mt-1 text-3xl font-semibold text-forest">{count}</p>
            }
            <p className="mt-auto pt-1 text-[11px] text-muted">Total records · tap to add</p>
          </button>);

      })}
    </div>);

}