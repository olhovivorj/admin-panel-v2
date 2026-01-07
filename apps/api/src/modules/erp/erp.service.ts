import { Injectable } from '@nestjs/common';
import { FirebirdService } from './firebird.service';
import { BaseConfigService } from '../../config/base-config.service';

@Injectable()
export class ErpService {
  constructor(
    private readonly firebird: FirebirdService,
    private readonly db: BaseConfigService,
  ) {}

  // ==================== PESSOAS ====================

  async getPessoas(baseId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
    tipo?: 'F' | 'J' | null;
  } = {}) {
    const { page = 1, limit = 20, search, tipo } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (UPPER(p.FANTASIA) LIKE UPPER(?) OR UPPER(p.RAZAO) LIKE UPPER(?))`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tipo === 'F') {
      whereClause += ` AND pf.ID_PESSOA IS NOT NULL`;
    } else if (tipo === 'J') {
      whereClause += ` AND pj.ID_PESSOA IS NOT NULL`;
    }

    const sql = `
      SELECT FIRST ${limit} SKIP ${offset}
        p.ID_PESSOA,
        p.FANTASIA,
        p.RAZAO,
        p.TIPO,
        pf.CPF,
        pj.CNPJ,
        pe.EMAIL,
        pe.TELEFONE,
        pe.CELULAR
      FROM GE_PESSOA p
      LEFT JOIN GE_PESSOA_FISICA pf ON pf.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_ENDERECO pe ON pe.ID_PESSOA = p.ID_PESSOA AND pe.PRINCIPAL = 'S'
      ${whereClause}
      ORDER BY p.FANTASIA
    `;

    const countSql = `
      SELECT COUNT(*) as TOTAL
      FROM GE_PESSOA p
      LEFT JOIN GE_PESSOA_FISICA pf ON pf.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      ${whereClause}
    `;

    const [items, countResult] = await Promise.all([
      this.firebird.query(baseId, sql, params),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, countSql, params),
    ]);

    const total = countResult?.TOTAL || 0;

    return {
      items: items.map((p: any) => ({
        id: p.ID_PESSOA,
        nome: p.FANTASIA || p.RAZAO,
        razao: p.RAZAO,
        tipo: p.TIPO,
        cpf: p.CPF,
        cnpj: p.CNPJ,
        email: p.EMAIL,
        telefone: p.TELEFONE || p.CELULAR,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPessoa(baseId: number, id: number) {
    const sql = `
      SELECT
        p.ID_PESSOA,
        p.FANTASIA,
        p.RAZAO,
        p.TIPO,
        pf.CPF,
        pf.RG,
        pf.DT_NASCIMENTO,
        pj.CNPJ,
        pj.IE,
        pe.LOGRADOURO,
        pe.NUMERO,
        pe.COMPLEMENTO,
        pe.BAIRRO,
        pe.CEP,
        pe.CIDADE,
        pe.UF,
        pe.EMAIL,
        pe.TELEFONE,
        pe.CELULAR
      FROM GE_PESSOA p
      LEFT JOIN GE_PESSOA_FISICA pf ON pf.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_ENDERECO pe ON pe.ID_PESSOA = p.ID_PESSOA AND pe.PRINCIPAL = 'S'
      WHERE p.ID_PESSOA = ?
    `;

    const pessoa = await this.firebird.queryOne(baseId, sql, [id]);

    if (!pessoa) {
      return null;
    }

    return {
      id: pessoa.ID_PESSOA,
      nome: pessoa.FANTASIA || pessoa.RAZAO,
      razao: pessoa.RAZAO,
      tipo: pessoa.TIPO,
      cpf: pessoa.CPF,
      rg: pessoa.RG,
      dataNascimento: pessoa.DT_NASCIMENTO,
      cnpj: pessoa.CNPJ,
      ie: pessoa.IE,
      endereco: {
        logradouro: pessoa.LOGRADOURO,
        numero: pessoa.NUMERO,
        complemento: pessoa.COMPLEMENTO,
        bairro: pessoa.BAIRRO,
        cep: pessoa.CEP,
        cidade: pessoa.CIDADE,
        uf: pessoa.UF,
      },
      email: pessoa.EMAIL,
      telefone: pessoa.TELEFONE,
      celular: pessoa.CELULAR,
    };
  }

  /**
   * Lista pessoas disponíveis para vinculação com usuário ARI
   * Exclui pessoas que já estão vinculadas a algum usuário
   */
  async getPessoasDisponiveisVinculacao(baseId: number, options: {
    search?: string;
    limit?: number;
  } = {}) {
    const { search, limit = 20 } = options;

    // Buscar pessoas já vinculadas a usuários ARI
    const vinculados = await this.db.query<{ id_pessoa: number }>(
      'SELECT id_pessoa FROM ariusers WHERE ID_BASE = ? AND id_pessoa IS NOT NULL',
      [baseId]
    );
    const idsVinculados = vinculados.map(v => v.id_pessoa);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (UPPER(p.FANTASIA) LIKE UPPER(?) OR UPPER(p.RAZAO) LIKE UPPER(?) OR pf.CPF LIKE ? OR pj.CNPJ LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Excluir pessoas já vinculadas
    if (idsVinculados.length > 0) {
      whereClause += ` AND p.ID_PESSOA NOT IN (${idsVinculados.join(',')})`;
    }

    const sql = `
      SELECT FIRST ${limit}
        p.ID_PESSOA,
        p.FANTASIA,
        p.RAZAO,
        p.TIPO,
        pf.CPF,
        pj.CNPJ,
        pe.EMAIL,
        pe.TELEFONE
      FROM GE_PESSOA p
      LEFT JOIN GE_PESSOA_FISICA pf ON pf.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_ENDERECO pe ON pe.ID_PESSOA = p.ID_PESSOA AND pe.PRINCIPAL = 'S'
      ${whereClause}
      ORDER BY p.FANTASIA
    `;

    const pessoas = await this.firebird.query(baseId, sql, params);

    return {
      items: pessoas.map((p: any) => ({
        id: p.ID_PESSOA,
        nome: p.FANTASIA || p.RAZAO,
        razao: p.RAZAO,
        tipo: p.TIPO,
        cpfCnpj: p.CPF || p.CNPJ,
        email: p.EMAIL,
        telefone: p.TELEFONE,
        disponivel: true,
      })),
      total: pessoas.length,
    };
  }

  // ==================== EMPRESAS ====================

  async getEmpresas(baseId: number) {
    const sql = `
      SELECT
        e.ID_EMPRESA,
        e.ID_PESSOA,
        p.FANTASIA,
        p.RAZAO,
        pj.CNPJ,
        e.FG_MATRIZ,
        e.FG_ADM,
        e.FG_LAB
      FROM GE_EMPRESA e
      JOIN GE_PESSOA p ON p.ID_PESSOA = e.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      ORDER BY e.ID_EMPRESA
    `;

    const empresas = await this.firebird.query(baseId, sql);

    return empresas.map((e: any) => ({
      id: e.ID_EMPRESA,
      idPessoa: e.ID_PESSOA,
      nome: e.FANTASIA || e.RAZAO,
      razao: e.RAZAO,
      cnpj: e.CNPJ,
      isMatriz: e.FG_MATRIZ === 'S',
      isAdm: e.FG_ADM === 'S',
      isLab: e.FG_LAB === 'S',
    }));
  }

  async getEmpresa(baseId: number, id: number) {
    const sql = `
      SELECT
        e.ID_EMPRESA,
        e.ID_PESSOA,
        p.FANTASIA,
        p.RAZAO,
        pj.CNPJ,
        pj.IE,
        pe.LOGRADOURO,
        pe.NUMERO,
        pe.BAIRRO,
        pe.CEP,
        pe.CIDADE,
        pe.UF,
        pe.TELEFONE,
        pe.EMAIL,
        e.FG_MATRIZ,
        e.FG_ADM,
        e.FG_LAB
      FROM GE_EMPRESA e
      JOIN GE_PESSOA p ON p.ID_PESSOA = e.ID_PESSOA
      LEFT JOIN GE_PESSOA_JURIDICA pj ON pj.ID_PESSOA = p.ID_PESSOA
      LEFT JOIN GE_PESSOA_ENDERECO pe ON pe.ID_PESSOA = p.ID_PESSOA AND pe.PRINCIPAL = 'S'
      WHERE e.ID_EMPRESA = ?
    `;

    const empresa = await this.firebird.queryOne(baseId, sql, [id]);

    if (!empresa) {
      return null;
    }

    return {
      id: empresa.ID_EMPRESA,
      idPessoa: empresa.ID_PESSOA,
      nome: empresa.FANTASIA || empresa.RAZAO,
      razao: empresa.RAZAO,
      cnpj: empresa.CNPJ,
      ie: empresa.IE,
      endereco: {
        logradouro: empresa.LOGRADOURO,
        numero: empresa.NUMERO,
        bairro: empresa.BAIRRO,
        cep: empresa.CEP,
        cidade: empresa.CIDADE,
        uf: empresa.UF,
      },
      telefone: empresa.TELEFONE,
      email: empresa.EMAIL,
      isMatriz: empresa.FG_MATRIZ === 'S',
      isAdm: empresa.FG_ADM === 'S',
      isLab: empresa.FG_LAB === 'S',
    };
  }
}
