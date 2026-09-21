import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CATEGORIES } from './types';

export function InventoryFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}: {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-[18px] border border-sapay-350 bg-white p-3.5 shadow-[0_10px_30px_rgba(67,42,27,0.04)] sm:flex-row sm:items-center sm:justify-between">
      {/* Buscador */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sapay-650" />
        <input
          type="text"
          placeholder="Buscar por nombre, descripción o ubicación..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 pl-9 pr-3 text-[12px] text-sapay-950 outline-none transition placeholder:text-sapay-550 focus:border-sapay-600 focus:bg-white"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sapay-650 hover:text-sapay-900"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Selector de Categorías */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={cn(
              'whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-medium transition',
              selectedCategory === cat.key
                ? 'bg-sapay-900 text-white shadow-sm'
                : 'bg-sapay-200 text-[#6d5d52] hover:bg-[#f2eae4] hover:text-sapay-900'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}