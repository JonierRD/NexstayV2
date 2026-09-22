import type { ReactElement, ReactNode } from 'react';
import type { PublicUser } from '../lib/api';
import { useAuthSession } from '../context/AuthContext';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { moduleRoutes } from './moduleRoutes';
import { hasRole, type Role } from './roles';
import type { ModuleKey } from './types';

type RouteGuardProps = {
	activeModule: ModuleKey | string;
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
	const route = moduleRoutes.find((candidate) => candidate.key === activeModule);

	if (!route) {
		return <NotFoundPage onNavigateHome={onNavigateHome} />;
	}

	if (route.meta.isPublic) {
		return <>{children}</>;
	}

	if (!effectiveUser) {
		return <ForbiddenPage moduleTitle={route.meta.title} onNavigateHome={onNavigateHome} />;
	}

	const userRole = effectiveUser.role as Role;
	const hasPermission = route.meta.roles?.some((requiredRole) => hasRole(userRole, requiredRole)) ?? true;

	if (!hasPermission) {
		return <ForbiddenPage moduleTitle={route.meta.title} onNavigateHome={onNavigateHome} />;
	}

	return <>{children}</>;
}