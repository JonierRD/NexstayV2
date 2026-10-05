import { X } from 'lucide-react';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ModalProps = {
  isOpen?: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  zIndexClass?: string;
  className?: string;
  closeOnEscape?: boolean;
};

export function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
  zIndexClass = 'z-50',
  className,
  closeOnEscape = true
}: ModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 transition-opacity',
        zIndexClass
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'relative w-full rounded-2xl border border-sapay-350 bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)]',
          maxWidthClass,
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-lg p-1 text-sapay-650 hover:bg-sapay-100 hover:text-sapay-950 transition"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {title && (
          typeof title === 'string' ? (
            <h2 className="text-[15px] font-semibold text-sapay-950">{title}</h2>
          ) : (
            title
          )
        )}

        <div className={cn(title ? 'mt-4' : '')}>{children}</div>
      </div>
    </div>
  );
}
