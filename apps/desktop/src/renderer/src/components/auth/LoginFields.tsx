import { ArrowRight, Eye, EyeOff, LockKeyhole, Shield, UserRound } from 'lucide-react';
import { Button } from '../ui/button';

export function LoginFields({
  identifier,
  onIdentifier,
  password,
  onPassword,
  role,
  onRole,
  showPassword,
  onTogglePassword,
  isSubmitting,
  onForgot
}: {
  identifier: string;
  onIdentifier: (value: string) => void;
  password: string;
  onPassword: (value: string) => void;
  role: 'ADMIN' | 'RECEPTION' | '';
  onRole: (value: 'ADMIN' | 'RECEPTION' | '') => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  isSubmitting: boolean;
  onForgot: () => void;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Usuario</span>
        <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
          <UserRound className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
          <input
            type="text"
            name="user"
            placeholder="Ingresa tu usuario"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
            autoComplete="username"
            value={identifier}
            onChange={(event) => onIdentifier(event.target.value)}
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Contraseña</span>
        <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
          <LockKeyhole className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Ingresa tu contraseña"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-sapay-neutral-200"
            autoComplete="current-password"
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
        <span className="mb-1 block text-[13px] font-medium text-sapay-1000">Rol</span>
        <div className="flex items-center gap-2.5 rounded-md border border-sapay-neutral-100 bg-white px-3 py-2 transition focus-within:border-sapay-800 focus-within:ring-2 focus-within:ring-sapay-800/12">
          <Shield className="shrink-0 text-sapay-neutral-300" size={16} aria-hidden="true" />
          <select
            name="role"
            value={role}
            onChange={(event) => onRole(event.target.value as 'ADMIN' | 'RECEPTION' | '')}
            className="w-full bg-transparent text-[13px] outline-none text-[#7f7f7f]"
          >
            <option value="" disabled>
              Seleccione su rol
            </option>
            <option value="RECEPTION">Recepcionista</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
      </label>

      <button
        type="button"
        onClick={onForgot}
        className="block text-[12px] font-medium text-[#2a61d4] transition hover:opacity-80"
      >
        ¿Olvidaste tu contraseña?
      </button>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full rounded-sm bg-sapay-900 px-4 text-[13px] font-medium shadow-none transition hover:bg-sapay-850 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          <ArrowRight size={16} aria-hidden="true" />
          {isSubmitting ? 'Validando...' : 'Iniciar sesión'}
        </span>
      </Button>
    </>
  );
}