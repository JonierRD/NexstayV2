import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AdminUserRow } from './users.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditoria: AuditoriaService
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  list(): Promise<AdminUserRow[]> {
    return this.usersService.list();
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload
  ): Promise<AdminUserRow> {
    const created = await this.usersService.create(dto);

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
      newValue: { fullName: created.fullName, email: created.email, role: created.role },
      description: `Creó el usuario ${created.fullName}.`
    });

    return created;
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload
  ): Promise<AdminUserRow> {
    const before = await this.usersService.findById(id);
    const updated = await this.usersService.update(id, dto, user.sub);

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValue: before,
      newValue: updated,
      description: `Actualizó el usuario ${updated.fullName}.`
    });

    return updated;
  }
}