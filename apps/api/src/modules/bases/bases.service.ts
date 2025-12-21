import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as Firebird from 'node-firebird';
import { PrismaService } from '../../database/prisma.service';
import { CreateBaseDto } from './dto/create-base.dto';
import { UpdateBaseDto } from './dto/update-base.dto';
import { FirebirdConfigDto } from './dto/firebird-config.dto';

@Injectable()
export class BasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nome: { contains: search } },
            { cnpj: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.base.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.base.count({ where }),
    ]);

    return {
      items: items.map((base) => ({
        id: base.id,
        nome: base.nome,
        cnpj: base.cnpj,
        ativo: base.ativo,
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
        hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
        usuariosCount: base._count.users,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                ativo: true,
              },
            },
          },
        },
      },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    return {
      id: base.id,
      nome: base.nome,
      cnpj: base.cnpj,
      ativo: base.ativo,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
      usuarios: base.users.map((ub) => ub.user),
    };
  }

  async create(dto: CreateBaseDto) {
    const base = await this.prisma.base.create({
      data: {
        nome: dto.nome,
        cnpj: dto.cnpj,
        ativo: dto.ativo ?? true,
        fbHost: dto.fbHost,
        fbPort: dto.fbPort,
        fbDatabase: dto.fbDatabase,
        fbUser: dto.fbUser,
        fbPassword: dto.fbPassword,
      },
    });

    return {
      id: base.id,
      nome: base.nome,
      cnpj: base.cnpj,
      ativo: base.ativo,
      hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
    };
  }

  async update(id: number, dto: UpdateBaseDto) {
    const existingBase = await this.prisma.base.findUnique({
      where: { id },
    });

    if (!existingBase) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    const base = await this.prisma.base.update({
      where: { id },
      data: {
        nome: dto.nome,
        cnpj: dto.cnpj,
        ativo: dto.ativo,
      },
    });

    return {
      id: base.id,
      nome: base.nome,
      cnpj: base.cnpj,
      ativo: base.ativo,
      hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
    };
  }

  async remove(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    if (base._count.users > 0) {
      throw new BadRequestException(
        `Base possui ${base._count.users} usuario(s) vinculado(s). Remova os usuarios primeiro.`,
      );
    }

    await this.prisma.base.delete({ where: { id } });

    return { message: 'Base removida com sucesso' };
  }

  async getFirebirdConfig(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
      select: {
        id: true,
        fbHost: true,
        fbPort: true,
        fbDatabase: true,
        fbUser: true,
        // Don't return password for security
      },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    return {
      host: base.fbHost,
      port: base.fbPort,
      database: base.fbDatabase,
      user: base.fbUser,
      hasPassword: !!(await this.prisma.base.findUnique({
        where: { id },
        select: { fbPassword: true },
      }))?.fbPassword,
    };
  }

  async updateFirebirdConfig(id: number, dto: FirebirdConfigDto) {
    const base = await this.prisma.base.findUnique({
      where: { id },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    await this.prisma.base.update({
      where: { id },
      data: {
        fbHost: dto.host,
        fbPort: dto.port,
        fbDatabase: dto.database,
        fbUser: dto.user,
        fbPassword: dto.password,
      },
    });

    return { message: 'Configuracao Firebird atualizada com sucesso' };
  }

  async testFirebirdConnection(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    if (!base.fbHost || !base.fbDatabase) {
      throw new BadRequestException('Configuracao Firebird incompleta');
    }

    const options = {
      host: base.fbHost,
      port: base.fbPort || 3050,
      database: base.fbDatabase,
      user: base.fbUser || 'SYSDBA',
      password: base.fbPassword || 'masterkey',
    };

    return new Promise((resolve, reject) => {
      Firebird.attach(options, (err, db) => {
        if (err) {
          resolve({
            success: false,
            message: `Erro de conexao: ${err.message}`,
          });
          return;
        }

        db.query('SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE', [], (err, result) => {
          db.detach();

          if (err) {
            resolve({
              success: false,
              message: `Erro na query: ${err.message}`,
            });
            return;
          }

          resolve({
            success: true,
            message: 'Conexao bem sucedida!',
            serverTime: result[0]?.CURRENT_TIMESTAMP,
          });
        });
      });
    });
  }

  async getBaseStats(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    return {
      usuariosCount: base._count.users,
      hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
    };
  }

  async getBaseUsuarios(id: number) {
    const base = await this.prisma.base.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                ativo: true,
                lastLogin: true,
              },
            },
          },
        },
      },
    });

    if (!base) {
      throw new NotFoundException(`Base ${id} nao encontrada`);
    }

    return base.users.map((ub) => ub.user);
  }
}
