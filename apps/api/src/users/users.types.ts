import { type User } from '@prisma/client';

export type AdminUserRow = {
  id: string;
  fullName: string;
  cc: string;
  email: string;
  phone: string | null;
  role: User['role'];
  isActive: boolean;
  createdAt: string;
};

export function toAdminUserRow(user: User): AdminUserRow {
  return {
    id: user.id,
    fullName: user.fullName,
    cc: user.cc,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  };
}