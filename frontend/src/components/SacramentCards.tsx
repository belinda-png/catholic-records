import React from 'react';
import { FileSpreadsheetIcon, FolderOpenIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { sacraments } from '../data/sacraments';
import { toneClass } from '../utils/sacraments';
import { SacramentIcon } from './SacramentIcon';

interface SacramentCardsProps {
  loading: boolean;
}

const mainButton =
'group flex flex-1 flex-col rounded-t-2xl p-4 text-left transition-colors duration-150 hover:bg-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest-500/30 sm:p-5';
const footerButton =
'inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-b-2xl border-t border-line px-3 py-2.5 text-xs font-medium text-forest transition-colors duration-150 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest-500/30';

export function SacramentCards({ loading }: SacramentCardsProps) {
  const { records, documents } = useRecords();
  const { selectedParishId, openSacrament, openImport, openDocuments } = useUI();
  const inParish = (parishId: string) => selectedParishId === 'all' || parishId === selectedParishId;
  const documentCount = documents.filter((d) => inParish(d.parishId)).length;

  const count = (value: number) =>
  loading ? <span className="mt-2 block h-8 w-12 animate-pulse rounded-md bg-line" /> : <p className="mt-1 text-3xl font-semibold text-forest">{value}</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {sacraments.map((s) => {
        const total = records.filter((r) => r.type === s.type && inParish(r.parishId)).length;
        return (
          <article key={s.type} className="flex flex-col rounded-2xl border border-line bg-paper">
            <button type="button" onClick={() => openSacrament(s.type)} aria-label={`Record a new ${s.label}. ${total} total records.`} className={mainButton}>
              <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass(s.type)}`}>
                  <SacramentIcon type={s.type} className="h-5 w-5" />
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted transition-colors duration-150 group-hover:border-forest group-hover:bg-forest group-hover:text-white">
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-5 text-sm text-muted">{s.plural}</p>
              {count(total)}
              <p className="mt-auto pt-1 text-[11px] text-muted">Total records</p>
            </button>
            <button type="button" onClick={() => openImport(s.type)} className={footerButton}>
              <FileSpreadsheetIcon className="h-3.5 w-3.5" aria-hidden="true" /> Import from file
            </button>
          </article>);

      })}

      <article className="flex flex-col rounded-2xl border border-line bg-paper">
        <button type="button" onClick={openDocuments} aria-label={`Open documents archive. ${documentCount} documents.`} className={mainButton}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-soft text-gold">
            <FolderOpenIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-sm text-muted">Documents</p>
          {count(documentCount)}
          <p className="mt-auto pt-1 text-[11px] text-muted">Scanned certificates & files</p>
        </button>
        <button type="button" onClick={openDocuments} className={footerButton}>
          <UploadIcon className="h-3.5 w-3.5" aria-hidden="true" /> Upload documents
        </button>
      </article>
    </div>);

}