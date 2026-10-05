import { Search } from 'lucide-react';
import type { ReactElement } from 'react';

export function SearchInput({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}): ReactElement {
  return (
    <label className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-xl border border-sapay-400 bg-sapay-100 px-2.5 text-sapay-650 transition focus-within:border-sapay-600 focus-within:bg-white">
      <Search size={14} aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[10px] text-sapay-950 outline-none placeholder:text-sapay-550"
      />
    </label>
  );
}