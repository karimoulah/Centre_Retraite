'use client';

import { useId } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const presets = [
  { value: 'all', label: 'Toutes les dates' },
  { value: 'month', label: 'Ce mois-ci' },
  { value: 'last-month', label: 'Mois dernier' },
  { value: 'year', label: 'Cette année' },
  { value: 'last-year', label: 'Année dernière' },
  { value: 'custom', label: 'Période personnalisée' },
] as const;

const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Resolves a preset into from/to dates (YYYY-MM-DD). */
export function presetRange(preset: string, today = new Date()): { from: string; to: string } | null {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (preset) {
    case 'month':
      return { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(new Date(Date.UTC(y, m + 1, 0))) };
    case 'last-month':
      return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
    case 'year':
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'last-year':
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    default:
      return null;
  }
}

/** Period filter stored in the URL (?period=…&from=…&to=…), read by the server page. */
export function PeriodPicker({ defaultPreset = 'month' }: { defaultPreset?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = useId();
  const preset = searchParams.get('period') ?? defaultPreset;

  function update(values: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <fieldset className="flex flex-wrap items-end gap-3">
      <legend className="sr-only">Période</legend>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-preset`}>Période</Label>
        <Select
          value={preset}
          onValueChange={(value) => {
            const range = presetRange(value);
            if (value === 'all') update({ period: null, from: null, to: null });
            else update({ period: value, from: range?.from ?? searchParams.get('from'), to: range?.to ?? searchParams.get('to') });
          }}
        >
          <SelectTrigger id={`${id}-preset`} className="min-w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {preset === 'custom' && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-from`}>Du</Label>
            <Input
              id={`${id}-from`}
              type="date"
              defaultValue={searchParams.get('from') ?? ''}
              onChange={(event) => update({ from: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-to`}>Au</Label>
            <Input
              id={`${id}-to`}
              type="date"
              defaultValue={searchParams.get('to') ?? ''}
              onChange={(event) => update({ to: event.target.value })}
            />
          </div>
        </>
      )}
    </fieldset>
  );
}
