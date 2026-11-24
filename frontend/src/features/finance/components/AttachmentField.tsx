'use client';

import { useId } from 'react';
import { Paperclip } from 'lucide-react';

/** File input for a receipt, with the upload progress read aloud. */
export function AttachmentField({
  file,
  onChange,
  progress,
  error,
  label = 'Pièce justificative',
  description = 'Facture ou reçu : PDF, JPG ou PNG, 10 Mo au plus.',
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  progress: number | null;
  error?: string | null;
  label?: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-medium">
        {label} <span className="font-normal text-text-muted">(facultatif)</span>
      </label>
      <p id={`${id}-help`} className="text-sm text-text-muted">
        {description}
      </p>
      <input
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
        aria-invalid={!!error}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="min-h-11 rounded-xl border border-border p-2 file:mr-3 file:min-h-9 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:font-medium"
      />
      {file && (
        <p className="flex items-center gap-2 text-sm">
          <Paperclip aria-hidden className="size-4" />
          {file.name} ({Math.ceil(file.size / 1024)} Ko)
        </p>
      )}
      {progress !== null && (
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Envoi de la pièce"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted"
          >
            <div className="h-full bg-brand-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span aria-live="polite" className="w-12 text-sm tabular-nums">
            {progress} %
          </span>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-status-error">
          {error}
        </p>
      )}
    </div>
  );
}
