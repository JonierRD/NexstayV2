import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  authEvents,
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resetPasswordRequest,
  setStoredToken
} from '../../lib/api';
import { useSessionRestore } from './useSessionRestore';
import { type AuthMode, type LoginRole, type LoginStatus } from './types';

export type { AuthMode, LoginRole, LoginStatus };

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { loggedUser, setUser: setLoggedUser, firstRun, isRestoringSession, restoreError, clearFirstRun } =
    useSessionRestore();

  // useSessionRestore no toca `status` (no lo necesita); este estado especial muestra
  // sus mensajes y se limpia al primer cambio de pantalla.
  const visibleStatus = status ?? restoreError;

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

  // 1) La restauración de sesión vive en useSessionRestore (con sus reintentos).

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
          role: loginRole as 'ADMIN' | 'RECEPTION' | 'CLEANING'
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
          role: registerRole as 'ADMIN' | 'RECEPTION' | 'CLEANING',
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

  function handleAccessCardClick(selectedRole: 'ADMIN' | 'RECEPTION' | 'CLEANING'): void {
    setMode('register');
    setRegisterRole(selectedRole);
    setStatus(null);
  }

  function continueFromFirstRun(cc: string): void {
    setLoginIdentifier(cc);
    setLoginPassword('');
    setLoginRole('ADMIN');
    clearFirstRun();
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
    status: visibleStatus,
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