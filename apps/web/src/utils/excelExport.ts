/**
 * Utilitário para exportar dados em formato Excel
 * Suporta CSV e XLSX real
 */
import * as XLSX from 'xlsx'

export interface ExcelColumn {
  key: string
  label: string
  width?: number
  formatter?: (value: any) => string
}

export interface ExcelData {
  [key: string]: any
}

export class ExcelExporter {
  /**
   * Converte array de objetos para CSV
   */
  static arrayToCSV(data: ExcelData[], columns: ExcelColumn[]): string {
    const headers = columns.map(col => `"${col.label}"`).join(',')

    const rows = data.map(row => {
      return columns.map(col => {
        let value = row[col.key]

        // Aplicar formatador se existir
        if (col.formatter) {
          value = col.formatter(value)
        }

        // Tratar valores nulos/undefined
        if (value === null || value === undefined) {
          value = ''
        }

        // Converter para string e escapar aspas
        const stringValue = String(value).replace(/"/g, '""')

        return `"${stringValue}"`
      }).join(',')
    })

    return [headers, ...rows].join('\n')
  }

  /**
   * Baixa dados como arquivo CSV
   */
  static downloadCSV(filename: string, data: ExcelData[], columns: ExcelColumn[]) {
    const csv = this.arrayToCSV(data, columns)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM para UTF-8
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Baixa dados como arquivo XLSX real
   */
  static downloadXLSX(filename: string, data: ExcelData[], columns: ExcelColumn[]) {
    // Preparar dados formatados
    const formattedData = data.map(row => {
      const formattedRow: any = {}
      columns.forEach(col => {
        let value = row[col.key]

        // Aplicar formatador se existir
        if (col.formatter && value !== null && value !== undefined) {
          value = col.formatter(value)
        }

        // Tratar valores nulos/undefined
        if (value === null || value === undefined) {
          value = ''
        }

        formattedRow[col.label] = value
      })
      return formattedRow
    })

    // Criar workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(formattedData)

    // Configurar larguras das colunas
    const columnWidths = columns.map(col => ({ wch: col.width || 20 }))
    worksheet['!cols'] = columnWidths

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados')

    // Baixar arquivo
    const xlsxFilename = filename.replace('.csv', '.xlsx')
    XLSX.writeFile(workbook, xlsxFilename)
  }

  /**
   * Formatadores comuns
   */
  static formatters = {
    currency: (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0),

    number: (value: number) =>
      new Intl.NumberFormat('pt-BR').format(value || 0),

    date: (value: string) => {
      if (!value) {
        return ''
      }

      // Formato ISO (2024-12-20T14:45:00.000Z) para DD/MM/YYYY HH:MM:SS
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('pt-BR')
        }
      } catch (error) {
        // Se falhar, tentar formato YYYYMMDDHHMMSS
        if (value.length === 14) {
          const year = value.substring(0, 4)
          const month = value.substring(4, 6)
          const day = value.substring(6, 8)
          const hour = value.substring(8, 10)
          const minute = value.substring(10, 12)
          const second = value.substring(12, 14)
          return `${day}/${month}/${year} ${hour}:${minute}:${second}`
        }
      }

      return value
    },

    dateOnly: (value: string) => {
      if (!value) {
        return ''
      }
      // Formato YYYYMMDDHHMMSS para DD/MM/YYYY
      if (value.length === 14) {
        const year = value.substring(0, 4)
        const month = value.substring(4, 6)
        const day = value.substring(6, 8)
        return `${day}/${month}/${year}`
      }
      return value
    },

    boolean: (value: boolean | string) => {
      if (typeof value === 'string') {
        return value === 'S' || value === 'true' || value === '1' ? 'Sim' : 'Não'
      }
      return value ? 'Sim' : 'Não'
    },

    phone: (value: string) => {
      if (!value) {
        return ''
      }
      // Formatar telefone brasileiro
      const digits = value.replace(/\D/g, '')
      if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`
      }
      if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`
      }
      return value
    },

    object: (value: any) => {
      if (!value || typeof value !== 'object') {
        return value || ''
      }
      // Se for um objeto com id e descrição, formatar como "ID - Descrição"
      if ('id' in value && ('descricao' in value || 'nome' in value)) {
        const desc = value.descricao || value.nome || ''
        return value.id ? `${value.id} - ${desc}` : desc
      }
      // Senão, retornar JSON
      return JSON.stringify(value)
    },
  }
}

/**
 * Configurações de colunas para endpoints específicos
 */
