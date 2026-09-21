import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';

type AdminPasswordMessages = {
  missing?: string;
  noAdmin?: string;
  invalid?: string;
};

export async function assertAdminPassword(
  prisma: PrismaService,
  password?: string,
  messages?: AdminPasswordMessages
): Promise<void> {
  if (!password?.trim()) {
    throw new UnauthorizedException(
      messages?.missing ??
        'Se requiere la contraseña de un administrador activo para esta acción.'
    );
  }

  const adminUser = await prisma.user.findFirst({
    where: { role: Role.ADMIN, isActive: true }
  });

  if (!adminUser) {
    throw new ForbiddenException(
      messages?.noAdmin ?? 'No hay un administrador activo en el sistema.'
    );
  }

  const isValid = await verifyPassword(password, adminUser.passwordHash);
  if (!isValid) {
    throw new UnauthorizedException(
      messages?.invalid ?? 'La contraseña del administrador no es correcta.'
    );
  }
}