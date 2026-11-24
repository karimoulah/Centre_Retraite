'use client';

import type { ActionResult } from '@/lib/actions';
import { ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from '@/lib/api/contracts';

import { confirmUploadAction, requestUploadAction } from './actions';

/** Checked before sending, so a wrong file is refused at once (the API checks again). */
export function checkFile(file: File): string | null {
  if (!(ATTACHMENT_TYPES as readonly string[]).includes(file.type))
    return 'Formats acceptés : PDF, JPG ou PNG.';
  if (file.size > MAX_ATTACHMENT_BYTES) return 'Le fichier dépasse 10 Mo.';
  return null;
}

/** PUT with progress events (fetch has none for uploads). */
function put(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) =>
      event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}

/** Signed URL → direct upload to storage (R2) → confirmation by the API. */
export async function uploadAttachment(
  entryId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<ActionResult> {
  const problem = checkFile(file);
  if (problem) return { ok: false, message: problem };
  const signed = await requestUploadAction(entryId, {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  if (!signed.ok || !signed.data)
    return signed.ok ? { ok: false, message: 'Envoi impossible.' } : signed;
  try {
    onProgress(0);
    await put(signed.data.uploadUrl, file, signed.data.headers, onProgress);
  } catch {
    return {
      ok: false,
      message: 'L’envoi du fichier a échoué. Vérifiez votre connexion et réessayez.',
    };
  }
  const confirmed = await confirmUploadAction(entryId, signed.data.key, file.name);
  return confirmed.ok ? { ok: true, message: confirmed.message } : confirmed;
}
