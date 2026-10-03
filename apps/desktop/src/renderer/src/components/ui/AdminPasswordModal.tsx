import { LockKeyhole, ShieldAlert, X } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';
import { verifyAdminPasswordRequest } from '../lib/api';
import { Button } from './ui/button';

type AdminPasswordModalProps = {
  onSuccess: (password: string) => void;
  onClose: () => void;
};

export function AdminPasswordModal({ onSuccess, onClose }: AdminPasswordModalProps): ReactElement {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setError('Ingresa la contraseña del administrador.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await verifyAdminPasswordRequest(password);
      if (result.valid) {
        onSuccess(password);
      } else {
        setError('La contraseña del administrador no es correcta.');
      }
    } catch {
      setError('Error al verificar la contraseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-[380px] rounded-2xl border border-sapay-350 bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sapay-650 hover:text-sapay-900 transition"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50">
            <ShieldAlert size={24} className="text-danger" />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-sapay-950">Autorización requerida</h3>
          <p className="mt-1 text-[11px] text-sapay-750">
            Ingresa la contraseña de un administrador activo para realizar esta acción.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
              {error}
            </div>
          )}

          <label className="block">
            <div className="flex items-center gap-2 rounded-xl border border-sapay-400 bg-sapay-100 px-3 py-2.5 transition focus-within:border-sapay-600 focus-within:bg-white">
              <LockKeyhole size={16} className="shrink-0 text-sapay-650" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña del administrador"
                className="w-full bg-transparent text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550"
                autoFocus
              />
            </div>
          </label>

          <Button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded-xl bg-sapay-900 text-[12px] font-medium text-white hover:bg-sapay-850 disabled:opacity-70"
          >
            {submitting ? 'Verificando...' : 'Autorizar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
