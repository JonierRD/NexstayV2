import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function AccentButton({
  children,
  active,
  className,
  ...rest
}: {
  children: ReactNode;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-xl border px-3 text-[12px] font-medium transition',
        active
          ? 'border-sapay-900 bg-sapay-900 text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)]'
          : 'border-sapay-450 bg-white text-sapay-900 hover:border-sapay-500 hover:bg-sapay-200',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}