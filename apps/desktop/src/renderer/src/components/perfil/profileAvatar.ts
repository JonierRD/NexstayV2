import { useEffect, useState } from 'react';

const AVATAR_STORAGE_PREFIX = 'sapay-profile-avatar:';
const AVATAR_EVENT = 'sapay:profile-avatar-changed';
const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

function getStorageKey(userId: string): string {
  return `${AVATAR_STORAGE_PREFIX}${userId}`;
}

export function getProfileAvatar(userId: string): string | null {
  return window.localStorage.getItem(getStorageKey(userId));
}

export function saveProfileAvatar(userId: string, avatar: string): void {
  window.localStorage.setItem(getStorageKey(userId), avatar);
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { userId } }));
}

export function useProfileAvatar(userId?: string): [string | null, (file: File) => Promise<void>] {
  const [avatar, setAvatar] = useState<string | null>(() => (userId ? getProfileAvatar(userId) : null));

  useEffect(() => {
    if (!userId) {
      setAvatar(null);
      return;
    }

    const syncAvatar = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) {
        setAvatar(getProfileAvatar(userId));
      }
    };

    setAvatar(getProfileAvatar(userId));
    window.addEventListener(AVATAR_EVENT, syncAvatar);
    window.addEventListener('storage', syncAvatar);
    return () => {
      window.removeEventListener(AVATAR_EVENT, syncAvatar);
      window.removeEventListener('storage', syncAvatar);
    };
  }, [userId]);

  const selectAvatar = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selecciona un archivo de imagen válido.');
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new Error('La imagen debe pesar máximo 3 MB.');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      reader.readAsDataURL(file);
    });

    if (!userId) {
      return;
    }
    saveProfileAvatar(userId, dataUrl);
    setAvatar(dataUrl);
  };

  return [avatar, selectAvatar];
}
