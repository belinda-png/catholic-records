import React from 'react';
import { ChurchIcon, DropletsIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { primaryButton } from '../utils/styles';

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { people } = useRecords();
  const { selectedParishId, openSacrament } = useUI();
  const baptised = people.filter((p) => selectedParishId === 'all' || p.parishId === selectedParishId).length;

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-full bg-gold-soft text-gold sm:grid">
          <ChurchIcon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">TORORO ARCHDIOCESE</p>
          <h1 className="text-3xl font-semibold tracking-tight text-forest sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <button type="button" onClick={() => openSacrament('baptism')} className={`${primaryButton} py-3`}>
          <DropletsIcon className="h-4 w-4" aria-hidden="true" /> Record Baptism
        </button>
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-gold-bright/70 bg-sage/60 text-center sm:h-24 sm:w-24">
          <div>
            <p className="text-[9px] leading-tight text-muted">Baptised<br />members</p>
            <p className="text-2xl font-semibold text-forest">{baptised}</p>
          </div>
        </div>
      </div>
    </header>);

}