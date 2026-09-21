import { ShoppingCart } from 'lucide-react';
import { type ComponentType } from 'react';
import { cn } from '../../lib/utils';

export function SummaryCard({ label, value, icon: Icon, tint }: { label: string; value: string; icon: ComponentType<{ size?: number }>; tint: string }) {
  return (
    <div className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_30px_rgba(52,39,28,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-sapay-750">{label}</p>
          <p className="mt-2 text-[20px] font-bold text-sapay-950">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tint)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}