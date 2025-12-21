import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions;
  }

  async findGrouped() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group by module
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return Object.entries(grouped).map(([module, permissions]) => ({
      module,
      permissions,
    }));
  }

  async create(dto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });

    if (existingPermission) {
      throw new ConflictException('Permissao ja existe');
    }

    const permission = await this.prisma.permission.create({
      data: {
        name: dto.name,
        module: dto.module,
        action: dto.action,
      },
    });

    return permission;
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { roles: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permissao ${id} nao encontrada`);
    }

    if (permission._count.roles > 0) {
      throw new BadRequestException(
        `Permissao possui ${permission._count.roles} role(s) vinculada(s). Remova das roles primeiro.`,
      );
    }

    await this.prisma.permission.delete({ where: { id } });

    return { message: 'Permissao removida com sucesso' };
  }
}
