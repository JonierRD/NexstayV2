import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuthSession } from '../../context/AuthContext';
import {
  ApiError,
  createUserRequest,
  listUsersRequest,
  updateUserRequest,
  type AdminUser
} from '../../lib/api';

export const USER_ROLES = ['ADMIN', 'RECEPTION', 'CLEANING'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepcionista',
  CLEANING: 'Limpieza'
};

export type UserFormState = {
  fullName: string;
  cc: string;
  email: string;
  phone: string;
  role: UserRole;
  initialPassword: string;
  confirmPassword: string;
};

export type UsuariosStatus = { kind: 'success' | 'error'; message: string } | null;

const EMPTY_FORM: UserFormState = {
  fullName: '',
  cc: '',
  email: '',
  phone: '',
  role: 'RECEPTION',
  initialPassword: '',
  confirmPassword: ''
};

export function useUsuarios() {
  const { user: sessionUser } = useAuthSession();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<UsuariosStatus>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsersRequest());
    } catch (loadErr) {
      setError(loadErr instanceof ApiError ? loadErr.message : 'No se pudo conectar con la API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY_FORM);
    setStatus(null);
    setShowForm(true);
  }

  function openEdit(user: AdminUser): void {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      cc: user.cc,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role as UserRole,
      initialPassword: '',
      confirmPassword: ''
    });
    setStatus(null);
    setShowForm(true);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditing(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const cc = form.cc.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName || !cc || !email.includes('@')) {
      setStatus({ kind: 'error', message: 'Completa los campos obligatorios.' });
      return;
    }

    if (!editing && (!form.initialPassword || form.initialPassword !== form.confirmPassword)) {
      setStatus({ kind: 'error', message: 'Las contraseñas provisionales no coinciden.' });
      return;
    }

    if (!editing && form.initialPassword.length < 5) {
      setStatus({ kind: 'error', message: 'La contraseña debe tener al menos 5 caracteres.' });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      if (editing) {
        const updated = await updateUserRequest(editing.id, {
          fullName,
          email,
          phone: form.phone.trim(),
          role: form.role
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setStatus({ kind: 'success', message: 'Usuario actualizado correctamente.' });
      } else {
        const created = await createUserRequest({
          fullName,
          cc,
          email,
          phone: form.phone.trim(),
          role: form.role,
          initialPassword: form.initialPassword,
          confirmPassword: form.confirmPassword
        });
        setUsers((prev) => [...prev, created]);
        setStatus({ kind: 'success', message: 'Usuario creado correctamente.' });
        setForm(EMPTY_FORM);
        setEditing(null);
      }
    } catch (submitError) {
      setStatus({
        kind: 'error',
        message:
          submitError instanceof ApiError
            ? submitError.message
            : 'No se pudo conectar con la API.'
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: AdminUser): Promise<void> {
    setStatus(null);
    try {
      const updated = await updateUserRequest(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setStatus({
        kind: 'success',
        message: updated.isActive
          ? `${updated.fullName} fue activado.`
          : `${updated.fullName} fue desactivado.`
      });
    } catch (toggleError) {
      setStatus({
        kind: 'error',
        message:
          toggleError instanceof ApiError ? toggleError.message : 'No se pudo conectar con la API.'
      });
    }
  }

  const isSelf = (user: AdminUser): boolean => user.id === sessionUser?.id;

  return {
    users,
    loading,
    error,
    editing,
    showForm,
    setShowForm,
    form,
    setForm,
    saving,
    status,
    openCreate,
    openEdit,
    closeForm,
    submit,
    toggleActive,
    isSelf
  };
}