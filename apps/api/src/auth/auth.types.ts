import { type Role } from '@prisma/client';
import { type User } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  role: Role;
  email: string;
};

export type PublicUser = {
  id: string;
  fullName: string;
  cc: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
};

export type AuthenticatedUser = PublicUser;