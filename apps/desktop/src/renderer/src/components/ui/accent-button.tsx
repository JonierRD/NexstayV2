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
          ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)]'
          : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d] hover:bg-[#faf6f2]',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}