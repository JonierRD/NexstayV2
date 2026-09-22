import { ArrowLeft, ShieldAlert } from 'lucide-react';
import type { ReactElement } from 'react';

type ForbiddenPageProps = {
	moduleTitle: string;
	onNavigateHome: () => void;
};

export function ForbiddenPage({ moduleTitle, onNavigateHome }: ForbiddenPageProps): ReactElement {
	return (
		<section className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250 p-6">
			<div className="max-w-sm text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
					<ShieldAlert size={26} aria-hidden="true" />
				</div>
				<p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-danger-600">Error 403</p>
				<h1 className="mt-2 text-lg font-semibold text-sapay-950">Acceso denegado</h1>
				<p className="mt-2 text-xs leading-5 text-sapay-700">
					Tu rol no tiene permisos para acceder a {moduleTitle}.
				</p>
				<button
					type="button"
					onClick={onNavigateHome}
					className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sapay-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sapay-800"
				>
					<ArrowLeft size={14} aria-hidden="true" />
					Volver a recepción
				</button>
			</div>
		</section>
	);
}