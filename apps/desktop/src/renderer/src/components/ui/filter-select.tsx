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
    <label className="flex h-8 min-w-[110px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-w-0 flex-1 appearance-none bg-transparent text-[11px] text-[#2b1b14] outline-none"
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
        className="shrink-0 rotate-90 text-[#8d7b70] pointer-events-none"
        aria-hidden="true"
      />
    </label>
  );
}