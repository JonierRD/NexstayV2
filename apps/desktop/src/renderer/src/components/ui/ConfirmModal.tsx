import { AlertTriangle } from 'lucide-react';
import { type ReactElement } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Modal } from './Modal';

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmDanger = false,
  onConfirm,
  onClose
}: ConfirmModalProps): ReactElement {
  return (
    <Modal
      onClose={onClose}
      maxWidthClass="max-w-[360px]"
      zIndexClass="z-[60]"
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            confirmDanger ? 'bg-danger-50' : 'bg-[#fff5df]'
          )}
        >
          <AlertTriangle size={24} className={confirmDanger ? 'text-danger' : 'text-gold'} />
        </div>
        <h3 className="mt-3 text-[15px] font-semibold text-sapay-950">{title}</h3>
        <p className="mt-1 text-[11px] text-sapay-750">{message}</p>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          type="button"
          onClick={onClose}
          className="flex-1 h-9 rounded-xl border border-sapay-450 bg-white text-[11px] font-medium text-sapay-900 hover:bg-sapay-200"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          className={cn(
            'flex-1 h-9 rounded-xl text-[11px] font-medium text-white disabled:opacity-70',
            confirmDanger ? 'bg-[#d13d3d] hover:bg-[#b83030]' : 'bg-sapay-900 hover:bg-sapay-850'
          )}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
