'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { EntryDetail } from '@/lib/api/contracts';

import { removeAttachmentAction } from '../actions';
import { checkFile, uploadAttachment } from '../upload';
import { AttachmentField } from './AttachmentField';

/** Receipt of an entry: download through a short signed link, replace or remove until validation. */
export function EntryAttachment({ entry }: { entry: EntryDetail }) {
  const router = useRouter();
  const locked = entry.status === 'VALIDATED' || entry.status === 'REJECTED';
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function send() {
    if (!file) return;
    const result = await uploadAttachment(entry.id, file, setProgress);
    setProgress(null);
    if (result.ok) {
      toast.success(result.message ?? 'Pièce justificative jointe.');
      setFile(null);
      router.refresh();
    } else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-4">
      {entry.attachment ? (
        <div className="flex flex-wrap items-center gap-3">
          {entry.attachment.url ? (
            <Button asChild variant="outline">
              <a href={entry.attachment.url} rel="noopener">
                <Download aria-hidden />
                {entry.attachment.name} ({Math.ceil(entry.attachment.size / 1024)} Ko)
              </a>
            </Button>
          ) : (
            <span>{entry.attachment.name}</span>
          )}
          {!locked && (
            <ConfirmDialog
              trigger={<Button variant="ghost">Retirer la pièce</Button>}
              title="Retirer la pièce justificative ?"
              consequence="Le fichier ne sera plus joint à l’écriture. Une dépense sans pièce ne peut pas être validée."
              confirmLabel="Retirer"
              tone="destructive"
              onConfirm={() => removeAttachmentAction(entry.id)}
            />
          )}
        </div>
      ) : (
        <p className="text-text-muted">Aucune pièce jointe.</p>
      )}
      {!locked && (
        <div className="flex flex-col gap-3">
          <AttachmentField
            file={file}
            progress={progress}
            error={error}
            label={entry.attachment ? 'Remplacer la pièce' : 'Joindre une pièce'}
            onChange={(f) => {
              setFile(f);
              setError(f ? checkFile(f) : null);
            }}
          />
          <div>
            <Button
              type="button"
              variant="dark"
              onClick={send}
              disabled={!file || !!error || progress !== null}
            >
              <Upload aria-hidden />
              Envoyer la pièce
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
