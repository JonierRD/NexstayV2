import { CalendarCheck2, CalendarClock, CalendarDays, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import bedBanner from '../../assets/dashboard/cama3.png';

interface ReservasHeaderProps {
  totalReservas: number;
  activas: number;
  llegadasHoy: number;
}

export function ReservasHeader({ totalReservas, activas, llegadasHoy }: ReservasHeaderProps): ReactElement {
  return (
    <header
      className="relative isolate flex min-h-[92px] shrink-0 items-center overflow-hidden rounded-xl border border-sapay-700/50 px-4 py-2.5 text-white shadow-sm"
      style={{ backgroundColor: 'hsl(var(--sapay-950-solid))' }}
    >
      <img
        src={bedBanner}
        alt="Habitación del hotel"
        className="absolute inset-y-0 right-0 -z-20 h-full w-[52%] object-cover object-center"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(90deg, hsl(var(--sapay-950-solid)) 0%, hsl(var(--sapay-950-solid) / 0.96) 48%, hsl(var(--sapay-950-solid) / 0.28) 100%)'
        }}
      />
      <div className="relative z-10 flex w-full flex-wrap items-center gap-4">
        <div className="module-header-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <CalendarDays size={25} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white">Módulo de Reservas</h1>
          <p className="text-[11px] text-white/85">
            Calendario de ocupación, control de fechas reservadas y anticipos.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Metric icon={ShieldCheck} label="Reservas activas" value={activas} />
          <Metric icon={CalendarClock} label="Llegadas hoy" value={llegadasHoy} />
          <Metric icon={CalendarCheck2} label="Total registradas" value={totalReservas} />
        </div>
      </div>
    </header>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
}): ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-sapay-950/35 px-3 py-2 backdrop-blur-sm sm:px-4">
      <Icon size={18} />
      <span className="text-[10px] text-white/85">
        {label}
        <strong className="block text-sm text-white">{value}</strong>
      </span>
    </div>
  );
}

