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
    <article className="rounded-xl border border-sapay-350 bg-white p-2 shadow-[0_8px_20px_rgba(67,42,27,0.04)] sm:rounded-[16px] sm:p-2.5 xl:p-3">
      <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3">
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-8 sm:w-8 xl:h-9 xl:w-9 sm:rounded-xl', tone)}>
          <Icon className="h-3.5 w-3.5 text-sapay-900 sm:h-4 sm:w-4 xl:h-[18px] xl:w-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-medium text-sapay-700 sm:text-[10px]">{title}</p>
          <p className="truncate text-[13px] font-bold tracking-tight text-sapay-950 sm:text-[15px] xl:text-[17px] leading-tight">{value}</p>
          <p className="truncate text-[8px] text-[#8b7b70] sm:text-[9px] xl:text-[10px]">{detail}</p>
        </div>
      </div>
    </article>
  );
}