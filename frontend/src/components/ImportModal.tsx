import React, { useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, CheckIcon, DownloadIcon, FileSpreadsheetIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { importColumns } from '../data/importColumns';
import { SacramentType } from '../types/records';
import { acceptAttr, spreadsheetExtensions } from '../utils/files';
import { downloadTemplate, fileKind, ImportRow, planImport, readSpreadsheet } from '../utils/importer';
import { getSacrament, isEntryType, shortParishName, toneClass } from '../utils/sacraments';
import { primaryButton, secondaryButton } from '../utils/styles';
import { FileDropZone } from './FileDropZone';
import { Modal } from './Modal';
import { SacramentIcon } from './SacramentIcon';

interface ImportModalProps {
  type: SacramentType;
  onClose: () => void;
}

type Stage = 'choose' | 'reading' | 'review' | 'importing' | 'done';

export function ImportModal({ type, onClose }: ImportModalProps) {
  const config = getSacrament(type);
  const { people, recordsFor, importRows } = useRecords();
  const { selectedParishId } = useUI();
  const [stage, setStage] = useState<Stage>('choose');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string>();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const ready = rows.filter((r) => r.ok);
  const problems = rows.filter((r) => !r.ok);
  const defaultParishId = selectedParishId === 'all' ? '' : selectedParishId;

  const handleFile = async (files: File[]) => {
    const file = files[0];
    setError(undefined);
    const kind = fileKind(file.name);
    if (kind === 'invalid') {
      setError(`“${file.name}” isn't allowed. Only Excel (.xls, .xlsx) and Access (.mdb, .accdb) files can be imported.`);
      return;
    }
    if (kind === 'access') {
      setError(
        "Access databases can't be read directly in the browser yet. In Access, open the table and choose External Data → Export → Excel, then upload that Excel file here."
      );
      return;
    }
    setFileName(file.name);
    setStage('reading');
    try {
      const raw = await readSpreadsheet(file);
      if (raw.length === 0) {
        setError('That sheet has no rows. Make sure names are on the first sheet, below a header row.');
        setStage('choose');
        return;
      }
      setRows(planImport(type, raw, { people, recordsFor, defaultParishId }));
      setStage('review');
    } catch {
      setError("We couldn't read that file. Check it opens in Excel and try again.");
      setStage('choose');
    }
  };

  const runImport = async () => {
    setStage('importing');
    const items = ready.map((r) => r.payload).filter(Boolean) as NonNullable<ImportRow['payload']>[];
    const result = await importRows(items);
    setImportedCount(result.saved);
    setFailedCount(result.failed.length);
    setStage('done');
  };

  const icon =
  <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass(type)}`}>
      <SacramentIcon type={type} className="h-5 w-5" />
    </span>;


  const footer =
  stage === 'review' || stage === 'importing' ?
  <>
        <button type="button" onClick={() => {setRows([]);setStage('choose');}} className={secondaryButton} disabled={stage === 'importing'}>
          Choose another file
        </button>
        <button type="button" onClick={runImport} disabled={ready.length === 0 || stage === 'importing'} className={primaryButton}>
          {stage === 'importing' && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {stage === 'importing' ? 'Importing…' : `Import ${ready.length} ${ready.length === 1 ? 'record' : 'records'}`}
        </button>
      </> :
  stage === 'done' ?
  <button type="button" onClick={onClose} className={primaryButton}>Done</button> :

  <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>;


  return (
    <Modal title={`Import ${config.plural}`} subtitle="Add many records at once, in the order they appear in your file." icon={icon} onClose={onClose} footer={footer}>
      {(stage === 'choose' || stage === 'reading') &&
      <div className="space-y-5">
          <FileDropZone
          accept={acceptAttr(spreadsheetExtensions)}
          title={stage === 'reading' ? `Reading ${fileName}…` : 'Choose an Excel or Access file'}
          hint="Drag it here or click to browse · .xls, .xlsx, .mdb, .accdb only"
          disabled={stage === 'reading'}
          onFiles={handleFile} />
        
          {error &&
        <p className="flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink" role="alert">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
        }
          <section aria-labelledby="columns-title">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 id="columns-title" className="text-sm font-semibold text-forest">Columns we read</h3>
              <button type="button" onClick={() => downloadTemplate(type)} className={`${secondaryButton} px-3 py-1.5 text-xs`}>
                <DownloadIcon className="h-3.5 w-3.5" /> Download Excel template
              </button>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {(importColumns[type] ?? []).map((c) =>
            <li key={c.key} className={`rounded-md px-2 py-1 text-xs ${c.required ? 'bg-sage font-medium text-sage-ink' : 'bg-cream text-muted'}`}>
                  {c.header}
                  {c.required && ' *'}
                </li>
            )}
            </ul>
            <p className="mt-2 text-xs text-muted">
              {isEntryType(type) ?
            'Each row becomes a new member of the register. ' :
            'Each row must match someone already baptised, by Reg No or exact name. '}
              {defaultParishId ?
            `Rows without a Parish go to ${shortParishName(defaultParishId)}.` :
            'Include a Parish column, or select a parish on the dashboard first.'}
            </p>
          </section>
        </div>
      }

      {(stage === 'review' || stage === 'importing') &&
      <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-forest">
              <FileSpreadsheetIcon className="h-4 w-4" aria-hidden="true" /> {fileName}
            </span>
            <span className="text-sage-ink">{ready.length} ready</span>
            {problems.length > 0 && <span className="text-danger">{problems.length} need attention and will be skipped</span>}
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {rows.map((r) =>
          <li key={r.line} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                <span className="w-8 shrink-0 pt-0.5 text-xs tabular-nums text-muted">{r.line}</span>
                {r.ok ?
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-sage-ink" aria-label="Ready" /> :

            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="Problem" />
            }
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{r.name}</p>
                  <p className={`text-xs ${r.ok ? 'text-muted' : 'text-danger'}`}>{r.ok ? `${r.detail} · ${r.message}` : r.message}</p>
                </div>
              </li>
          )}
          </ol>
          <p className="text-xs text-muted">Row numbers match your spreadsheet. Fix skipped rows in the file and import it again — rows already added are detected and skipped.</p>
        </div>
      }

      {stage === 'done' &&
      <div className="flex flex-col items-center py-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-sage text-sage-ink">
            <CheckIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-semibold text-forest">
            {importedCount} {importedCount === 1 ? 'record' : 'records'} added
          </p>
          <p className="text-sm text-muted">
            {config.plural} were saved in the order they appear in {fileName}.
            {(problems.length + failedCount) > 0 && ` ${problems.length + failedCount} rows were skipped.`}
          </p>
        </div>
      }
    </Modal>);

}