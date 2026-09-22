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