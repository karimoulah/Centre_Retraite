'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useUrlState } from './use-url-state';

type DataTableFilterProps = {
  /** Query-string key, e.g. "status". */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Value used when the URL has none (e.g. PENDING for membership requests). */
  defaultValue?: string;
  allLabel?: string;
};

/** Select bound to one query-string key; "all" removes the filter. */
export function DataTableFilter({ param, label, options, defaultValue = 'all', allLabel = 'Tous' }: DataTableFilterProps) {
  const { searchParams, setParams } = useUrlState();
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={searchParams.get(param) ?? defaultValue} onValueChange={(value) => setParams({ [param]: value === defaultValue ? null : value })}>
        <SelectTrigger id={id} className="min-w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
