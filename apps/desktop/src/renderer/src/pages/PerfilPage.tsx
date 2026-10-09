import type { ChangeEvent, ReactElement } from 'react';
import {
  Award,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  Camera,
  Phone,
  X,
  ShieldCheck,
  UserRound,
  UsersRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePerfil } from '../components/perfil/usePerfil';
import { useProfileAvatar } from '../components/perfil/profileAvatar';
import { ApiError, forgotPasswordRequest, resetPasswordRequest, type PublicUser } from '../lib/api';
import { formatDate } from '../lib/format';
import hotelLogo from '../assets/login/Logo.png';
import hotelLobby from '../assets/login/FondoLogin.png';

const ROLE_LABEL: Record<PublicUser['role'], string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepción',
  CLEANING: 'Personal de Limpieza'
};

const FIELD_LABEL = 'mb-1.5 block text-[10px] font-semibold text-sapay-750';
const FIELD_INPUT =
  'w-full rounded-xl border border-sapay-350 bg-white px-3 py-2.5 text-[12px] text-sapay-950 outline-none transition placeholder:text-[#9d8d85] focus:border-sapay-600';
const CARD =
  'rounded-[18px] border border-sapay-350 bg-white p-4 shadow-[0_12px_30px_rgba(67,42,27,0.07)] sm:p-5';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function InfoItem({
  icon: Icon,
  label,
  value
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="flex min-h-[50px] items-center gap-3 rounded-xl bg-sapay-100 px-3.5 py-2.5">
      <Icon size={18} className="shrink-0 text-sapay-800" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[10px] text-sapay-700">{label}</dt>
        <dd className="truncate text-[12px] font-medium text-sapay-950">{value}</dd>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  action?: ReactElement;
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8ebc9] text-sapay-800">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[13px] font-bold text-sapay-950">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-sapay-700">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function PerfilPage({
  user
}: {
  user?: PublicUser;
} = {}): ReactElement {
  const p = usePerfil(user);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [avatar, selectAvatar] = useProfileAvatar(user?.id);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'reset'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState(user?.email ?? '');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (p.profileStatus?.kind === 'success') {
      setIsEditing(false);
    }
  }, [p.profileStatus]);

  if (!user) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
        <div className="text-[11px] text-sapay-750">No se encontró el usuario.</div>
      </div>
    );
  }

  const passwordField = (id: string, label: string, value: string, onChange: (value: string) => void, placeholder: string) => {
    const visible = visiblePasswords[id] ?? false;
    return (
      <div>
        <label htmlFor={id} className={FIELD_LABEL}>{label}</label>
        <div className="relative">
          <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sapay-800" />
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${FIELD_INPUT} pl-9 pr-10`}
            placeholder={placeholder}
            autoComplete={id.includes('current') ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            onClick={() => setVisiblePasswords((current) => ({ ...current, [id]: !visible }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sapay-700 hover:text-sapay-950"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    );
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      setAvatarError(null);
      await selectAvatar(file);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'No se pudo actualizar la foto.');
    }
  };

  const closeRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryStep('email');
    setRecoveryCode('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryStatus(null);
  };

  const handleRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRecovering(true);
    setRecoveryStatus(null);
    try {
      if (recoveryStep === 'email') {
        await forgotPasswordRequest(recoveryEmail.trim());
        setRecoveryStep('reset');
        setRecoveryStatus({ kind: 'success', message: 'Código enviado. Revisa tu correo electrónico.' });
      } else {
        if (!recoveryCode.trim() || !recoveryNewPassword || !recoveryConfirmPassword) {
          setRecoveryStatus({ kind: 'error', message: 'Completa todos los campos.' });
          return;
        }
        if (recoveryNewPassword !== recoveryConfirmPassword) {
          setRecoveryStatus({ kind: 'error', message: 'Las contraseñas no coinciden.' });
          return;
        }
        const { message } = await resetPasswordRequest({
          email: recoveryEmail.trim(),
          code: recoveryCode.trim(),
          newPassword: recoveryNewPassword,
          confirmPassword: recoveryConfirmPassword
        });
        setRecoveryStatus({ kind: 'success', message });
        setRecoveryCode('');
        setRecoveryNewPassword('');
        setRecoveryConfirmPassword('');
      }
    } catch (error) {
      setRecoveryStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'No se pudo conectar con la API.'
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-sapay-250 text-sapay-950">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <section
          className="relative min-h-[156px] overflow-hidden rounded-[18px] border border-sapay-350 bg-sapay-950 shadow-[0_14px_34px_rgba(67,42,27,0.12)]"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(4,31,57,.97) 0%, rgba(4,31,57,.82) 47%, rgba(4,31,57,.2) 100%), url(${hotelLobby})`, backgroundPosition: 'center' }}
        >
          <div className="relative flex h-full min-h-[156px] items-center gap-4 px-5 py-5 sm:px-7">
            <label className="group relative flex h-[76px] w-[76px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-[#f2c15c] bg-sapay-900 text-[28px] font-bold text-white shadow-lg" title="Cambiar foto de perfil">
              {avatar ? <img src={avatar} alt="Foto de perfil" className="h-full w-full object-cover" /> : getInitials(user.fullName)}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={21} />
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </label>
            <div className="min-w-0 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[21px] font-bold">{user.fullName}</h1>
                <span className="rounded-full bg-[#f3d17e] px-2.5 py-1 text-[9px] font-bold text-sapay-950">{ROLE_LABEL[user.role]}</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-sapay-100"><Mail size={14} />{user.email}</p>
              <p className="mt-1 text-[11px] text-sapay-100">Administración y control del sistema hotelero</p>
            </div>
            <img src={hotelLogo} alt="SAPAY Hotel" className="absolute right-5 hidden h-24 w-24 object-contain brightness-0 invert sm:block" />
          </div>
        </section>
        {avatarError && <p className="text-[11px] text-[#d13d3d]" role="alert">{avatarError}</p>}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            <section className={CARD}>
              <SectionHeading
                icon={UserRound}
                title="Información personal"
                subtitle="Datos registrados de tu cuenta en el hotel."
                action={
                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5c477] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-semibold text-sapay-850"
                  >
                    <Edit3 size={13} /> {isEditing ? 'Cerrar edición' : 'Editar perfil'}
                  </button>
                }
              />
              {isEditing ? (
                <form onSubmit={p.handleUpdateProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="perfil-fullname" className={FIELD_LABEL}>Nombre completo</label>
                    <div className="relative"><UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sapay-800" /><input id="perfil-fullname" type="text" value={p.fullName} onChange={(event) => p.setFullName(event.target.value)} className={`${FIELD_INPUT} pl-9`} placeholder="Tu nombre completo" /></div>
                  </div>
                  <div>
                    <label htmlFor="perfil-email" className={FIELD_LABEL}>Correo electrónico</label>
                    <div className="relative"><Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sapay-800" /><input id="perfil-email" type="email" value={p.email} onChange={(event) => p.setEmail(event.target.value)} className={`${FIELD_INPUT} pl-9`} placeholder="correo@ejemplo.com" autoComplete="email" /></div>
                  </div>
                  <div>
                    <label htmlFor="perfil-phone" className={FIELD_LABEL}>Teléfono</label>
                    <div className="relative"><Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sapay-800" /><input id="perfil-phone" type="tel" value={p.phone} onChange={(event) => p.setPhone(event.target.value)} className={`${FIELD_INPUT} pl-9`} placeholder="Número de contacto" /></div>
                  </div>
                  <InfoItem icon={FileText} label="Cédula" value={user.cc} />
                  <InfoItem icon={UserRound} label="Rol" value={ROLE_LABEL[user.role]} />
                  <InfoItem icon={CalendarDays} label="Miembro desde" value={formatDate(user.createdAt ?? new Date().toISOString())} />
                  <InfoItem icon={CheckCircle2} label="Estado" value={user.isActive ? 'Activo' : 'Inactivo'} />
                  {p.profileStatus && <p className={`text-[11px] sm:col-span-2 ${p.profileStatus.kind === 'success' ? 'text-emerald-600' : 'text-[#d13d3d]'}`}>{p.profileStatus.message}</p>}
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" disabled={p.isSavingProfile} className="h-9 flex-1 rounded-xl bg-sapay-900 text-[11px] font-medium text-white transition hover:bg-sapay-850 disabled:cursor-not-allowed disabled:opacity-70">{p.isSavingProfile ? 'Guardando...' : 'Guardar cambios'}</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="h-9 rounded-xl border border-sapay-350 px-4 text-[11px] font-medium text-sapay-800 hover:bg-sapay-100">Cancelar</button>
                  </div>
                </form>
              ) : (
                <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <InfoItem icon={FileText} label="Cédula" value={user.cc} />
                  <InfoItem icon={Phone} label="Teléfono" value={user.phone ?? '—'} />
                  <InfoItem icon={Mail} label="Correo electrónico" value={user.email} />
                  <InfoItem icon={UserRound} label="Rol" value={ROLE_LABEL[user.role]} />
                  <InfoItem icon={CalendarDays} label="Miembro desde" value={formatDate(user.createdAt ?? new Date().toISOString())} />
                  <InfoItem icon={CheckCircle2} label="Estado" value={user.isActive ? 'Activo' : 'Inactivo'} />
                </dl>
              )}
            </section>
          </div>

          <section className={CARD}>
            <SectionHeading icon={ShieldCheck} title="Seguridad" subtitle="Cambia la contraseña de tu cuenta. La nueva contraseña quedará activa de inmediato." />
            <form onSubmit={p.handleChangePassword} className="mt-4 flex flex-col gap-3">
              {passwordField('perfil-current-password', 'Contraseña actual', p.currentPassword, p.setCurrentPassword, 'Tu contraseña actual')}
              {passwordField('perfil-new-password', 'Contraseña nueva', p.newPassword, p.setNewPassword, 'Mínimo 5 caracteres')}
              {passwordField('perfil-confirm-password', 'Confirmar contraseña nueva', p.confirmPassword, p.setConfirmPassword, 'Repite la contraseña nueva')}
              {p.passwordStatus && <p className={`text-[11px] ${p.passwordStatus.kind === 'success' ? 'text-emerald-600' : 'text-[#d13d3d]'}`}>{p.passwordStatus.message}</p>}
              <button type="submit" disabled={p.isSavingPassword} className="mt-1 h-9 rounded-xl bg-sapay-900 text-[11px] font-semibold text-white transition hover:bg-sapay-850 disabled:cursor-not-allowed disabled:opacity-70"><KeyRound size={14} className="mr-1.5 inline" />{p.isSavingPassword ? 'Actualizando...' : 'Actualizar contraseña'}</button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryEmail(user.email);
                  setRecoveryStatus(null);
                  setIsRecoveryOpen(true);
                }}
                className="text-[10px] font-medium text-sapay-800 underline underline-offset-2 hover:text-sapay-950"
              >
                ¿Olvidaste tu contraseña? Recuperarla
              </button>
            </form>
          </section>
        </div>

        <section className={`${CARD} grid gap-4 sm:grid-cols-3`}>
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8ebc9] text-sapay-800"><BedDouble size={18} /></span><div><p className="text-[13px] font-bold text-sapay-950">17</p><p className="text-[10px] text-sapay-700">Habitaciones</p></div></div>
          <div className="flex items-center gap-3 sm:border-l sm:border-sapay-200 sm:pl-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8ebc9] text-sapay-800"><UsersRound size={18} /></span><div><p className="text-[13px] font-bold text-sapay-950">2</p><p className="text-[10px] text-sapay-700">Roles de usuario</p></div></div>
          <div className="flex items-center gap-3 sm:border-l sm:border-sapay-200 sm:pl-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8ebc9] text-sapay-800"><Award size={18} /></span><div><p className="text-[13px] font-bold text-sapay-950">100%</p><p className="text-[10px] text-sapay-700">Sistema local</p></div></div>
        </section>
      </div>
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sapay-950/45 px-4" role="presentation">
          <section className="w-full max-w-[420px] rounded-2xl border border-sapay-350 bg-white p-5 shadow-[0_24px_70px_rgba(35,20,12,0.25)]" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="recovery-title" className="text-[15px] font-bold text-sapay-950">Recuperar contraseña</h2>
                <p className="mt-1 text-[11px] text-sapay-700">
                  {recoveryStep === 'email' ? 'Te enviaremos un código a tu correo.' : 'Ingresa el código y define tu nueva contraseña.'}
                </p>
              </div>
              <button type="button" onClick={closeRecovery} className="text-sapay-700 hover:text-sapay-950" aria-label="Cerrar recuperación"><X size={18} /></button>
            </div>
            <form onSubmit={handleRecovery} className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="recovery-email" className={FIELD_LABEL}>Correo electrónico</label>
                <input id="recovery-email" type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} className={FIELD_INPUT} disabled={recoveryStep === 'reset'} required />
              </div>
              {recoveryStep === 'reset' && (
                <>
                  <div>
                    <label htmlFor="recovery-code" className={FIELD_LABEL}>Código recibido</label>
                    <input id="recovery-code" type="text" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} className={FIELD_INPUT} placeholder="Código de recuperación" />
                  </div>
                  <div>
                    <label htmlFor="recovery-new-password" className={FIELD_LABEL}>Nueva contraseña</label>
                    <input id="recovery-new-password" type="password" value={recoveryNewPassword} onChange={(event) => setRecoveryNewPassword(event.target.value)} className={FIELD_INPUT} placeholder="Mínimo 5 caracteres" />
                  </div>
                  <div>
                    <label htmlFor="recovery-confirm-password" className={FIELD_LABEL}>Confirmar contraseña</label>
                    <input id="recovery-confirm-password" type="password" value={recoveryConfirmPassword} onChange={(event) => setRecoveryConfirmPassword(event.target.value)} className={FIELD_INPUT} placeholder="Repite la contraseña" />
                  </div>
                </>
              )}
              {recoveryStatus && <p className={`text-[11px] ${recoveryStatus.kind === 'success' ? 'text-emerald-600' : 'text-[#d13d3d]'}`}>{recoveryStatus.message}</p>}
              <button type="submit" disabled={isRecovering} className="h-9 rounded-xl bg-sapay-900 text-[11px] font-semibold text-white hover:bg-sapay-850 disabled:opacity-70">
                {isRecovering ? 'Procesando...' : recoveryStep === 'email' ? 'Enviar código' : 'Restablecer contraseña'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
