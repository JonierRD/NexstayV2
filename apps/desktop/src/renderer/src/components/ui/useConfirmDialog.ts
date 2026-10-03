import { useState } from 'react';

export type ConfirmDialogOptions = {
  title: string;
  message: string;
  label?: string;
  danger?: boolean;
  onConfirm: () => void;
};

/**
 * Estado del diálogo de confirmación compartido por los hooks que piden
 * eliminar o revertir algo. Devuelve `confirmAction` para que la página
 * decida si renderizar <ConfirmModal />.
 */
export function useConfirmDialog() {
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLabel, setConfirmLabel] = useState('Confirmar');
  const [confirmDanger, setConfirmDanger] = useState(false);

  function showConfirm({ title, message, label, danger, onConfirm }: ConfirmDialogOptions) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmLabel(label ?? 'Confirmar');
    setConfirmDanger(danger ?? false);
    setConfirmAction(() => onConfirm);
  }

  function confirm() {
    if (!confirmAction) return;
    confirmAction();
    setConfirmAction(null);
  }

  function closeConfirm() {
    setConfirmAction(null);
  }

  return {
    showConfirm,
    confirmAction,
    confirmTitle,
    confirmMessage,
    confirmLabel,
    confirmDanger,
    confirm,
    closeConfirm
  };
}