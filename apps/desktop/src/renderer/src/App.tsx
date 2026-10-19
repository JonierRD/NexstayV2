import { type ReactElement, useEffect, useState } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { FirstRunScreen } from './components/auth/FirstRunScreen';
import { useAuth } from './components/auth/useAuth';
import { DashboardLayout } from './components/layout';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { applyAuthInterceptors } from './lib/api';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';

export function App(): ReactElement {
  const auth = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    applyAuthInterceptors();
  }, []);

  const content = (() => {
    if (auth.firstRun?.pending && auth.firstRun.admin) {
      return <FirstRunScreen admin={auth.firstRun.admin} onContinue={auth.continueFromFirstRun} />;
    }

    if (auth.loggedUser) {
      return (
        <>
          {auth.isLoggingOut && <LoadingOverlay message="Cerrando sesión..." />}
          <DashboardLayout
            user={auth.loggedUser}
            onLogout={() => auth.handleLogout()}
          />
        </>
      );
    }

    return showLanding ? (
      <LandingPage onLogin={() => setShowLanding(false)} />
    ) : (
      <AuthScreen auth={auth} onBack={() => setShowLanding(true)} />
    );
  })();

  return (
        <AuthProvider
            initialUser={auth.loggedUser ?? null}
            isRestoringSession={auth.isRestoringSession}
        >
            {content}
        </AuthProvider>
    );
}