import { type ReactElement, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { FirstRunScreen } from './components/auth/FirstRunScreen';
import { useAuth } from './components/auth/useAuth';
import { DashboardLayout } from './components/DashboardLayout';
import { LoadingOverlay } from './components/LoadingOverlay';
import { applyAuthInterceptors } from './lib/api';
import { AuthProvider } from './context/AuthContext';

export function App(): ReactElement {
  const auth = useAuth();

  useEffect(() => {
    applyAuthInterceptors();
  }, []);

  const content = (() => {
    if (auth.isRestoringSession) {
      return (
        <main className="relative flex h-screen items-center justify-center bg-[#1a0e09] text-white">
          <p className="text-sm tracking-[0.18em] uppercase opacity-70">Verificando sesión...</p>
        </main>
      );
    }

    if (auth.firstRun?.pending && auth.firstRun.admin) {
      return <FirstRunScreen admin={auth.firstRun.admin} onContinue={auth.continueFromFirstRun} />;
    }

    if (auth.loggedUser) {
      return (
        <>
          {auth.isLoggingOut && <LoadingOverlay message="Cerrando sesión..." />}
          <DashboardLayout user={auth.loggedUser} onLogout={() => auth.handleLogout()} />
        </>
      );
    }

    return <AuthScreen auth={auth} />;
  })();

  return <AuthProvider initialUser={auth.loggedUser ?? null}>{content}</AuthProvider>;
}