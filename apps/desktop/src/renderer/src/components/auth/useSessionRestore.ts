import { useEffect, useState } from 'react';
import {
  ApiError,
  firstRunRequest,
  getStoredToken,
  meRequest,
  setStoredToken,
  type FirstRunInfo,
  type PublicUser
} from '../../lib/api';
import { type LoginStatus } from './types';

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

export type SessionRestore = {
  loggedUser: PublicUser | null;
  firstRun: FirstRunInfo | null;
  isRestoringSession: boolean;
  /** Mensaje de expiración o de API caída, para mostrarlo en la pantalla de login. */
  restoreError: LoginStatus | null;
  /** Asigna el usuario tras un login/registro exitoso. */
  setUser: (user: PublicUser | null) => void;
  expireSession: () => void;
  clearFirstRun: () => void;
};

/**
 * Al arrancar: si hay token guardado, validarlo contra la API.
 * Además consulta si es el primer arranque (credenciales semilla).
 * En desarrollo NestJS tarda en compilar, así que un fallo de conexión
 * no invalida el token: se reintenta hasta RESTORE_MAX_ATTEMPTS veces.
 */
export function useSessionRestore(): SessionRestore {
  const [loggedUser, setLoggedUser] = useState<PublicUser | null>(null);
  const [firstRun, setFirstRun] = useState<FirstRunInfo | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restoreError, setRestoreError] = useState<LoginStatus | null>(null);

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
            setLoggedUser(null);
            setRestoreError({
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

          setRestoreError({
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

  function clearFirstRun(): void {
    setFirstRun(null);
  }

  return {
    loggedUser,
    firstRun,
    isRestoringSession,
    restoreError,
    setUser: setLoggedUser,
    expireSession: () => setLoggedUser(null),
    clearFirstRun
  };
}