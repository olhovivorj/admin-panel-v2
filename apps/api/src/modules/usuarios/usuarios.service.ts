import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nome: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          bases: {
            include: {
              base: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        obs: user.obs,
        ativo: user.ativo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        roles: user.roles.map((ur) => ur.role),
        bases: user.bases.map((ub) => ub.base),
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        bases: {
          include: {
            base: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
      obs: user.obs,
      ativo: user.ativo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      roles: user.roles.map((ur) => ur.role),
      bases: user.bases.map((ub) => ub.base),
    };
  }

  async create(dto: CreateUsuarioDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email ja esta em uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nome: dto.nome,
        telefone: dto.telefone,
        obs: dto.obs,
        ativo: dto.ativo ?? true,
        roles: dto.roleIds?.length
          ? {
              create: dto.roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : undefined,
        bases: dto.baseIds?.length
          ? {
              create: dto.baseIds.map((baseId) => ({
                base: { connect: { id: baseId } },
              })),
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        bases: {
          include: {
            base: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
      ativo: user.ativo,
      roles: user.roles.map((ur) => ur.role),
      bases: user.bases.map((ub) => ub.base),
    };
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    // Check if email is already used by another user
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email ja esta em uso');
      }
    }

    // Update user data
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        nome: dto.nome,
        telefone: dto.telefone,
        obs: dto.obs,
        ativo: dto.ativo,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        bases: {
          include: {
            base: true,
          },
        },
      },
    });

    // Update roles if provided
    if (dto.roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });

      if (dto.roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    }

    // Update bases if provided
    if (dto.baseIds !== undefined) {
      await this.prisma.userBase.deleteMany({ where: { userId: id } });

      if (dto.baseIds.length > 0) {
        await this.prisma.userBase.createMany({
          data: dto.baseIds.map((baseId) => ({
            userId: id,
            baseId,
          })),
        });
      }
    }

    // Fetch updated user
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'Usuario removido com sucesso' };
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async checkEmail(email: string, excludeId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (!excludeId || user.id !== excludeId)) {
      return { available: false, message: 'Email ja esta em uso' };
    }

    return { available: true };
  }

  async getUserBases(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bases: {
          include: {
            base: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    return user.bases.map((ub) => ub.base);
  }

  async setUserBases(id: number, baseIds: number[]) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} nao encontrado`);
    }

    // Remove existing bases
    await this.prisma.userBase.deleteMany({ where: { userId: id } });

    // Add new bases
    if (baseIds.length > 0) {
      await this.prisma.userBase.createMany({
        data: baseIds.map((baseId) => ({
          userId: id,
          baseId,
        })),
      });
    }

    return this.getUserBases(id);
  }
}
