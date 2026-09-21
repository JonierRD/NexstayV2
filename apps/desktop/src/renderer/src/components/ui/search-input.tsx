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
    <label className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
      <Search size={14} aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[10px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
      />
    </label>
  );
}