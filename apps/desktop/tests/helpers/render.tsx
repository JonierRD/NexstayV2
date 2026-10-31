import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import type { PublicUser } from '@/lib/api/auth';

type Options = RenderOptions & {
  user?: PublicUser | null;
  isRestoringSession?: boolean;
};

/**
 * Renderiza un componente dentro del AuthProvider con un usuario controlado.
 * Usalo en pruebas de componentes que llaman useOptionalAuthSession/usePermissions.
 */
export function renderWithAuth(
  ui: ReactElement,
  { user = null, isRestoringSession = false, ...options }: Options = {}
) {
  return render(
    <AuthProvider initialUser={user} isRestoringSession={isRestoringSession}>
      {ui}
    </AuthProvider>,
    options
  );
}

export { render, screen, within, waitFor, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
