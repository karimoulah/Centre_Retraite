'use client';

import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUrlState } from './use-url-state';

/** Search box bound to ?q, applied 400 ms after typing stops. */
export function DataTableSearch({ label = 'Rechercher', placeholder }: { label?: string; placeholder?: string }) {
  const { searchParams, setParams } = useUrlState();
  const id = useId();
  const current = searchParams.get('q') ?? '';
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (value === current) return;
    const timer = setTimeout(() => setParams({ q: value.trim() }), 400);
    return () => clearTimeout(timer);
  }, [value, current, setParams]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" />
        <Input id={id} type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-72 pl-10" />
      </div>
    </div>
  );
}
