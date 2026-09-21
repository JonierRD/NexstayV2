import { AlertTriangle, Boxes, CheckCircle2, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type StockFilter } from './types';

export type InventoryMetrics = {
  totalItems: number;
  normalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnits: number;
  totalInventoryValue: number;
};

export function InventoryStats({
  metrics,
  stockFilter,
  onToggleFilter
}: {
  metrics: InventoryMetrics;
  stockFilter: StockFilter;
  onToggleFilter: (filter: 'NORMAL' | 'LOW' | 'OUT') => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Total Productos */}
      <div className="rounded-2xl border border-[#eadfd6] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#7d6d61]">Total Productos</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf6f2] text-[#4b2b21]">
            <Boxes size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-[#2b1b14]">{metrics.totalItems}</p>
        <p className="text-[10px] text-[#7d6d61]">{metrics.totalUnits} unidades en stock</p>
      </div>

      {/* Stock Normal */}
      <div
        onClick={() => onToggleFilter('NORMAL')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'NORMAL'
            ? 'border-[#2f8f4e] bg-[#f2faf3]'
            : 'border-[#eadfd6] bg-white hover:border-[#c6e8cf]'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#2f8f4e]">Stock Normal</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e9f6eb] text-[#2f8f4e]">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-[#2f8f4e]">{metrics.normalCount}</p>
        <p className="text-[10px] text-[#2f8f4e]/80">Existencias óptimas</p>
      </div>

      {/* Stock Bajo / Alerta */}
      <div
        onClick={() => onToggleFilter('LOW')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'LOW'
            ? 'border-[#c78b14] bg-[#fffbf2]'
            : 'border-[#eadfd6] bg-white hover:border-[#f2dbab]'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#c78b14]">Stock Crítico</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff5df] text-[#c78b14]">
            <AlertTriangle size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-[#c78b14]">{metrics.lowStockCount}</p>
        <p className="text-[10px] text-[#c78b14]/80">Cerca del mín.</p>
      </div>

      {/* Agotados */}
      <div
        onClick={() => onToggleFilter('OUT')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'OUT'
            ? 'border-[#c94a43] bg-[#fff5f5]'
            : 'border-[#eadfd6] bg-white hover:border-[#f0c8c4]'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#c94a43]">Agotados</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0ee] text-[#c94a43]">
            <TrendingDown size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-[#c94a43]">{metrics.outOfStockCount}</p>
        <p className="text-[10px] text-[#c94a43]/80">Sin existencias</p>
      </div>
    </div>
  );
}