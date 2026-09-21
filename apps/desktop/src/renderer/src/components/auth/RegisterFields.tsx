import { ArrowRight, Eye, EyeOff, LockKeyhole, Shield, UserRound } from 'lucide-react';
import { Button } from '../ui/button';

export function RegisterFields({
  fullName,
  onFullName,
  cc,
  onCc,
  email,
  onEmail,
  phone,
  onPhone,
  password,
  onPassword,
  confirmPassword,
  onConfirmPassword,
  adminPassword,
  onAdminPassword,
  showPassword,
  onTogglePassword,
  isSubmitting,
  onBack
}: {
  fullName: string;
  onFullName: (value: string) => void;
  cc: string;
  onCc: (value: string) => void;
  email: string;
  onEmail: (value: string) => void;
  phone: string;
  onPhone: (value: string) => void;
  password: string;
  onPassword: (value: string) => void;
  confirmPassword: string;
  onConfirmPassword: (value: string) => void;
  adminPassword: string;
  onAdminPassword: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  isSubmitting: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">
            Nombre completo
          </span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <UserRound className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type="text"
              name="fullName"
              placeholder="Ingresa el nombre completo"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              autoComplete="name"
              value={fullName}
              onChange={(event) => onFullName(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Cédula</span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <Shield className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type="text"
              name="cc"
              placeholder="Cédula"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              value={cc}
              onChange={(event) => onCc(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Correo</span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <Shield className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmail(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Teléfono</span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <Shield className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type="text"
              name="phone"
              placeholder="Opcional"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              value={phone}
              onChange={(event) => onPhone(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Contraseña</span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <LockKeyhole className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="registerPassword"
              placeholder="Crear contraseña"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              autoComplete="new-password"
              value={password}
              onChange={(event) => onPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="shrink-0 text-[#7f7f7f] transition hover:text-sapay-900"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">
            Confirmar contraseña
          </span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <LockKeyhole className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="registerConfirmPassword"
              placeholder="Repite la contraseña"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => onConfirmPassword(event.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-sapay-1000">
            Contraseña de administrador
          </span>
          <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
            <LockKeyhole className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="adminPassword"
              placeholder="Contraseña del administrador"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(event) => onAdminPassword(event.target.value)}
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
        <span className="text-xs uppercase tracking-[0.28em] text-[#9d9d9d]">
          Registro local
        </span>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full rounded-sm bg-sapay-900 px-4 text-[13px] font-medium shadow-none transition hover:bg-sapay-850 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          <ArrowRight size={16} aria-hidden="true" />
          {isSubmitting ? 'Registrando...' : 'Registrar usuario'}
        </span>
      </Button>
    </>
  );
}