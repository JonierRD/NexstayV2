import { type LucideIcon } from 'lucide-react';
import { type ReactElement } from 'react';

export type ModuleHeaderMetric = {
  label: string;
  value: number | string;
  icon: LucideIcon;
};

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  metrics: ModuleHeaderMetric[];
};

export function ModuleHeader({ icon: Icon, title, subtitle, metrics }: Props): ReactElement {
  return (
    <div className="module-header relative min-h-[108px] overflow-hidden rounded-xl border px-5 py-4 shadow-sm">
      <div className="relative z-10 flex flex-wrap items-center gap-4">
        <div className="module-header-icon flex h-12 w-12 items-center justify-center rounded-2xl">
          <Icon size={25} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-[11px] text-white/85">{subtitle}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {metrics.map(({ label, value, icon: MetricIcon }) => (
            <div key={label} className="module-header-metric flex items-center gap-2 rounded-xl border px-4 py-2">
              <MetricIcon size={18} />
              <span className="text-[10px] text-white/85">{label}<strong className="block text-sm text-white">{value}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
