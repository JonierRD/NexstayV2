import type { ElementType, ReactElement } from 'react';
import { cn } from '../../lib/utils';

export function StatCard({
  icon: Icon,
  title,
  value,
  detail,
  tone
}: {
  icon: ElementType;
  title: string;
  value: string;
  detail: string;
  tone: string;
}): ReactElement {
  return (
    <article className="rounded-[16px] border border-[#eadfd6] bg-white p-3 shadow-[0_12px_30px_rgba(67,42,27,0.06)]">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', tone)}>
          <Icon size={18} className="text-[#4b2b21]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#7d6e63]">{title}</p>
          <p className="text-[18px] leading-none font-semibold tracking-tight text-[#2b1b14]">{value}</p>
          <p className="text-[10px] text-[#8b7b70]">{detail}</p>
        </div>
      </div>
    </article>
  );
}