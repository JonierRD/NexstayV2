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
        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Usuario</span>
        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
          <UserRound className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
          <input
            type="text"
            name="user"
            placeholder="Ingresa tu usuario"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
            autoComplete="username"
            value={identifier}
            onChange={(event) => onIdentifier(event.target.value)}
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Contraseña</span>
        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
          <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Ingresa tu contraseña"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPassword(event.target.value)}
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
        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Rol</span>
        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
          <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
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
        className="h-10 w-full rounded-sm bg-[#4b2b21] px-4 text-[13px] font-medium shadow-none transition hover:bg-[#5a3429] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-center gap-2">
          <ArrowRight size={16} aria-hidden="true" />
          {isSubmitting ? 'Validando...' : 'Iniciar sesión'}
        </span>
      </Button>
    </>
  );
}