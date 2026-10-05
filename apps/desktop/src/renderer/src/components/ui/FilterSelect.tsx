import { ChevronRight } from 'lucide-react';
import type { ReactElement } from 'react';

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  labels
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
}): ReactElement {
  return (
    <label className="flex h-8 min-w-[110px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-sapay-400 bg-sapay-100 px-2.5 text-sapay-650 transition focus-within:border-sapay-600 focus-within:bg-white">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-w-0 flex-1 appearance-none bg-transparent text-[11px] text-sapay-950 outline-none"
      >
        <option value="TODOS">{label}</option>
        {options
          .filter((option) => option !== 'TODOS')
          .map((option) => (
            <option key={option} value={option}>
              {labels ? labels[option] ?? option : option}
            </option>
          ))}
      </select>
      <ChevronRight
        size={12}
        className="shrink-0 rotate-90 text-sapay-650 pointer-events-none"
        aria-hidden="true"
      />
    </label>
  );
}