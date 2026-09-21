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
      <div className="rounded-2xl border border-sapay-350 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-sapay-750">Total Productos</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sapay-200 text-sapay-900">
            <Boxes size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-sapay-950">{metrics.totalItems}</p>
        <p className="text-[10px] text-sapay-750">{metrics.totalUnits} unidades en stock</p>
      </div>

      {/* Stock Normal */}
      <div
        onClick={() => onToggleFilter('NORMAL')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'NORMAL'
            ? 'border-success bg-[#f2faf3]'
            : 'border-sapay-350 bg-white hover:border-success-100'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-success">Stock Normal</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-50 text-success">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-success">{metrics.normalCount}</p>
        <p className="text-[10px] text-success/80">Existencias óptimas</p>
      </div>

      {/* Stock Bajo / Alerta */}
      <div
        onClick={() => onToggleFilter('LOW')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'LOW'
            ? 'border-gold bg-[#fffbf2]'
            : 'border-sapay-350 bg-white hover:border-[#f2dbab]'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gold">Stock Crítico</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff5df] text-gold">
            <AlertTriangle size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-gold">{metrics.lowStockCount}</p>
        <p className="text-[10px] text-gold/80">Cerca del mín.</p>
      </div>

      {/* Agotados */}
      <div
        onClick={() => onToggleFilter('OUT')}
        className={cn(
          'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
          stockFilter === 'OUT'
            ? 'border-danger bg-[#fff5f5]'
            : 'border-sapay-350 bg-white hover:border-danger-150'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-danger">Agotados</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-50 text-danger">
            <TrendingDown size={14} />
          </div>
        </div>
        <p className="mt-1.5 text-xl font-bold text-danger">{metrics.outOfStockCount}</p>
        <p className="text-[10px] text-danger/80">Sin existencias</p>
      </div>
    </div>
  );
}