/**
 * Testes unitários para UsersList
 * Cobre listagem, ordenação, paginação e exportação
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UsersList } from '../UsersList'
import { UsuarioResponseDto } from '@/services/users'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

// Mock dos contextos
jest.mock('@/contexts/BaseContext', () => ({
  useBase: () => ({
    selectedBaseId: 49,
    selectedBase: { ID_BASE: 49, NOME: 'Qualina' }
  })
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@invistto.com.br', role: 'admin' }
  })
}))

// Mock dos hooks
jest.mock('@/hooks/useSuperAdmin', () => ({
  useSuperAdmin: () => ({
    isSuperAdmin: true,
    canChangeUserType: true
  })
}))

// Mock do serviço de usuários
jest.mock('@/services/users', () => ({
  usersService: {
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
    updateUserStatus: jest.fn()
  }
}))

// Mock do toast
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn((promise, msgs) => promise)
  }
}))

// Mock do XLSX
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
    sheet_add_aoa: jest.fn()
  },
  writeFile: jest.fn()
}))

// Mock do logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

// Mock dos componentes filhos
jest.mock('../UserFormModal', () => ({
  UserFormModal: ({ isOpen, onClose, onSuccess, user }: any) => (
    isOpen ? (
      <div data-testid="user-form-modal">
        <h2>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <button onClick={() => { onSuccess(); onClose(); }}>Salvar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null
  )
}))

jest.mock('../UserFilters', () => ({
  UserFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="user-filters">
      <button onClick={() => onFiltersChange({ tipo_usuario: 'NORMAL' })}>
        Filtrar Normal
      </button>
      <button onClick={() => onFiltersChange({})}>
        Limpar Filtros
      </button>
    </div>
  )
}))

// Helper para renderizar com providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

// Dados de teste
const mockUsers: UsuarioResponseDto[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@invistto.com.br',
    telefone: '11999999999',
    tipo_usuario: 'NORMAL',
    role: 'admin',
    status: 'active',
    baseId: 49,
    baseInfo: { id: 49, name: 'Qualina', description: '', hasAccess: true },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    isOnline: true,
    lastLogin: '2025-01-07T15:30:00Z'
  },
  {
    id: 2,
    name: 'API User',
    email: 'pontomarket@dnp.com.br',
    tipo_usuario: 'API',
    role: 'user',
    status: 'active',
    baseId: 2,
    baseInfo: { id: 2, name: 'DNP', description: '', hasAccess: true },
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    isOnline: false,
    api_key: 'ak_test123',
    rate_limit_per_hour: 5000
  },
  {
    id: 3,
    name: 'Normal User',
    email: 'user@qualina.com.br',
    telefone: '11888888888',
    tipo_usuario: 'NORMAL',
    role: 'user',
    status: 'inactive',
    baseId: 49,
    baseInfo: { id: 49, name: 'Qualina', description: '', hasAccess: true },
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    isOnline: false
  }
]

describe('UsersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { usersService } = require('@/services/users')
    usersService.getUsers.mockResolvedValue({
      data: mockUsers,
      total: 3,
      page: 1,
      pageSize: 10
    })
  })

  describe('Renderização', () => {
    it('deve renderizar a lista de usuários', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
        expect(screen.getByText('API User')).toBeInTheDocument()
        expect(screen.getByText('Normal User')).toBeInTheDocument()
      })
    })

    it('deve mostrar loading durante carregamento', () => {
      renderWithProviders(<UsersList />)
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })

    it('deve mostrar mensagem quando não há usuários', async () => {
      const { usersService } = require('@/services/users')
      usersService.getUsers.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10
      })

      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText(/nenhum usuário encontrado/i)).toBeInTheDocument()
      })
    })

    it('deve mostrar botão de novo usuário', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText(/novo usuário/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tipos de Usuário', () => {
    it('deve mostrar badge para usuário API', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        const apiUserRow = screen.getByText('pontomarket@dnp.com.br').closest('tr')
        if (apiUserRow) {
          expect(within(apiUserRow).getByText('API')).toBeInTheDocument()
        }
      })
    })

    it('deve mostrar badge para usuário NORMAL', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        const normalUserRow = screen.getByText('user@qualina.com.br').closest('tr')
        if (normalUserRow) {
          expect(within(normalUserRow).getByText('Operador')).toBeInTheDocument()
        }
      })
    })

    it('deve mostrar API key para usuário API', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        const apiUserRow = screen.getByText('pontomarket@dnp.com.br').closest('tr')
        if (apiUserRow) {
          expect(within(apiUserRow).getByText(/ak_test/)).toBeInTheDocument()
        }
      })
    })
  })

  describe('Status e Ações', () => {
    it('deve mostrar status ativo/inativo corretamente', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        // Usuário ativo
        const activeRow = screen.getByText('admin@invistto.com.br').closest('tr')
        if (activeRow) {
          expect(within(activeRow).getByText('Ativo')).toBeInTheDocument()
        }

        // Usuário inativo
        const inactiveRow = screen.getByText('user@qualina.com.br').closest('tr')
        if (inactiveRow) {
          expect(within(inactiveRow).getByText('Inativo')).toBeInTheDocument()
        }
      })
    })

    it('deve mostrar indicador online', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        const onlineRow = screen.getByText('admin@invistto.com.br').closest('tr')
        if (onlineRow) {
          // Procura pelo ponto verde de online
          const onlineIndicator = within(onlineRow).getByTitle(/online/i)
          expect(onlineIndicator).toBeInTheDocument()
        }
      })
    })

    it('deve formatar data do último login', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        const adminRow = screen.getByText('admin@invistto.com.br').closest('tr')
        if (adminRow) {
          // Verifica se a data está formatada
          expect(within(adminRow).getByText(/07\/01\/2025/)).toBeInTheDocument()
        }
      })
    })
  })

  describe('Filtros', () => {
    it('deve aplicar filtro de tipo de usuário', async () => {
      const { usersService } = require('@/services/users')
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByTestId('user-filters')).toBeInTheDocument()
      })

      // Clicar no filtro NORMAL
      fireEvent.click(screen.getByText('Filtrar Normal'))

      await waitFor(() => {
        expect(usersService.getUsers).toHaveBeenLastCalledWith(
          expect.objectContaining({
            tipo_usuario: 'NORMAL'
          })
        )
      })
    })

    it('deve limpar filtros', async () => {
      const { usersService } = require('@/services/users')
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByTestId('user-filters')).toBeInTheDocument()
      })

      // Aplicar e depois limpar filtros
      fireEvent.click(screen.getByText('Filtrar Normal'))
      fireEvent.click(screen.getByText('Limpar Filtros'))

      await waitFor(() => {
        expect(usersService.getUsers).toHaveBeenLastCalledWith(
          expect.objectContaining({
            baseId: 49,
            page: 1,
            pageSize: 10
          })
        )
      })
    })
  })

  describe('Paginação', () => {
    it('deve mudar de página', async () => {
      const { usersService } = require('@/services/users')
      usersService.getUsers.mockResolvedValue({
        data: mockUsers,
        total: 30,
        page: 1,
        pageSize: 10
      })

      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument()
      })

      // Clicar em próxima página
      const nextButton = screen.getByLabelText(/próxima página/i)
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(usersService.getUsers).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 2
          })
        )
      })
    })

    it('deve mudar tamanho da página', async () => {
      const { usersService } = require('@/services/users')
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText(/10 por página/i)).toBeInTheDocument()
      })

      // Mudar para 25 por página
      const pageSizeSelect = screen.getByLabelText(/itens por página/i)
      fireEvent.change(pageSizeSelect, { target: { value: '25' } })

      await waitFor(() => {
        expect(usersService.getUsers).toHaveBeenLastCalledWith(
          expect.objectContaining({
            pageSize: 25,
            page: 1
          })
        )
      })
    })
  })

  describe('Ações de Usuário', () => {
    it('deve abrir modal de edição ao clicar em editar', async () => {
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      // Encontrar e clicar no botão de editar
      const adminRow = screen.getByText('admin@invistto.com.br').closest('tr')
      if (adminRow) {
        const editButton = within(adminRow).getByLabelText(/editar/i)
        fireEvent.click(editButton)
      }

      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument()
      expect(screen.getByText('Editar Usuário')).toBeInTheDocument()
    })

    it('deve alternar status do usuário', async () => {
      const { usersService } = require('@/services/users')
      usersService.updateUserStatus.mockResolvedValue({ success: true })

      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Normal User')).toBeInTheDocument()
      })

      // Encontrar e clicar no toggle de status
      const inactiveRow = screen.getByText('user@qualina.com.br').closest('tr')
      if (inactiveRow) {
        const toggleButton = within(inactiveRow).getByRole('switch')
        fireEvent.click(toggleButton)
      }

      await waitFor(() => {
        expect(usersService.updateUserStatus).toHaveBeenCalledWith(3, true)
        expect(toast.success).toHaveBeenCalledWith('Status atualizado com sucesso')
      })
    })

    it('deve deletar usuário com confirmação', async () => {
      const { usersService } = require('@/services/users')
      usersService.deleteUser.mockResolvedValue({ success: true })
      
      // Mock window.confirm
      jest.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Normal User')).toBeInTheDocument()
      })

      // Encontrar e clicar no botão de deletar
      const userRow = screen.getByText('user@qualina.com.br').closest('tr')
      if (userRow) {
        const deleteButton = within(userRow).getByLabelText(/excluir/i)
        fireEvent.click(deleteButton)
      }

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Tem certeza que deseja excluir')
      )

      await waitFor(() => {
        expect(usersService.deleteUser).toHaveBeenCalledWith(3)
        expect(toast.success).toHaveBeenCalledWith('Usuário excluído com sucesso')
      })
    })
  })

  describe('Exportação', () => {
    it('deve mostrar menu de exportação', async () => {
      const user = userEvent.setup()
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      // Clicar no botão de exportar
      const exportButton = screen.getByText(/exportar/i)
      await user.click(exportButton)

      // Verificar opções de exportação
      expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
      expect(screen.getByText('CSV (.csv)')).toBeInTheDocument()
    })

    it('deve exportar para Excel', async () => {
      const user = userEvent.setup()
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      // Abrir menu e clicar em Excel
      const exportButton = screen.getByText(/exportar/i)
      await user.click(exportButton)
      
      const excelOption = screen.getByText('Excel (.xlsx)')
      await user.click(excelOption)

      // Verificar se XLSX foi chamado
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('usuarios_')
      )
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('3 usuários exportados')
      )
    })

    it('deve exportar para CSV', async () => {
      const user = userEvent.setup()
      
      // Mock para criar elemento e download
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      // Abrir menu e clicar em CSV
      const exportButton = screen.getByText(/exportar/i)
      await user.click(exportButton)
      
      const csvOption = screen.getByText('CSV (.csv)')
      await user.click(csvOption)

      // Verificar se CSV foi gerado
      expect(mockLink.download).toContain('.csv')
      expect(mockLink.click).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('3 usuários exportados')
      )
    })
  })

  describe('Ordenação', () => {
    it('deve ordenar por nome', async () => {
      const { usersService } = require('@/services/users')
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      // Clicar no cabeçalho da coluna Nome
      const nameHeader = screen.getByText('Nome').closest('th')
      if (nameHeader) {
        fireEvent.click(nameHeader)
      }

      await waitFor(() => {
        expect(usersService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'name',
            sortOrder: 'asc'
          })
        )
      })
    })

    it('deve alternar ordem de ordenação', async () => {
      const { usersService } = require('@/services/users')
      renderWithProviders(<UsersList />)

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })

      const emailHeader = screen.getByText('Email').closest('th')
      if (emailHeader) {
        // Primeiro clique - ascendente
        fireEvent.click(emailHeader)
        await waitFor(() => {
          expect(usersService.getUsers).toHaveBeenCalledWith(
            expect.objectContaining({
              sortBy: 'email',
              sortOrder: 'asc'
            })
          )
        })

        // Segundo clique - descendente
        fireEvent.click(emailHeader)
        await waitFor(() => {
          expect(usersService.getUsers).toHaveBeenCalledWith(
            expect.objectContaining({
              sortBy: 'email',
              sortOrder: 'desc'
            })
          )
        })
      }
    })
  })

  describe('Responsividade', () => {
    it('deve mostrar layout mobile em telas pequenas', () => {
      // Mock window.matchMedia para simular mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }))
      })

      renderWithProviders(<UsersList />)

      // Em mobile, a tabela deve ter scroll horizontal
      const tableContainer = screen.getByRole('table').parentElement
      expect(tableContainer).toHaveClass('overflow-x-auto')
    })
  })
})
