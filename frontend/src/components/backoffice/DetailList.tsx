/** Label/value pairs of a detail page; empty values read "Non indiqué". */
export function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-sm text-text-muted">{item.label}</dt>
          <dd className="whitespace-pre-line">{item.value ?? <span className="text-text-muted">Non indiqué</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
