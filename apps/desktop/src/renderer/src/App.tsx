import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  Shield,
  Sparkles,
  UserRound,
  UsersRound
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from 'react';
import FondoLogin from './assets/login/FondoLogin.png';
import Logo from './assets/login/Logo.png';
import { Button } from './components/ui/button';
import { DashboardLayout } from './components/DashboardLayout';
import { LoadingOverlay } from './components/LoadingOverlay';
import {
  ApiError,
  firstRunRequest,
  forgotPasswordRequest,
  getStoredToken,
  loginRequest,
  meRequest,
  registerRequest,
  resetPasswordRequest,
  setStoredToken,
  type FirstRunInfo,
  type PublicUser
} from './lib/api';

const accessCards = [
  {
    icon: UsersRound,
    title: 'Recepcionista',
    role: 'RECEPTION' as const,
    description: 'Registrar recepcionista.'
  },
  {
    icon: Shield,
    title: 'Administrador',
    role: 'ADMIN' as const,
    description: 'Registrar administrador.'
  }
];

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

type LoginStatus = {
  kind: 'success' | 'error';
  message: string;
};

export function App(): ReactElement {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'ADMIN' | 'RECEPTION' | ''>('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerCc, setRegisterCc] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerAdminPassword, setRegisterAdminPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'ADMIN' | 'RECEPTION' | ''>('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [status, setStatus] = useState<LoginStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [loggedUser, setLoggedUser] = useState<PublicUser | null>(null);
  const [firstRun, setFirstRun] = useState<FirstRunInfo | null>(null);
  const [hasCopiedCredentials, setHasCopiedCredentials] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback((message?: string): void => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setLoggedUser(null);
      setMode('login');
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginRole('');
      setRegisterFullName('');
      setRegisterCc('');
      setRegisterEmail('');
      setRegisterPhone('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterAdminPassword('');
      setRegisterRole('');
      setForgotEmail('');
      setResetEmail('');
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setStoredToken(null);
      setIsLoggingOut(false);
      setStatus(
        message
          ? {
              kind: 'error',
              message
            }
          : null
      );
    }, 600);
  }, []);

  // 1) Al arrancar: si hay token guardado, validarlo contra la API.
  //    Además consulta si es el primer arranque (credenciales semilla).
  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      const [token, firstRunInfo] = await Promise.all([
        Promise.resolve(getStoredToken()),
        firstRunRequest().catch(() => ({ pending: false } as FirstRunInfo))
      ]);

      if (cancelled) {
        return;
      }

      if (firstRunInfo.pending) {
        setFirstRun(firstRunInfo);
        setIsRestoringSession(false);
        return;
      }

      if (!token) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const user = await meRequest();
        if (cancelled) {
          return;
        }
        setLoggedUser(user);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setStoredToken(null);
        const message =
          error instanceof ApiError
            ? 'Tu sesión anterior expiró. Inicia sesión nuevamente.'
            : 'No se pudo verificar la sesión anterior.';
        setStatus({ kind: 'error', message });
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (mode === 'login') {
      if (!loginIdentifier.trim() || !loginPassword || !loginRole) {
        setStatus({
          kind: 'error',
          message: 'Completa usuario, contraseña y rol antes de iniciar sesión.'
        });
        return;
      }
    } else if (mode === 'register') {
      if (
        !registerFullName.trim() ||
        !registerCc.trim() ||
        !registerEmail.trim() ||
        !registerPassword ||
        !registerConfirmPassword ||
        !registerRole
      ) {
        setStatus({
          kind: 'error',
          message: 'Completa todos los campos obligatorios para registrarte.'
        });
        return;
      }

      if (registerPassword !== registerConfirmPassword) {
        setStatus({
          kind: 'error',
          message: 'Las contraseñas no coinciden.'
        });
        return;
      }

      if (!registerAdminPassword.trim()) {
        setStatus({
          kind: 'error',
          message:
            'Ingresa la contraseña de un administrador activo para autorizar el registro.'
        });
        return;
      }
    } else if (mode === 'forgot-password') {
      if (!forgotEmail.trim()) {
        setStatus({ kind: 'error', message: 'Ingresa tu correo electrónico.' });
        return;
      }
    } else if (mode === 'reset-password') {
      if (!resetCode.trim() || !resetNewPassword || !resetConfirmPassword) {
        setStatus({ kind: 'error', message: 'Completa todos los campos.' });
        return;
      }
      if (resetNewPassword !== resetConfirmPassword) {
        setStatus({ kind: 'error', message: 'Las contraseñas no coinciden.' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setStatus(null);

      if (mode === 'login') {
        const result = await loginRequest({
          identifier: loginIdentifier,
          password: loginPassword,
          role: loginRole as 'ADMIN' | 'RECEPTION'
        });
        setStoredToken(result.token);
        setLoggedUser(result.user);
        setStatus({ kind: 'success', message: `Bienvenido, ${result.user.fullName}.` });
        return;
      }

      if (mode === 'register') {
        const result = await registerRequest({
          fullName: registerFullName,
          cc: registerCc,
          email: registerEmail,
          phone: registerPhone,
          password: registerPassword,
          confirmPassword: registerConfirmPassword,
          role: registerRole as 'ADMIN' | 'RECEPTION',
          adminPassword: registerAdminPassword
        });
        setStoredToken(result.token);
        setLoggedUser(result.user);
        setStatus({
          kind: 'success',
          message: `Usuario ${result.user.fullName} registrado correctamente.`
        });
        return;
      }

      if (mode === 'forgot-password') {
        const { message } = await forgotPasswordRequest(forgotEmail);
        setResetEmail(forgotEmail);
        setForgotEmail('');
        setMode('reset-password');
        setStatus({ kind: 'success', message });
        return;
      }

      const { message } = await resetPasswordRequest({
        email: resetEmail,
        code: resetCode,
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword
      });
      setMode('login');
      setResetEmail('');
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setStatus({ kind: 'success', message });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo conectar con la API. Verifica que el backend esté ejecutándose.';
      setStatus({ kind: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAccessCardClick(selectedRole: 'ADMIN' | 'RECEPTION'): void {
    setMode('register');
    setRegisterRole(selectedRole);
    setStatus(null);
  }

  if (isRestoringSession) {
    return (
      <main className="relative flex h-screen items-center justify-center bg-[#1a0e09] text-white">
        <p className="text-sm tracking-[0.18em] uppercase opacity-70">Verificando sesión...</p>
      </main>
    );
  }

  if (firstRun?.pending && firstRun.admin) {
    const admin = firstRun.admin;
    const copyCommand = async (): Promise<void> => {
      const text = `Usuario: ${admin.email}\nCédula: ${admin.cc}\nContraseña temporal: ${admin.temporaryPassword}`;
      try {
        await navigator.clipboard.writeText(text);
        setHasCopiedCredentials(true);
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
                  {hasCopiedCredentials ? 'Copiado' : 'Copiar'}
                </span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (firstRun?.admin) {
                    setLoginIdentifier(firstRun.admin.cc);
                    setLoginPassword('');
                    setLoginRole('ADMIN');
                  }
                  setFirstRun(null);
                  setHasCopiedCredentials(false);
                }}
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

  if (loggedUser) {
    return (
      <>
        {isLoggingOut && <LoadingOverlay message="Cerrando sesión..." />}
        <DashboardLayout user={loggedUser} onLogout={() => handleLogout()} />
      </>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden text-foreground">
      {isSubmitting && <LoadingOverlay message={
        mode === 'login' ? 'Iniciando sesión...' :
        mode === 'register' ? 'Registrando usuario...' :
        mode === 'forgot-password' ? 'Enviando código...' :
        'Restableciendo contraseña...'
      } />}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${FondoLogin})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,14,10,0.62),rgba(24,14,10,0.22)_48%,rgba(255,255,255,0.08))]" />

      <section className="relative z-10 flex h-full items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/75 bg-white px-6 py-5 text-foreground shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:px-7 sm:py-6">
          <div className="flex flex-col items-center text-center">
                <img src={Logo} alt="SAPAY Hotel" className="h-[102px] w-[102px] object-contain" />
                <p className="-mt-1 text-[13px] font-semibold uppercase tracking-[0.24em] text-[#24140f]">
                  - HOTEL-
                </p>
                <h2 className="mt-3 text-[20px] font-semibold tracking-tight text-[#24140f]">
                  {mode === 'login'
                    ? 'Bienvenido a SAPAY'
                    : mode === 'register'
                      ? registerRole === 'ADMIN'
                        ? 'Registro de administrador'
                        : 'Registro de recepcionista'
                      : mode === 'forgot-password'
                        ? 'Restablecer contraseña'
                        : 'Nueva contraseña'}
                </h2>
                <p className="mt-1 text-[12px] text-[#7e7e7e]">
                  {mode === 'login'
                    ? 'Inicia sesión para continuar'
                    : mode === 'register'
                      ? 'Completa los datos para crear el usuario.'
                      : mode === 'forgot-password'
                        ? 'Te enviaremos un código a tu correo.'
                        : 'Ingresa el código y tu nueva contraseña.'}
                </p>
                {mode === 'register' ? (
                  <p className="mt-2 text-[11px] font-medium text-[#4b2b21]">
                    Para registrar un usuario debes ingresar la contraseña de un administrador activo.
                  </p>
                ) : null}
              </div>

              <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
                {status ? (
                  <div
                    className={`rounded-md border px-3 py-2 text-[12px] ${
                      status.kind === 'success'
                        ? 'border-[#bfe4c9] bg-[#eef9f1] text-[#2f8f4e]'
                        : 'border-[#f1c2c2] bg-[#fff0f0] text-[#b33a3a]'
                    }`}
                  >
                    {status.message}
                  </div>
                ) : null}

                {mode === 'login' ? (
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
                          value={loginIdentifier}
                          onChange={(event) => setLoginIdentifier(event.target.value)}
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
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
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
                          value={loginRole}
                          onChange={(event) => setLoginRole(event.target.value as 'ADMIN' | 'RECEPTION' | '')}
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
                      onClick={() => { setMode('forgot-password'); setStatus(null); }}
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
                ) : mode === 'register' ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">
                          Nombre completo
                        </span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <UserRound className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type="text"
                            name="fullName"
                            placeholder="Ingresa el nombre completo"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            autoComplete="name"
                            value={registerFullName}
                            onChange={(event) => setRegisterFullName(event.target.value)}
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Cédula</span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type="text"
                            name="cc"
                            placeholder="Cédula"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            value={registerCc}
                            onChange={(event) => setRegisterCc(event.target.value)}
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Correo</span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type="email"
                            name="email"
                            placeholder="correo@ejemplo.com"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            autoComplete="email"
                            value={registerEmail}
                            onChange={(event) => setRegisterEmail(event.target.value)}
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Teléfono</span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <Shield className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type="text"
                            name="phone"
                            placeholder="Opcional"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            value={registerPhone}
                            onChange={(event) => setRegisterPhone(event.target.value)}
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">Contraseña</span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="registerPassword"
                            placeholder="Crear contraseña"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            autoComplete="new-password"
                            value={registerPassword}
                            onChange={(event) => setRegisterPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="shrink-0 text-[#7f7f7f] transition hover:text-[#4b2b21]"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">
                          Confirmar contraseña
                        </span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="registerConfirmPassword"
                            placeholder="Repite la contraseña"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            autoComplete="new-password"
                            value={registerConfirmPassword}
                            onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[13px] font-medium text-[#24140f]">
                          Contraseña de administrador
                        </span>
                        <div className="flex items-center gap-2.5 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 transition focus-within:border-[#6b3a2d] focus-within:ring-2 focus-within:ring-[#6b3a2d]/12">
                          <LockKeyhole className="shrink-0 text-[#8b8b8b]" size={16} aria-hidden="true" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="adminPassword"
                            placeholder="Contraseña del administrador"
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
                            autoComplete="current-password"
                            value={registerAdminPassword}
                            onChange={(event) => setRegisterAdminPassword(event.target.value)}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1 text-[12px]">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
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
                      className="h-10 w-full rounded-sm bg-[#4b2b21] px-4 text-[13px] font-medium shadow-none transition hover:bg-[#5a3429] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ArrowRight size={16} aria-hidden="true" />
                        {isSubmitting ? 'Registrando...' : 'Registrar usuario'}
                      </span>
                    </Button>
                  </>
                ) : mode === 'forgot-password' ? (
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
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                        />
                      </div>
                    </label>

                    <div className="flex items-center justify-between gap-3 pt-1 text-[12px]">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setStatus(null); }}
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
                ) : (
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
                            value={resetCode}
                            onChange={(event) => setResetCode(event.target.value)}
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
                            value={resetNewPassword}
                            onChange={(event) => setResetNewPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
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
                            value={resetConfirmPassword}
                            onChange={(event) => setResetConfirmPassword(event.target.value)}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1 text-[12px]">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setStatus(null); }}
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
                )}
              </form>

              {mode === 'login' || mode === 'register' ? (
                <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.38em] text-[#9d9d9d]">
                  <span className="h-px flex-1 bg-[#e5e5e5]" />
                  <span>o</span>
                  <span className="h-px flex-1 bg-[#e5e5e5]" />
                </div>
              ) : null}

              {mode === 'login' || mode === 'register' ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {accessCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => handleAccessCardClick(card.role)}
                    className={`rounded-md border bg-white px-3 py-3 text-left transition hover:border-[#bcbcbc] hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)] ${
                      (mode === 'login' ? loginRole : registerRole) === card.role
                        ? 'border-[#4b2b21] ring-1 ring-[#4b2b21]/20'
                        : 'border-[#dcdcdc]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          card.title === 'Recepcionista' ? 'bg-[#f3c331]' : 'bg-[#4b2b21]'
                        }`}
                      >
                        <card.icon
                          className={card.title === 'Recepcionista' ? 'text-[#24140f]' : 'text-white'}
                          size={17}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-[#24140f]">{card.title}</h3>
                        <p className="mt-0.5 text-[10px] leading-4 text-[#474747]">{card.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              ) : null}
        </div>
      </section>
    </main>
  );
}
