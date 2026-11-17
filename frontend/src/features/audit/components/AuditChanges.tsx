import type { AuditEntry } from '@/lib/api/contracts';

import { FIELD_LABELS, formatValue } from '../labels';

/** Before → after, one row per changed field. */
export function AuditChanges({ entry }: { entry: AuditEntry }) {
  const keys = [...new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})])];
  if (keys.length === 0) return <span className="text-text-muted">—</span>;
  return (
    <details className="group">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-2 underline underline-offset-4 hover:no-underline">
        {keys.length} champ{keys.length > 1 ? 's' : ''}
      </summary>
      <table className="mt-2 w-full min-w-80 text-[0.9rem]">
        <caption className="sr-only">Valeurs avant et après</caption>
        <thead>
          <tr className="text-left text-text-muted">
            <th scope="col" className="py-1 pr-3 font-normal">Champ</th>
            <th scope="col" className="py-1 pr-3 font-normal">Avant</th>
            <th scope="col" className="py-1 font-normal">Après</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="border-t border-border align-top">
              <th scope="row" className="py-1.5 pr-3 text-left font-medium">{FIELD_LABELS[key] ?? key}</th>
              <td className="py-1.5 pr-3 text-text-muted line-through decoration-text-muted/50">{formatValue(entry.before?.[key])}</td>
              <td className="py-1.5">{formatValue(entry.after?.[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
