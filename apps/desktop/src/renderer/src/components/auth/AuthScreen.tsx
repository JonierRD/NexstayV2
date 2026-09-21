import { Shield, UsersRound } from 'lucide-react';
import FondoLogin from '../../assets/login/FondoLogin.png';
import Logo from '../../assets/login/Logo.png';
import { LoadingOverlay } from '../LoadingOverlay';
import { ForgotFields } from './ForgotFields';
import { LoginFields } from './LoginFields';
import { RegisterFields } from './RegisterFields';
import { ResetFields } from './ResetFields';
import { type useAuth } from './useAuth';

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

export function AuthScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const mode = auth.mode;

  const goToLogin = () => {
    auth.setMode('login');
    auth.clearStatus();
  };

  const showAccessCards = mode === 'login' || mode === 'register';

  return (
    <main className="relative h-screen overflow-hidden text-foreground">
      {auth.isSubmitting && <LoadingOverlay message={
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
            <p className="-mt-1 text-[13px] font-semibold uppercase tracking-[0.24em] text-sapay-1000">
              - HOTEL-
            </p>
            <h2 className="mt-3 text-[20px] font-semibold tracking-tight text-sapay-1000">
              {mode === 'login'
                ? 'Bienvenido a SAPAY'
                : mode === 'register'
                  ? auth.register.role === 'ADMIN'
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
              <p className="mt-2 text-[11px] font-medium text-sapay-900">
                Para registrar un usuario debes ingresar la contraseña de un administrador activo.
              </p>
            ) : null}
          </div>

          <form className="mt-4 space-y-3.5" onSubmit={auth.handleSubmit}>
            {auth.status ? (
              <div
                className={`rounded-md border px-3 py-2 text-[12px] ${
                  auth.status.kind === 'success'
                    ? 'border-[#bfe4c9] bg-[#eef9f1] text-success'
                    : 'border-danger-200 bg-danger-100 text-[#b33a3a]'
                }`}
              >
                {auth.status.message}
              </div>
            ) : null}

            {mode === 'login' ? (
              <LoginFields
                identifier={auth.login.identifier}
                onIdentifier={auth.login.setIdentifier}
                password={auth.login.password}
                onPassword={auth.login.setPassword}
                role={auth.login.role}
                onRole={auth.login.setRole}
                showPassword={auth.showPassword}
                onTogglePassword={() => auth.setShowPassword((current) => !current)}
                isSubmitting={auth.isSubmitting}
                onForgot={() => {
                  auth.setMode('forgot-password');
                  auth.clearStatus();
                }}
              />
            ) : mode === 'register' ? (
              <RegisterFields
                fullName={auth.register.fullName}
                onFullName={auth.register.setFullName}
                cc={auth.register.cc}
                onCc={auth.register.setCc}
                email={auth.register.email}
                onEmail={auth.register.setEmail}
                phone={auth.register.phone}
                onPhone={auth.register.setPhone}
                password={auth.register.password}
                onPassword={auth.register.setPassword}
                confirmPassword={auth.register.confirmPassword}
                onConfirmPassword={auth.register.setConfirmPassword}
                adminPassword={auth.register.adminPassword}
                onAdminPassword={auth.register.setAdminPassword}
                showPassword={auth.showPassword}
                onTogglePassword={() => auth.setShowPassword((current) => !current)}
                isSubmitting={auth.isSubmitting}
                onBack={goToLogin}
              />
            ) : mode === 'forgot-password' ? (
              <ForgotFields
                email={auth.forgot.email}
                onEmail={auth.forgot.setEmail}
                isSubmitting={auth.isSubmitting}
                onBack={goToLogin}
              />
            ) : (
              <ResetFields
                code={auth.reset.code}
                onCode={auth.reset.setCode}
                newPassword={auth.reset.newPassword}
                onNewPassword={auth.reset.setNewPassword}
                confirmPassword={auth.reset.confirmPassword}
                onConfirmPassword={auth.reset.setConfirmPassword}
                showPassword={auth.showPassword}
                onTogglePassword={() => auth.setShowPassword((current) => !current)}
                isSubmitting={auth.isSubmitting}
                onBack={goToLogin}
              />
            )}
          </form>

          {showAccessCards ? (
            <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.38em] text-[#9d9d9d]">
              <span className="h-px flex-1 bg-[#e5e5e5]" />
              <span>o</span>
              <span className="h-px flex-1 bg-[#e5e5e5]" />
            </div>
          ) : null}

          {showAccessCards ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {accessCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => auth.handleAccessCardClick(card.role)}
                  className={`rounded-md border bg-white px-3 py-3 text-left transition hover:border-[#bcbcbc] hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)] ${
                    (mode === 'login' ? auth.login.role : auth.register.role) === card.role
                      ? 'border-sapay-900 ring-1 ring-sapay-900/20'
                      : 'border-[#dcdcdc]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        card.title === 'Recepcionista' ? 'bg-[#f3c331]' : 'bg-sapay-900'
                      }`}
                    >
                      <card.icon
                        className={card.title === 'Recepcionista' ? 'text-sapay-1000' : 'text-white'}
                        size={17}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-sapay-1000">{card.title}</h3>
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