import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  authEvents,
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
} from '../../lib/api';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export type LoginStatus = {
  kind: 'success' | 'error';
  message: string;
};

export type LoginRole = 'ADMIN' | 'RECEPTION' | '';

// Arranque en desarrollo: NestJS tarda en compilar, así que la API puede
// no responder todavía. Se reintenta con pausas en lugar de fallar de una.
const RESTORE_MAX_ATTEMPTS = 5;
const RESTORE_RETRY_DELAY_MS = 2000;

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

// fetch lanza TypeError cuando no hay servidor escuchando; los errores con
// status son respuestas reales del backend y no se deben reintentar.
function isRetryable(error: unknown): boolean {
  return !(error instanceof ApiError);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useAuth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<LoginRole>('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerCc, setRegisterCc] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerAdminPassword, setRegisterAdminPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<LoginRole>('');
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

  useEffect(() => {
    const unsubscribeUnauthorized = authEvents.on('unauthorized', ({ reason }) => {
      handleLogout(reason);
    });

    const unsubscribeForbidden = authEvents.on('forbidden', ({ reason }) => {
      setStatus({ kind: 'error', message: reason });
    });

    return () => {
      unsubscribeUnauthorized();
      unsubscribeForbidden();
    };
  }, [handleLogout]);

  // 1) Al arrancar: si hay token guardado, validarlo contra la API.
  //    Además consulta si es el primer arranque (credenciales semilla).
  //    En desarrollo NestJS tarda en compilar, así que un fallo de conexión
  //    no invalida el token: se reintenta hasta RESTORE_MAX_ATTEMPTS veces.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      for (let attempt = 1; attempt <= RESTORE_MAX_ATTEMPTS; attempt += 1) {
        if (cancelled) {
          return;
        }

        try {
          const [token, firstRunInfo] = await Promise.all([
            Promise.resolve(getStoredToken()),
            firstRunRequest()
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

          const user = await meRequest();
          if (cancelled) {
            return;
          }
          setLoggedUser(user);
          setIsRestoringSession(false);
          return;
        } catch (error) {
          if (cancelled) {
            return;
          }

          // El servidor respondió y el token no sirve: se cierra la sesión.
          if (isUnauthorized(error)) {
            setStoredToken(null);
            setStatus({
              kind: 'error',
              message: 'Tu sesión anterior expiró. Inicia sesión nuevamente.'
            });
            setIsRestoringSession(false);
            return;
          }

          // La API todavía no está escuchando: reintentar sin tocar el token.
          if (isRetryable(error) && attempt < RESTORE_MAX_ATTEMPTS) {
            await wait(RESTORE_RETRY_DELAY_MS);
            continue;
          }

          setStatus({
            kind: 'error',
            message:
              'No se pudo conectar con la API. Verifica que el backend esté ejecutándose.'
          });
          setIsRestoringSession(false);
          return;
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

  function continueFromFirstRun(cc: string): void {
    setLoginIdentifier(cc);
    setLoginPassword('');
    setLoginRole('ADMIN');
    setFirstRun(null);
  }

  return {
    mode,
    setMode,
    showPassword,
    setShowPassword,
    login: {
      identifier: loginIdentifier,
      setIdentifier: setLoginIdentifier,
      password: loginPassword,
      setPassword: setLoginPassword,
      role: loginRole,
      setRole: setLoginRole
    },
    register: {
      fullName: registerFullName,
      setFullName: setRegisterFullName,
      cc: registerCc,
      setCc: setRegisterCc,
      email: registerEmail,
      setEmail: setRegisterEmail,
      phone: registerPhone,
      setPhone: setRegisterPhone,
      password: registerPassword,
      setPassword: setRegisterPassword,
      confirmPassword: registerConfirmPassword,
      setConfirmPassword: setRegisterConfirmPassword,
      adminPassword: registerAdminPassword,
      setAdminPassword: setRegisterAdminPassword,
      role: registerRole,
      setRole: setRegisterRole
    },
    forgot: {
      email: forgotEmail,
      setEmail: setForgotEmail
    },
    reset: {
      email: resetEmail,
      setEmail: setResetEmail,
      code: resetCode,
      setCode: setResetCode,
      newPassword: resetNewPassword,
      setNewPassword: setResetNewPassword,
      confirmPassword: resetConfirmPassword,
      setConfirmPassword: setResetConfirmPassword
    },
    status,
    isSubmitting,
    isRestoringSession,
    isLoggingOut,
    loggedUser,
    firstRun,
    handleSubmit,
    handleAccessCardClick,
    handleLogout,
    continueFromFirstRun,
    clearStatus: () => setStatus(null)
  };
}