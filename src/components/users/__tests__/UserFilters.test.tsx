/**
 * Testes unitários para UserFilters
 * Cobre funcionalidades de filtros avançados e tags visuais
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserFilters } from '../UserFilters'
import { IUserFilters } from '@/interfaces/user'

// Mock dos ícones
jest.mock('@heroicons/react/24/outline', () => ({
  FunnelIcon: () => <span>FunnelIcon</span>,
  XMarkIcon: () => <span>XMarkIcon</span>,
  ChevronDownIcon: () => <span>ChevronDownIcon</span>,
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

describe('UserFilters', () => {
  const mockOnFiltersChange = jest.fn()
  const defaultFilters: IUserFilters = {}

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderização', () => {
    it('deve renderizar o botão de filtros', () => {
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.getByRole('button', { name: /filtros/i })).toBeInTheDocument()
      expect(screen.getByText('FunnelIcon')).toBeInTheDocument()
    })

    it('deve mostrar contador de filtros ativos', () => {
      const activeFilters: IUserFilters = {
        tipo_usuario: 'NORMAL',
        status: 'active',
        role: 'user'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Deve mostrar badge com número 3
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('não deve mostrar contador quando não há filtros', () => {
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Não deve haver badge numérico
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
    })
  })

  describe('Menu Dropdown', () => {
    it('deve abrir o menu ao clicar no botão', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const button = screen.getByRole('button', { name: /filtros/i })
      await user.click(button)

      // Verificar se o menu está visível
      expect(screen.getByText(/tipo de usuário/i)).toBeInTheDocument()
      expect(screen.getByText(/status/i)).toBeInTheDocument()
      expect(screen.getByText(/perfil/i)).toBeInTheDocument()
    })

    it('deve fechar o menu ao clicar fora', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      const button = screen.getByRole('button', { name: /filtros/i })
      await user.click(button)
      expect(screen.getByText(/tipo de usuário/i)).toBeInTheDocument()

      // Clicar fora
      await user.click(document.body)

      // Menu deve fechar
      await waitFor(() => {
        expect(screen.queryByText(/tipo de usuário/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Aplicação de Filtros', () => {
    it('deve aplicar filtro de tipo de usuário', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Selecionar tipo NORMAL
      const tipoSelect = screen.getByLabelText(/tipo de usuário/i) as HTMLSelectElement
      await user.selectOptions(tipoSelect, 'NORMAL')

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          tipo_usuario: 'NORMAL'
        })
      })
    })

    it('deve aplicar filtro de status', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Selecionar status ativo
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
      await user.selectOptions(statusSelect, 'active')

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          status: 'active'
        })
      })
    })

    it('deve aplicar filtro de perfil', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Selecionar perfil admin
      const roleSelect = screen.getByLabelText(/perfil/i) as HTMLSelectElement
      await user.selectOptions(roleSelect, 'admin')

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          role: 'admin'
        })
      })
    })

    it('deve aplicar múltiplos filtros', async () => {
      const user = userEvent.setup()
      
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Aplicar múltiplos filtros
      await user.selectOptions(screen.getByLabelText(/tipo de usuário/i), 'API')
      await user.selectOptions(screen.getByLabelText(/status/i), 'inactive')

      // Deve ter sido chamado duas vezes com valores acumulados
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2)
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        tipo_usuario: 'API',
        status: 'inactive'
      })
    })
  })

  describe('Tags de Filtros', () => {
    it('deve mostrar tags para filtros ativos', () => {
      const activeFilters: IUserFilters = {
        tipo_usuario: 'NORMAL',
        status: 'active'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.getByText('Tipo: Operador')).toBeInTheDocument()
      expect(screen.getByText('Status: Ativo')).toBeInTheDocument()
    })

    it('deve remover filtro ao clicar no X da tag', async () => {
      const user = userEvent.setup()
      const activeFilters: IUserFilters = {
        tipo_usuario: 'API',
        status: 'active'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Encontrar e clicar no X da tag de tipo
      const tipoTag = screen.getByText('Tipo: API').closest('span')
      const removeButton = tipoTag?.querySelector('button')
      
      if (removeButton) {
        await user.click(removeButton)
      }

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          status: 'active' // Apenas status deve permanecer
        })
      })
    })

    it('deve mostrar labels corretos para cada valor', () => {
      const activeFilters: IUserFilters = {
        tipo_usuario: 'API',
        status: 'inactive',
        role: 'admin'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.getByText('Tipo: API')).toBeInTheDocument()
      expect(screen.getByText('Status: Inativo')).toBeInTheDocument()
      expect(screen.getByText('Perfil: Administrador')).toBeInTheDocument()
    })
  })

  describe('Limpar Filtros', () => {
    it('deve mostrar botão limpar quando há filtros', () => {
      const activeFilters: IUserFilters = {
        tipo_usuario: 'NORMAL'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.getByText('Limpar filtros')).toBeInTheDocument()
    })

    it('não deve mostrar botão limpar sem filtros', () => {
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument()
    })

    it('deve limpar todos os filtros ao clicar em limpar', async () => {
      const user = userEvent.setup()
      const activeFilters: IUserFilters = {
        tipo_usuario: 'API',
        status: 'active',
        role: 'user'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const clearButton = screen.getByText('Limpar filtros')
      await user.click(clearButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })

  describe('Estilos e Temas', () => {
    it('deve aplicar classes corretas para tema claro', () => {
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const button = screen.getByRole('button', { name: /filtros/i })
      expect(button).toHaveClass('bg-white', 'text-gray-700')
    })

    it('deve aplicar classes para hover', () => {
      render(
        <UserFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const button = screen.getByRole('button', { name: /filtros/i })
      expect(button).toHaveClass('hover:bg-gray-50')
    })

    it('deve ter aparência destacada com filtros ativos', () => {
      const activeFilters: IUserFilters = {
        tipo_usuario: 'NORMAL'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const badge = screen.getByText('1')
      expect(badge).toHaveClass('bg-indigo-600', 'text-white')
    })
  })

  describe('Comportamento dos Selects', () => {
    it('deve resetar select ao selecionar "Todos"', async () => {
      const user = userEvent.setup()
      const activeFilters: IUserFilters = {
        tipo_usuario: 'NORMAL'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Selecionar "Todos"
      const tipoSelect = screen.getByLabelText(/tipo de usuário/i)
      await user.selectOptions(tipoSelect, '')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })

    it('deve manter valores selecionados ao reabrir menu', async () => {
      const user = userEvent.setup()
      const activeFilters: IUserFilters = {
        tipo_usuario: 'API',
        status: 'active'
      }

      render(
        <UserFilters
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Abrir menu
      await user.click(screen.getByRole('button', { name: /filtros/i }))

      // Verificar valores selecionados
      const tipoSelect = screen.getByLabelText(/tipo de usuário/i) as HTMLSelectElement
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
      
      expect(tipoSelect.value).toBe('API')
      expect(statusSelect.value).toBe('active')
    })
  })
})
