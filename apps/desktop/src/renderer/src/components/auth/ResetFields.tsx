import { ArrowRight, Eye, EyeOff, LockKeyhole, Shield } from 'lucide-react';
import { Button } from '../ui/button';

export function ResetFields({
  code,
  onCode,
  newPassword,
  onNewPassword,
  confirmPassword,
  onConfirmPassword,
  showPassword,
  onTogglePassword,
  isSubmitting,
  onBack
}: {
  code: string;
  onCode: (value: string) => void;
  newPassword: string;
  onNewPassword: (value: string) => void;
  confirmPassword: string;
  onConfirmPassword: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  isSubmitting: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Código de verificación</span>
          <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
            <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
            <input
              type="text"
              name="resetCode"
              placeholder="Código de 6 dígitos"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
              value={code}
              onChange={(event) => onCode(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Nueva contraseña</span>
          <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
            <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="resetNewPassword"
              placeholder="Nueva contraseña"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => onNewPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="shrink-0 text-[#7f7f7f] transition hover:text-[#4b2b21]"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Confirmar contraseña</span>
          <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
            <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="resetConfirmPassword"
              placeholder="Repite la contraseña"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => onConfirmPassword(event.target.value)}
            />
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 text-[12px]">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-[#2a61d4] transition hover:opacity-80"
        >
          Volver al inicio de sesión
        </button>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full rounded-sm bg-[#4b2b21] px-4 text-[13px] font-medium shadow-none transition hover:bg-[#5a3429] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          <ArrowRight size={16} aria-hidden="true" />
          {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
        </span>
      </Button>
    </>
  );
}