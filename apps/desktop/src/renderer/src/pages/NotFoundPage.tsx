import { ArrowLeft, FileQuestion } from 'lucide-react';
import type { ReactElement } from 'react';

type NotFoundPageProps = {
	onNavigateHome: () => void;
};

export function NotFoundPage({ onNavigateHome }: NotFoundPageProps): ReactElement {
	return (
		<section className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250 p-6">
			<div className="max-w-sm text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-700">
					<FileQuestion size={26} aria-hidden="true" />
				</div>
				<p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-700">Error 404</p>
				<h1 className="mt-2 text-lg font-semibold text-sapay-950">Módulo no encontrado</h1>
				<p className="mt-2 text-xs leading-5 text-sapay-700">
					El módulo solicitado no existe o ya no está disponible.
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