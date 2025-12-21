import { Injectable } from '@nestjs/common';
import { FirebirdService } from './firebird.service';

@Injectable()
export class ErpService {
  constructor(private readonly firebird: FirebirdService) {}

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

  // ==================== PRODUTOS ====================

  async getProdutos(baseId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
    grupoId?: number;
  } = {}) {
    const { page = 1, limit = 20, search, grupoId } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (UPPER(p.DESCRICAO) LIKE UPPER(?) OR p.CODIGO_BARRAS LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (grupoId) {
      whereClause += ` AND p.ID_GRUPO = ?`;
      params.push(grupoId);
    }

    const sql = `
      SELECT FIRST ${limit} SKIP ${offset}
        p.ID_PRODUTO,
        p.DESCRICAO,
        p.CODIGO_BARRAS,
        p.ID_GRUPO,
        g.DESCRICAO AS GRUPO,
        p.PRECO_VENDA,
        p.ATIVO
      FROM ES_PRODUTO p
      LEFT JOIN ES_GRUPO g ON g.ID_GRUPO = p.ID_GRUPO
      ${whereClause}
      ORDER BY p.DESCRICAO
    `;

    const countSql = `
      SELECT COUNT(*) as TOTAL
      FROM ES_PRODUTO p
      ${whereClause}
    `;

    const [items, countResult] = await Promise.all([
      this.firebird.query(baseId, sql, params),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, countSql, params),
    ]);

    const total = countResult?.TOTAL || 0;

    return {
      items: items.map((p: any) => ({
        id: p.ID_PRODUTO,
        descricao: p.DESCRICAO,
        codigoBarras: p.CODIGO_BARRAS,
        grupoId: p.ID_GRUPO,
        grupo: p.GRUPO,
        precoVenda: p.PRECO_VENDA,
        ativo: p.ATIVO === 'S',
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== ESTOQUE ====================

  async getEstoque(baseId: number, empresaId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ps.ID_EMPRESA = ? AND ps.QUANTIDADE > 0';
    const params: any[] = [empresaId];

    if (search) {
      whereClause += ` AND (UPPER(p.DESCRICAO) LIKE UPPER(?) OR p.CODIGO_BARRAS LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const sql = `
      SELECT FIRST ${limit} SKIP ${offset}
        p.ID_PRODUTO,
        p.DESCRICAO,
        p.CODIGO_BARRAS,
        g.DESCRICAO AS GRUPO,
        ps.QUANTIDADE,
        p.PRECO_VENDA
      FROM ES_PROSALDO ps
      JOIN ES_PRODUTO p ON p.ID_PRODUTO = ps.ID_PRODUTO
      LEFT JOIN ES_GRUPO g ON g.ID_GRUPO = p.ID_GRUPO
      ${whereClause}
      ORDER BY p.DESCRICAO
    `;

    const countSql = `
      SELECT COUNT(*) as TOTAL
      FROM ES_PROSALDO ps
      JOIN ES_PRODUTO p ON p.ID_PRODUTO = ps.ID_PRODUTO
      ${whereClause}
    `;

    const [items, countResult] = await Promise.all([
      this.firebird.query(baseId, sql, params),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, countSql, params),
    ]);

    const total = countResult?.TOTAL || 0;

    return {
      items: items.map((e: any) => ({
        produtoId: e.ID_PRODUTO,
        descricao: e.DESCRICAO,
        codigoBarras: e.CODIGO_BARRAS,
        grupo: e.GRUPO,
        quantidade: e.QUANTIDADE,
        precoVenda: e.PRECO_VENDA,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== VENDAS ====================

  async getVendas(baseId: number, options: {
    empresaId?: number;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { empresaId, dataInicio, dataFim, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE ped.FECHADO = 'S'";
    const params: any[] = [];

    if (empresaId) {
      whereClause += ` AND ped.ID_EMPRESA = ?`;
      params.push(empresaId);
    }

    if (dataInicio) {
      whereClause += ` AND ped.DT_PEDIDO >= ?`;
      params.push(dataInicio);
    }

    if (dataFim) {
      whereClause += ` AND ped.DT_PEDIDO <= ?`;
      params.push(dataFim);
    }

    const sql = `
      SELECT FIRST ${limit} SKIP ${offset}
        ped.ID_PEDIDO,
        ped.ID_EMPRESA,
        emp.FANTASIA AS EMPRESA,
        ped.ID_CLIENTE,
        cli.FANTASIA AS CLIENTE,
        ped.DT_PEDIDO,
        ped.VL_TOTAL,
        ped.FECHADO
      FROM VD_PEDIDO ped
      JOIN GE_EMPRESA e ON e.ID_EMPRESA = ped.ID_EMPRESA
      JOIN GE_PESSOA emp ON emp.ID_PESSOA = e.ID_PESSOA
      LEFT JOIN VD_CLIENTE c ON c.ID_PESSOA = ped.ID_CLIENTE
      LEFT JOIN GE_PESSOA cli ON cli.ID_PESSOA = c.ID_PESSOA
      ${whereClause}
      ORDER BY ped.DT_PEDIDO DESC
    `;

    const countSql = `
      SELECT COUNT(*) as TOTAL
      FROM VD_PEDIDO ped
      ${whereClause}
    `;

    const [items, countResult] = await Promise.all([
      this.firebird.query(baseId, sql, params),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, countSql, params),
    ]);

    const total = countResult?.TOTAL || 0;

    return {
      items: items.map((v: any) => ({
        id: v.ID_PEDIDO,
        empresaId: v.ID_EMPRESA,
        empresa: v.EMPRESA,
        clienteId: v.ID_CLIENTE,
        cliente: v.CLIENTE,
        data: v.DT_PEDIDO,
        valorTotal: v.VL_TOTAL,
        fechado: v.FECHADO === 'S',
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== DASHBOARD ====================

  async getDashboard(baseId: number, empresaId?: number) {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioMes = `${hoje.substring(0, 7)}-01`;

    let empresaFilter = '';
    const params: any[] = [];

    if (empresaId) {
      empresaFilter = 'AND ped.ID_EMPRESA = ?';
      params.push(empresaId);
    }

    // Vendas do dia
    const vendasHojeSql = `
      SELECT COUNT(*) as QUANTIDADE, COALESCE(SUM(VL_TOTAL), 0) as VALOR
      FROM VD_PEDIDO ped
      WHERE FECHADO = 'S' AND DT_PEDIDO = ? ${empresaFilter}
    `;

    // Vendas do mes
    const vendasMesSql = `
      SELECT COUNT(*) as QUANTIDADE, COALESCE(SUM(VL_TOTAL), 0) as VALOR
      FROM VD_PEDIDO ped
      WHERE FECHADO = 'S' AND DT_PEDIDO >= ? ${empresaFilter}
    `;

    // Total de clientes
    const clientesSql = `
      SELECT COUNT(*) as TOTAL FROM VD_CLIENTE
    `;

    // Total de produtos
    const produtosSql = `
      SELECT COUNT(*) as TOTAL FROM ES_PRODUTO WHERE ATIVO = 'S'
    `;

    const [vendasHoje, vendasMes, clientes, produtos] = await Promise.all([
      this.firebird.queryOne(baseId, vendasHojeSql, [hoje, ...params]),
      this.firebird.queryOne(baseId, vendasMesSql, [inicioMes, ...params]),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, clientesSql),
      this.firebird.queryOne<{ TOTAL: number }>(baseId, produtosSql),
    ]);

    return {
      vendasHoje: {
        quantidade: vendasHoje?.QUANTIDADE || 0,
        valor: vendasHoje?.VALOR || 0,
      },
      vendasMes: {
        quantidade: vendasMes?.QUANTIDADE || 0,
        valor: vendasMes?.VALOR || 0,
      },
      totalClientes: clientes?.TOTAL || 0,
      totalProdutos: produtos?.TOTAL || 0,
    };
  }
}
