import type { ElementType, ReactElement } from 'react';
import { cn } from '../../lib/utils';

export function IconButton({
  icon: Icon,
  label,
  onClick,
  danger
}: {
  icon: ElementType;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border bg-white shadow-sm transition',
        danger
          ? 'border-[#f0c8c4] text-[#c94a43] hover:border-[#e5a0a0] hover:bg-[#fff5f5]'
          : 'border-[#ddd2c8] text-[#5a463a] hover:border-[#bfa89d] hover:bg-[#faf6f2]'
      )}
      title={label}
      aria-label={label}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}