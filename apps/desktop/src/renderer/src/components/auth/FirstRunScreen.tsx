import { ArrowRight, Copy, Sparkles } from 'lucide-react';
import { useState } from 'react';
import FondoLogin from '../../assets/login/FondoLogin.png';
import { type FirstRunInfo } from '../../lib/api';
import { Button } from '../ui/button';

export function FirstRunScreen({
  admin,
  onContinue
}: {
  admin: NonNullable<FirstRunInfo['admin']>;
  onContinue: (cc: string) => void;
}) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyCommand = async (): Promise<void> => {
    const text = `Usuario: ${admin.email}\nCédula: ${admin.cc}\nContraseña temporal: ${admin.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
    } catch {
      // ignore
    }
  };

  return (
    <main className="relative h-screen overflow-hidden text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${FondoLogin})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,14,10,0.7),rgba(24,14,10,0.3))]" />

      <section className="relative z-10 flex h-full items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/75 bg-white px-7 py-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <Sparkles className="text-[#4b2b21]" size={36} aria-hidden="true" />
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#4b2b21]">
              SAPAY Hotel
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-[#24140f]">
              Bienvenido, primer arranque
            </h2>
            <p className="mt-2 text-[12px] text-[#5e5e5e]">
              Guardá estas credenciales en un lugar seguro.
              Son las del administrador inicial del sistema.
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-[#e5d6c9] bg-[#fbf5ef] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6a55]">
              Administrador inicial
            </p>
            <dl className="mt-3 space-y-1.5 text-[13px] text-[#24140f]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#7e7e7e]">Nombre</dt>
                <dd className="font-medium text-right">{admin.fullName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7e7e7e]">Cédula</dt>
                <dd className="font-medium">{admin.cc}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7e7e7e]">Usuario</dt>
                <dd className="font-medium">{admin.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7e7e7e]">Contraseña</dt>
                <dd className="select-all font-mono font-semibold text-[#4b2b21]">
                  {admin.temporaryPassword}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-4 text-[11px] leading-4 text-[#7e7e7e]">
            Esta pantalla solo aparece una vez. Al iniciar sesión te recomendamos cambiar
            la contraseña. Podés registrar recepcionistas desde el panel de administración.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={copyCommand}
              className="h-10 rounded-sm border border-[#4b2b21] bg-white px-4 text-[13px] font-medium text-[#4b2b21] shadow-none transition hover:bg-[#f4ebe5]"
            >
              <span className="flex items-center justify-center gap-2">
                <Copy size={15} aria-hidden="true" />
                {hasCopied ? 'Copiado' : 'Copiar'}
              </span>
            </Button>
            <Button
              type="button"
              onClick={() => onContinue(admin.cc)}
              className="h-10 rounded-sm bg-[#4b2b21] px-4 text-[13px] font-medium shadow-none transition hover:bg-[#5a3429]"
            >
              <span className="flex items-center justify-center gap-2">
                <ArrowRight size={16} aria-hidden="true" />
                Entrar
              </span>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}