import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      usersCount: role._count.users,
      permissionsCount: role._count.permissions,
    }));
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} nao encontrada`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => rp.permission),
      users: role.users.map((ur) => ur.user),
    };
  }

  async create(dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role ja existe');
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  }

  async update(id: number, dto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role ${id} nao encontrada`);
    }

    if (dto.name && dto.name !== existingRole.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new ConflictException('Nome de role ja existe');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} nao encontrada`);
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `Role possui ${role._count.users} usuario(s) vinculado(s). Remova os usuarios primeiro.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role removida com sucesso' };
  }

  async getPermissions(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} nao encontrada`);
    }

    return role.permissions.map((rp) => rp.permission);
  }

  async setPermissions(id: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} nao encontrada`);
    }

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    // Add new permissions
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    return this.getPermissions(id);
  }
}
