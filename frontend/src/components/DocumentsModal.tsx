import React, { useMemo, useState } from 'react';
import { AlertCircleIcon, DownloadIcon, EyeIcon, FileTextIcon, FolderOpenIcon, ImageIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { documentCategories } from '../data/documentCategories';
import { acceptAttr, documentExtensions, extensionOf, formatBytes, isImage } from '../utils/files';
import { formatDate } from '../utils/format';
import { inputClass, secondaryButton } from '../utils/styles';
import { Field } from './Field';
import { FileDropZone } from './FileDropZone';
import { Modal } from './Modal';
import { useUI } from '../contexts/UIContext';

interface DocumentsModalProps {
  onClose: () => void;
}

export function DocumentsModal({ onClose }: DocumentsModalProps) {
  const { documents, addDocument, removeDocument } = useRecords();
  const [category, setCategory] = useState(documentCategories[0]);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<string>();

  const handleFiles = async (files: File[]) => {
    setError(undefined);
    setNotice(undefined);
    const accepted = files.filter((f) => documentExtensions.includes(extensionOf(f.name)));
    const rejected = files.filter((f) => !documentExtensions.includes(extensionOf(f.name)));

    setUploading(true);
    try {
      for (const f of accepted) {
        await addDocument({ file: f, category });
      }
      if (accepted.length) {
        setNotice(`${accepted.length} ${accepted.length === 1 ? 'document' : 'documents'} saved.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload the document.');
      setUploading(false);
      return;
    }
    setUploading(false);
    if (rejected.length) {
      setError(`Not added: ${rejected.map((f) => f.name).join(', ')}. Only PDF, Word and scanned images (JPG, PNG) are kept here.`);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (filter !== 'all' && d.category !== filter) return false;
      return !q || d.name.toLowerCase().includes(q);
    });
  }, [documents, filter, search]);

  return (
    <Modal
      title="Documents"
      subtitle="Scanned certificates, register pages and letters — real document files only."
      icon={
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-soft text-gold">
          <FolderOpenIcon className="h-5 w-5" />
        </span>
      }
      onClose={onClose}>

      <div className="space-y-6">
        <section aria-labelledby="upload-title" className="space-y-4">
          <h3 id="upload-title" className="text-sm font-semibold text-forest">Add documents</h3>
          <Field label="Document type" htmlFor="doc-category" className="sm:max-w-xs">
            <select id="doc-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {documentCategories.map((c) =>
              <option key={c} value={c}>{c}</option>
              )}
            </select>
          </Field>
          <FileDropZone
            accept={acceptAttr(documentExtensions)}
            multiple
            title={uploading ? 'Uploading…' : 'Upload document files'}
            hint="PDF, Word (.doc, .docx) or scans (.jpg, .png) · several at once"
            disabled={uploading}
            onFiles={handleFiles} />
          {error &&
          <p className="flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber-ink" role="alert">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
            </p>
          }
          {notice && <p className="text-sm font-medium text-sage-ink" role="status">{notice}</p>}
        </section>

        <section aria-label="Uploaded documents" className="border-t border-line pt-6">
  <h3 className="mb-3 text-sm font-semibold text-forest">
    Uploaded documents <span className="font-normal text-muted">· {documents.length}</span>
  </h3>
  <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <label htmlFor="doc-search" className="sr-only">Search documents</label>
              <input id="doc-search" type="search" value={search} placeholder="Search by file name" onChange={(e) => setSearch(e.target.value)} className={`${inputClass} py-2 pl-9`} />
            </div>
            <label htmlFor="doc-filter" className="sr-only">Filter by type</label>
            <select id="doc-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputClass} w-auto py-2`}>
              <option value="all">All types</option>
              {documentCategories.map((c) =>
              <option key={c} value={c}>{c}</option>
              )}
            </select>
          </div>

          {visible.length === 0 ?
          <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <p className="font-medium text-forest">{documents.length === 0 ? 'No documents yet' : 'No documents match'}</p>
              <p className="mt-1 text-sm text-muted">
                {documents.length === 0 ? 'Upload scanned certificates or register pages to keep them here.' : 'Try another search or type.'}
              </p>
            </div> :

          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {visible.map((d) => {
              const Icon = isImage(d.name) ? ImageIcon : FileTextIcon;
              return (
                <li key={d.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cream text-forest">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium text-ink">{d.name}</p>
                        <p className="text-xs text-muted">
                          {d.category} · {extensionOf(d.name).toUpperCase()} · {formatBytes(d.size)} · {formatDate(d.uploadedOn)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <a href={d.url} target="_blank" rel="noreferrer" className={`${secondaryButton} px-2.5 py-1.5 text-xs`}>
                        <EyeIcon className="h-3.5 w-3.5" /> View
                      </a>
                      <a href={d.url} download={d.name} className={`${secondaryButton} px-2.5 py-1.5 text-xs`}>
                        <DownloadIcon className="h-3.5 w-3.5" /> Download
                      </a>
                      {confirmDelete === d.id ?
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await removeDocument(d.id);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Could not delete the document.');
                        }
                        setConfirmDelete(undefined);
                      }}
                      className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-danger/90">
                          Confirm delete
                        </button> :

                    <button type="button" onClick={() => setConfirmDelete(d.id)} aria-label={`Delete ${d.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-cream hover:text-danger">
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                    }
                    </div>
                  </li>);
            })}
            </ul>
          }
        </section>
      </div>
    </Modal>);

}