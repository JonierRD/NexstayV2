import type { ReactElement } from 'react';

export function DetailLine({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="min-w-0 text-sapay-750">{label}:</dt>
      <dd className="min-w-0 text-right font-medium text-sapay-950">{value}</dd>
    </div>
  );
}