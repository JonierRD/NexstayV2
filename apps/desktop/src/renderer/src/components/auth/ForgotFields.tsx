import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '../ui/button';

export function ForgotFields({
  email,
  onEmail,
  isSubmitting,
  onBack
}: {
  email: string;
  onEmail: (value: string) => void;
  isSubmitting: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Correo electrónico</span>
        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
          <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
          <input
            type="email"
            name="forgotEmail"
            placeholder="correo@ejemplo.com"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmail(event.target.value)}
          />
        </div>
      </label>

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
          {isSubmitting ? 'Enviando...' : 'Enviar código'}
        </span>
      </Button>
    </>
  );
}