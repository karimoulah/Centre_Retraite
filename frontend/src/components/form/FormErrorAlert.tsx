'use client';

import Link from 'next/link';

import type { ActionResult } from '@/lib/actions';

import { FormAlert } from './FormAlert';

/** Shows a failed ActionResult; offers a new-tab login link when the session expired. */
export function FormErrorAlert({ result }: { result: ActionResult<unknown> | null }) {
  if (!result || result.ok) return null;
  return (
    <FormAlert>
      {result.message}
      {result.code === 'SESSION_EXPIRED' && (
        <>
          {' '}
          <Link href="/login" target="_blank" className="font-medium underline">
            Se reconnecter (nouvel onglet)
          </Link>
        </>
      )}
    </FormAlert>
  );
}
