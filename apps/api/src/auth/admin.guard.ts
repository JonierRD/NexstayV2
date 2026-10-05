import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { JwtPayload } from './auth.types';

/**
 * Exige rol ADMIN en un endpoint concreto.
 *
 * NO autentica: solo autoriza por rol, asi que tiene que declararse siempre
 * despues de JwtAuthGuard para que el payload ya este en la peticion. Si se
 * pone solo, `request.user` llega undefined y la respuesta seria siempre 403.
 *
 * Sirve para el caso en que el frontend ya oculta los controles pero el
 * permiso debe quedarle atado al servidor: el cliente no es una frontera de
 * confianza (ver security/permissions.ts en el renderer).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    if (request.user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Esta acción solo puede realizarla un administrador.');
    }

    return true;
  }
}