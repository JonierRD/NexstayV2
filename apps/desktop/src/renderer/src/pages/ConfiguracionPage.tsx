import {
  ArrowRight,
  BedDouble,
  Bot,
  Building2,
  Check,
  Moon,
  Package,
  Palette,
  ShieldCheck,
  Sun,
  X
} from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useRef,
  useState
} from 'react';
import { useSettings } from '../components/configuracion/useSettings';
import { UsuariosSection } from '../components/configuracion/UsuariosSection';
import type { PublicUser } from '../lib/api';
import { THEME_LABELS, type ThemeColor } from '../lib/theme';
import type { ModuleKey } from '../routes/types';
import { cn } from '../lib/utils';

type Props = {
  user: PublicUser;
  onNavigate?: (key: ModuleKey) => void;
};

type TabKey = 'generales' | 'usuarios';

const inputClass =
  'config-input w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs outline-none focus:border-sapay-600 focus:bg-white';

function Card({ title, description, children, className }: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <section className={cn('config-card rounded-2xl border border-sapay-450 bg-white p-5 shadow-[0_12px_30px_rgba(67,42,27,0.12)]', className)}>
      <h2 className="text-[13px] font-semibold text-sapay-950">{title}</h2>
      {description && <p className="mt-0.5 text-[10px] text-sapay-750">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children, className }: {
  label: string;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <label className={cn('block text-[11px] text-sapay-750', className)}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Switch({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-sapay-900' : 'bg-sapay-400'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

const THEME_SWATCH: Record<ThemeColor, string> = {
  cafe: 'theme-swatch theme-swatch-cafe',
  verde: 'theme-swatch theme-swatch-verde',
  azul: 'theme-swatch theme-swatch-azul'
};

export function ConfiguracionPage({ onNavigate }: Props): ReactElement {
  const s = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useTab();

  function handleLogoChange(file: File | undefined): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      s.setStatus({ kind: 'error', message: 'El logo debe ser una imagen.' });
      return;
    }
    if (file.size > 3_500_000) {
      s.setStatus({ kind: 'error', message: 'El logo no puede superar 3.5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        s.setHotel({ ...s.hotel, logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="config-page flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold">Configuración</h1>
          <p className="text-[10px] text-sapay-750">
            Datos del hotel, apariencia, políticas y usuarios del sistema.
          </p>
        </div>
        <div className="config-tabs flex rounded-xl border border-sapay-350 bg-white p-1">
          {(['generales', 'usuarios'] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-[11px] font-medium transition',
                tab === key ? 'bg-sapay-900 text-white shadow' : 'text-sapay-750 hover:text-sapay-950'
              )}
            >
              {key === 'generales' ? 'Generales' : 'Usuarios'}
            </button>
          ))}
        </div>
      </div>

      {s.status && (
        <div
          className={cn(
            'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
            s.status.kind === 'success'
              ? 'border-success-100 bg-success-50 text-[#2f8f4e]'
              : 'border-danger-200 bg-danger-100 text-[#b33a3a]'
          )}
        >
          <span>{s.status.message}</span>
          <button type="button" onClick={s.clearStatus} className="opacity-60 hover:opacity-100" aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
      )}

      {tab === 'generales' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card
            title="Datos del hotel"
            description="Información oficial que se muestra en recibos y reportes."
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Nombre del hotel *" className="md:col-span-2">
                <input
                  value={s.hotel.hotelName}
                  onChange={(e) => s.setHotel({ ...s.hotel, hotelName: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="NIT">
                <input
                  value={s.hotel.hotelNit}
                  onChange={(e) => s.setHotel({ ...s.hotel, hotelNit: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={s.hotel.hotelPhone}
                  onChange={(e) => s.setHotel({ ...s.hotel, hotelPhone: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Correo del hotel">
                <input
                  type="email"
                  value={s.hotel.hotelEmail}
                  onChange={(e) => s.setHotel({ ...s.hotel, hotelEmail: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Dirección" className="md:col-span-2">
                <input
                  value={s.hotel.hotelAddress}
                  onChange={(e) => s.setHotel({ ...s.hotel, hotelAddress: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <span className="text-[11px] text-sapay-750">Logo</span>
                <div className="mt-1 flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoChange(e.target.files?.[0])} />
                  {s.hotel.logoDataUrl ? (
                    <img src={s.hotel.logoDataUrl} alt="Logo del hotel" className="config-logo h-12 w-12 rounded-xl border border-sapay-350 bg-white object-contain p-1" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-sapay-400 bg-sapay-100 text-sapay-500">
                      <Building2 size={18} />
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="config-secondary-button rounded-lg border border-sapay-450 bg-white px-3 py-1.5 text-[11px] text-sapay-900 hover:bg-sapay-200">
                      {s.hotel.logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                    </button>
                    {s.hotel.logoDataUrl && (
                      <button type="button" onClick={() => s.setHotel({ ...s.hotel, logoDataUrl: '' })} className="config-danger-button rounded-lg border border-danger-200 bg-danger-50 px-3 py-1.5 text-[11px] text-[#b33a3a] hover:bg-danger-100">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={s.saving === 'hotel'}
                onClick={() => void s.saveHotel()}
                className="inline-flex h-9 items-center rounded-xl border border-sapay-900 bg-sapay-900 px-4 text-xs font-medium text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)] transition hover:bg-sapay-850 disabled:opacity-60"
              >
                {s.saving === 'hotel' ? 'Guardando...' : 'Guardar datos del hotel'}
              </button>
            </div>
          </Card>

          <Card
            title="Tema y apariencia"
            description="Color principal de la interfaz y modo claro u oscuro."
          >
            <div className="flex items-center gap-3">
              <Palette size={16} className="text-sapay-700" />
              <span className="text-xs font-medium text-sapay-900">Color de marca</span>
              <div className="ml-auto flex gap-2">
                {(Object.keys(THEME_LABELS) as ThemeColor[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    title={THEME_LABELS[theme]}
                    disabled={s.saving === 'apariencia'}
                    onClick={() => void s.saveAppearance({ themeColor: theme })}
                    className={cn(
                      'theme-choice flex h-9 items-center gap-1.5 rounded-xl border px-2 text-[11px] font-medium transition',
                      `theme-choice-${theme}`,
                      s.settings?.themeColor === theme
                        ? 'border-sapay-900 bg-sapay-100 text-sapay-900 ring-1 ring-sapay-900/30'
                        : 'border-sapay-350 bg-white text-sapay-750 hover:border-sapay-500'
                    )}
                  >
                    <span className={cn('h-4 w-4 rounded-full', THEME_SWATCH[theme])} />
                    <span className="hidden sm:inline">{THEME_LABELS[theme].split(' ')[0]}</span>
                    {s.settings?.themeColor === theme && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-sapay-350 bg-sapay-100 px-4 py-3">
              <div className="flex items-center gap-3">
                {s.settings?.darkMode ? <Moon size={16} className="text-sapay-700" /> : <Sun size={16} className="text-sapay-700" />}
                <div>
                  <p className="text-xs font-medium text-sapay-900">Modo oscuro</p>
                  <p className="text-[10px] text-sapay-750">Reduce la luminosidad de la interfaz.</p>
                </div>
              </div>
              <Switch checked={s.settings?.darkMode ?? false} onChange={(darkMode) => void s.saveAppearance({ darkMode })} disabled={s.saving === 'apariencia'} />
            </div>

          </Card>

          <Card
            title="Políticas del hotel"
            description="Reglas operativas de salida y cancelación."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora de check-in">
                <input
                  type="time"
                  value={s.checkinLimit}
                  onChange={(e) => s.setCheckinLimit(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Hora límite de salida (check-out)">
                <input
                  type="time"
                  value={s.checkoutLimit}
                  onChange={(e) => s.setCheckoutLimit(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Tolerancia de salida (min)">
                <input
                  type="number"
                  min={0}
                  value={s.checkoutTolerance}
                  onChange={(e) => s.setCheckoutTolerance(Math.max(0, Number(e.target.value) || 0))}
                  className={inputClass}
                />
              </Field>
              <Field label="Política de cancelación" className="col-span-2">
                <textarea
                  value={s.cancellationPolicy}
                  onChange={(e) => s.setCancellationPolicy(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Describe las condiciones para cancelar o modificar una reserva."
                />
              </Field>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={s.saving === 'politicas'}
                onClick={() => void s.savePolicies()}
                className="inline-flex h-9 items-center rounded-xl border border-sapay-900 bg-sapay-900 px-4 text-xs font-medium text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)] transition hover:bg-sapay-850 disabled:opacity-60"
              >
                {s.saving === 'politicas' ? 'Guardando...' : 'Guardar políticas'}
              </button>
            </div>
          </Card>

          <Card
            title="Asistente IA"
            description="El botón del asistente en la esquina responde dudas sobre SAPAY."
          >
            <div className="flex items-center justify-between rounded-xl border border-sapay-350 bg-sapay-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <Bot size={16} className="text-sapay-700" />
                <div>
                  <p className="text-xs font-medium text-sapay-900">Asistente del hotel</p>
                  <p className="text-[10px] text-sapay-750">
                    {s.aiEnabled ? 'Disponible para todo el personal.' : 'Apagado: el botón no se muestra.'}
                  </p>
                </div>
              </div>
              <Switch checked={s.aiEnabled} onChange={(enabled) => void s.saveAi(enabled)} disabled={s.saving === 'ia'} />
            </div>
          </Card>

          <Card
            title="Accesos directos"
            description="Ajustes que viven en otros módulos y se administran allá."
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Shortcut
                icon={<ShieldCheck size={18} />}
                title="Seguridad y contraseña"
                subtitle="Perfil del usuario"
                onClick={() => onNavigate?.('perfil')}
              />
              <Shortcut
                icon={<BedDouble size={18} />}
                title="Tarifas de habitaciones"
                subtitle="Habitaciones"
                onClick={() => onNavigate?.('habitaciones')}
              />
              <Shortcut
                icon={<Package size={18} />}
                title="Precios de productos"
                subtitle="Inventario"
                onClick={() => onNavigate?.('inventario')}
              />
            </div>
          </Card>
        </div>
      ) : (
        <UsuariosSection />
      )}
    </div>
  );
}

function Shortcut({ icon, title, subtitle, onClick }: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-sapay-350 bg-sapay-100 px-4 py-3 text-left transition hover:border-sapay-500 hover:bg-white"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sapay-900/10 text-sapay-900">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-sapay-900">{title}</span>
        <span className="block text-[10px] text-sapay-750">{subtitle}</span>
      </span>
      <ArrowRight size={15} className="shrink-0 text-sapay-500 transition group-hover:translate-x-0.5 group-hover:text-sapay-900" />
    </button>
  );
}

function useTab(): [TabKey, (key: TabKey) => void] {
  const [tab, setTab] = useState<TabKey>('generales');
  return [tab, setTab];
}