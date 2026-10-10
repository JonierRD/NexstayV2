import { useEffect, useState, type FormEvent } from 'react';
import { useAuthSession } from '../../context/AuthContext';
import {
  ApiError,
  changePasswordRequest,
  updateProfileRequest,
  type PublicUser
} from '../../lib/api';

export type PerfilStatus = { kind: 'success' | 'error'; message: string } | null;

export function usePerfil(user?: PublicUser) {
  const { refreshAccount } = useAuthSession();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileStatus, setProfileStatus] = useState<PerfilStatus>(null);
  const [passwordStatus, setPasswordStatus] = useState<PerfilStatus>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone ?? '');
  }, [user?.fullName, user?.phone, user?.id]);

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const name = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!name) {
      setProfileStatus({ kind: 'error', message: 'El nombre completo no puede estar vacío.' });
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setProfileStatus({ kind: 'error', message: 'Ingresa un correo electrónico válido.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus(null);

    try {
      await updateProfileRequest({ fullName: name, email: normalizedEmail, phone: phone.trim() });
      setProfileStatus({ kind: 'success', message: 'Información actualizada correctamente.' });
      await refreshAccount();
    } catch (error) {
      setProfileStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'No se pudo conectar con la API.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ kind: 'error', message: 'Completa todos los campos.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ kind: 'error', message: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    if (newPassword.length < 5) {
      setPasswordStatus({
        kind: 'error',
        message: 'La contraseña debe tener al menos 5 caracteres.'
      });
      return;
    }

    setIsSavingPassword(true);
    setPasswordStatus(null);

    try {
      const { message } = await changePasswordRequest({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPasswordStatus({ kind: 'success', message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'No se pudo conectar con la API.'
      });
    } finally {
      setIsSavingPassword(false);
    }
  }

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    profileStatus,
    setProfileStatus,
    passwordStatus,
    setPasswordStatus,
    isSavingProfile,
    isSavingPassword,
    handleUpdateProfile,
    handleChangePassword
  };
}