export const EndpointColumns = {
  clientes: [
    // Identificação
    { key: 'idCliente', label: 'ID Cliente', width: 12 },
    { key: 'nome', label: 'Nome', width: 35 },
    { key: 'nomeFantasia', label: 'Nome Fantasia', width: 30 },

    // Documentos
    { key: 'cpf', label: 'CPF', width: 18 },
    { key: 'cnpj', label: 'CNPJ', width: 20 },
    { key: 'rg', label: 'RG', width: 15 },

    // Dados Pessoais
    { key: 'dataNascimento', label: 'Data Nascimento', width: 15, formatter: ExcelExporter.formatters.dateOnly },
    { key: 'genero', label: 'Gênero', width: 12 },
    { key: 'estadoCivil', label: 'Estado Civil', width: 15 },

    // Contato
    { key: 'email', label: 'Email', width: 30 },
    { key: 'telefone', label: 'Telefone', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'celular', label: 'Celular', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'fax', label: 'Fax', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'whatsApp', label: 'WhatsApp', width: 12, formatter: ExcelExporter.formatters.boolean },
    { key: 'website', label: 'Website', width: 25 },

    // Endereço Completo
    { key: 'logradouro', label: 'Logradouro', width: 30 },
    { key: 'complemento', label: 'Complemento', width: 20 },
    { key: 'bairro', label: 'Bairro', width: 20 },
    { key: 'cidade', label: 'Cidade', width: 20 },
    { key: 'uf', label: 'UF', width: 8 },
    { key: 'pais', label: 'País', width: 15 },
    { key: 'cep', label: 'CEP', width: 12 },

    // Relacionamentos (ID + Nome)
    { key: 'idVendedor', label: 'ID Vendedor', width: 12 },
    { key: 'nomeVendedor', label: 'Nome Vendedor', width: 25 },
    { key: 'idLoja', label: 'ID Loja', width: 10 },
    { key: 'nomeLoja', label: 'Nome Loja', width: 20 },

    // Datas de Sistema
    { key: 'dataCadastro', label: 'Data Cadastro', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataAlteracao', label: 'Última Alteração', width: 18, formatter: ExcelExporter.formatters.date },

    // Dados de Vendas (corrigido nome do campo)
    { key: 'dataPrimeraCompra', label: 'Primeira Compra', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataUltimaCompra', label: 'Última Compra', width: 18, formatter: ExcelExporter.formatters.date },

    // Status e Observações
    { key: 'ativo', label: 'Ativo', width: 10, formatter: ExcelExporter.formatters.boolean },
    { key: 'observacoes', label: 'Observações', width: 40 },
  ] as ExcelColumn[],

  lojas: [
    // Identificação
    { key: 'idLoja', label: 'ID Loja', width: 10 },
    { key: 'codigo', label: 'Código', width: 15 },
    { key: 'nomeReduzido', label: 'Nome Reduzido', width: 25 },
    { key: 'razaoSocial', label: 'Razão Social', width: 40 },
    { key: 'cnpj', label: 'CNPJ', width: 20 },

    // Status
    { key: 'ativa', label: 'Ativa', width: 10, formatter: ExcelExporter.formatters.boolean },
    { key: 'bloqueada', label: 'Bloqueada', width: 12, formatter: ExcelExporter.formatters.boolean },
    { key: 'atividade', label: 'Código Atividade', width: 15 },

    // Endereço Completo
    { key: 'logradouro', label: 'Logradouro', width: 30 },
    { key: 'numero', label: 'Número', width: 10 },
    { key: 'complemento', label: 'Complemento', width: 20 },
    { key: 'bairro', label: 'Bairro', width: 20 },
    { key: 'cidade', label: 'Cidade', width: 20 },
    { key: 'uf', label: 'UF', width: 8 },
    { key: 'cep', label: 'CEP', width: 12 },
    { key: 'pais', label: 'País', width: 15 },

    // Contatos
    { key: 'email', label: 'Email', width: 30 },
    { key: 'telefone', label: 'Telefone', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'celular', label: 'Celular', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'fax', label: 'Fax', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'website', label: 'Website', width: 25 },

    // Datas de Sistema
    { key: 'dataCadastro', label: 'Data Cadastro', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataAlteracao', label: 'Última Alteração', width: 18, formatter: ExcelExporter.formatters.date },
  ] as ExcelColumn[],

  produtos: [
    // Identificação
    { key: 'idProduto', label: 'ID Produto', width: 12 },
    { key: 'codigo', label: 'Código', width: 20 },
    { key: 'codigoBarras', label: 'Código Barras', width: 20 },
    { key: 'codigoFabrica', label: 'Código Fábrica', width: 20 },
    { key: 'descricao', label: 'Descrição', width: 50 },

    // Relacionamentos (ID + Nome)
    { key: 'codGrupo', label: 'ID Grupo', width: 12 },
    { key: 'grupo', label: 'Nome Grupo', width: 25 },
    { key: 'idMarca', label: 'ID Marca', width: 12 },
    { key: 'marca', label: 'Nome Marca', width: 20 },
    { key: 'codFornecedor', label: 'ID Fornecedor', width: 12 },
    { key: 'fornecedor', label: 'Nome Fornecedor', width: 30 },
    { key: 'idModelo', label: 'ID Modelo', width: 12 },
    { key: 'modelo', label: 'Modelo', width: 25 },
    { key: 'idCor', label: 'ID Cor', width: 12 },
    { key: 'cor', label: 'Cor', width: 20 },
    { key: 'tamanho', label: 'Tamanho', width: 15 },
    { key: 'colecao', label: 'Coleção', width: 20 },

    // Preços
    { key: 'precoCusto', label: 'Preço Custo', width: 15, formatter: ExcelExporter.formatters.currency },
    { key: 'precoVarejo', label: 'Preço Varejo', width: 15, formatter: ExcelExporter.formatters.currency },
    { key: 'precoAtacado', label: 'Preço Atacado', width: 15, formatter: ExcelExporter.formatters.currency },

    // Datas de Sistema
    { key: 'dataCadastro', label: 'Data Cadastro', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataAlteracao', label: 'Última Alteração', width: 18, formatter: ExcelExporter.formatters.date },

    // Status e Loja
    { key: 'ativo', label: 'Ativo', width: 10, formatter: ExcelExporter.formatters.boolean },
    { key: 'idLoja', label: 'ID Loja', width: 10 },
    { key: 'lojaNome', label: 'Nome Loja', width: 20 },
  ] as ExcelColumn[],

  vendedores: [
    // Identificação
    { key: 'idVendedor', label: 'ID Vendedor', width: 12 },
    { key: 'nome', label: 'Nome', width: 35 },
    { key: 'funcao', label: 'Função', width: 12 },
    { key: 'taxa', label: 'Taxa (%)', width: 12, formatter: ExcelExporter.formatters.number },

    // Status
    { key: 'ativo', label: 'Ativo', width: 10, formatter: ExcelExporter.formatters.boolean },
    { key: 'bloqueado', label: 'Bloqueado', width: 12, formatter: ExcelExporter.formatters.boolean },

    // Documentos
    { key: 'tipoPessoa', label: 'Tipo Pessoa', width: 12 },
    { key: 'cpf', label: 'CPF', width: 18 },
    { key: 'cnpj', label: 'CNPJ', width: 20 },

    // Contatos
    { key: 'email', label: 'Email', width: 30 },
    { key: 'telefone', label: 'Telefone', width: 18, formatter: ExcelExporter.formatters.phone },
    { key: 'celular', label: 'Celular', width: 18, formatter: ExcelExporter.formatters.phone },

    // Endereço
    { key: 'endereco', label: 'Endereço', width: 30 },
    { key: 'bairro', label: 'Bairro', width: 20 },
    { key: 'cidade', label: 'Cidade', width: 20 },
    { key: 'uf', label: 'UF', width: 8 },
    { key: 'cep', label: 'CEP', width: 12 },

    // Datas de Sistema
    { key: 'dataCadastro', label: 'Data Cadastro', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataAlteracao', label: 'Última Alteração', width: 18, formatter: ExcelExporter.formatters.date },

    // Loja
    { key: 'idLoja', label: 'ID Loja', width: 10 },
    { key: 'lojaNome', label: 'Nome Loja', width: 20 },
  ] as ExcelColumn[],

  vendas: [
    // Identificação
    { key: 'idVenda', label: 'ID Venda', width: 12 },
    { key: 'cf', label: 'CF/Documento', width: 15 },

    // Relacionamentos (ID + Nome) - Padrão PontoMarket
    { key: 'idLoja', label: 'ID Loja', width: 10 },
    { key: 'lojaNome', label: 'Nome Loja', width: 20 },
    { key: 'idVendedor', label: 'ID Vendedor', width: 12 },
    { key: 'vendedorNome', label: 'Nome Vendedor', width: 25 },
    { key: 'idCliente', label: 'ID Cliente', width: 12 },
    { key: 'clienteNome', label: 'Nome Cliente', width: 30 },

    // Datas
    { key: 'dataCompra', label: 'Data Compra', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataCancelamento', label: 'Data Cancelamento', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataCadastro', label: 'Data Cadastro', width: 18, formatter: ExcelExporter.formatters.date },
    { key: 'dataAlteracao', label: 'Última Alteração', width: 18, formatter: ExcelExporter.formatters.date },

    // Valores
    { key: 'precoLiquido', label: 'Preço Líquido', width: 15, formatter: ExcelExporter.formatters.currency },

    // Outros
    { key: 'status', label: 'Status', width: 12 },
    { key: 'cfop', label: 'CFOP', width: 10 },
    { key: 'observacoes', label: 'Observações', width: 30 },
  ] as ExcelColumn[],
}