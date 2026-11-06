import React, { DragEvent, ReactNode, useId, useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';

interface FileDropZoneProps {
  accept: string;
  multiple?: boolean;
  title: string;
  hint: ReactNode;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDropZone({ accept, multiple, title, hint, disabled, onFiles }: FileDropZoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 focus-within:ring-2 focus-within:ring-forest-500/30 ${
      dragging ? 'border-forest-500 bg-sage/60' : 'border-line bg-cream/50 hover:border-forest-500/50'} ${
      disabled ? 'pointer-events-none opacity-60' : ''}`}>
      
      <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-forest shadow-sm">
        <UploadCloudIcon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="mt-3 text-sm font-semibold text-forest">{title}</span>
      <span className="mt-1 text-xs text-muted">{hint}</span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          if (inputRef.current) inputRef.current.value = '';
        }} />
      
    </label>);

}