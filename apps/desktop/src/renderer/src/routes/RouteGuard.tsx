import type { ReactElement, ReactNode } from 'react';
import type { PublicUser } from '../lib/api';
import { useAuthSession } from '../context/AuthContext';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { findRoute, isRouteAllowed } from './routeAccess';
import { type Role } from './roles';

type RouteGuardProps = {
	activeModule: string;
	user?: PublicUser | null;
	children: ReactNode;
	onNavigateHome: () => void;
};

export function RouteGuard({
	activeModule,
	user,
	children,
	onNavigateHome
}: RouteGuardProps): ReactElement {
	const { user: sessionUser } = useAuthSession();
	const effectiveUser = user ?? sessionUser;
	const route = findRoute(activeModule);

	if (!route) {
		return <NotFoundPage onNavigateHome={onNavigateHome} />;
	}

	if (route.meta.isPublic) {
		return <>{children}</>;
	}

	if (!effectiveUser) {
		return <ForbiddenPage moduleTitle={route.meta.title} onNavigateHome={onNavigateHome} />;
	}

	if (!isRouteAllowed(effectiveUser.role as Role, route)) {
		return <ForbiddenPage moduleTitle={route.meta.title} onNavigateHome={onNavigateHome} />;
	}

	return <>{children}</>;
}
