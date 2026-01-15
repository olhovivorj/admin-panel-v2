/**
 * Testes unitários para UserFormModal
 * Cobre validações, máscaras e comportamentos do formulário
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserFormModal } from '../UserFormModal'
import { UsuarioResponseDto } from '@/services/users'

// Mock dos contextos
jest.mock('@/contexts/BaseContext', () => ({
  useBase: () => ({
    selectedBaseId: 49,
    selectedBase: { ID_BASE: 49, NOME: 'Qualina' }
  })
}))

jest.mock('@invistto/auth-react', () => ({
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
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getLojasBySysUser: jest.fn().mockResolvedValue({ data: [] })
  }
}))

// Mock do toast
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
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

describe('UserFormModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Renderização', () => {
    it('deve renderizar o modal quando aberto', () => {
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      expect(screen.getByText('Novo Usuário')).toBeInTheDocument()
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    })

    it('deve mostrar título correto para edição', () => {
      const user: UsuarioResponseDto = {
        id: 1,
        name: 'Teste',
        email: 'teste@example.com',
        tipo_usuario: 'NORMAL',
        role: 'user',
        status: 'active',
        baseId: 49,
        baseInfo: { id: 49, name: 'Qualina', description: '', hasAccess: true },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isOnline: false
      }

      renderWithProviders(
        <UserFormModal
          user={user}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      expect(screen.getByText('Editar Usuário')).toBeInTheDocument()
    })

    it('deve mostrar campos específicos para usuário API', () => {
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="API"
        />
      )

      expect(screen.getByText('🔗 Usuário API')).toBeInTheDocument()
      // Não deve mostrar campo de perfil para usuário API
      expect(screen.queryByLabelText(/perfil/i)).not.toBeInTheDocument()
    })
  })

  describe('Validações', () => {
    it('deve validar nome mínimo', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const nameInput = screen.getByLabelText(/nome/i)
      await user.type(nameInput, 'AB')
      
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/nome deve ter pelo menos 3 caracteres/i)).toBeInTheDocument()
      })
    })

    it('deve validar email inválido', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'email-invalido')
      
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      })
    })

    it('deve converter email para minúsculas', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      await user.type(emailInput, 'TESTE@EXAMPLE.COM')
      
      expect(emailInput.value).toBe('teste@example.com')
    })

    it('deve validar senha mínima', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const passwordInput = screen.getByLabelText(/senha/i)
      await user.type(passwordInput, '12345')
      
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument()
      })
    })
  })

  describe('Máscara de telefone', () => {
    it('deve aplicar máscara de telefone', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
      await user.type(phoneInput, '11999999999')
      
      // A máscara deve formatar o número
      expect(phoneInput.value).toBe('(11) 99999-9999')
    })

    it('deve validar telefone inválido', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const phoneInput = screen.getByLabelText(/telefone/i)
      await user.type(phoneInput, '119999')
      
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/telefone inválido/i)).toBeInTheDocument()
      })
    })
  })

  describe('Visualização de senha', () => {
    it('deve alternar visualização de senha', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement
      expect(passwordInput.type).toBe('password')

      // Encontrar e clicar no botão de visualizar senha
      const toggleButton = screen.getByRole('button', { name: /visualizar senha/i })
      await user.click(toggleButton)

      expect(passwordInput.type).toBe('text')

      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('SysUserSelector', () => {
    it('deve mostrar SysUserSelector para usuário NORMAL', () => {
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      expect(screen.getByText(/usuário do sistema erp/i)).toBeInTheDocument()
    })

    it('não deve mostrar SysUserSelector para usuário API', () => {
      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="API"
        />
      )

      expect(screen.queryByText(/usuário do sistema erp/i)).not.toBeInTheDocument()
    })
  })

  describe('Submissão do formulário', () => {
    it('deve criar usuário NORMAL com sucesso', async () => {
      const user = userEvent.setup()
      const { usersService } = await import('@/services/users')
      
      (usersService.createUser as any).mockResolvedValueOnce({
        id: 1,
        name: 'Novo Usuário',
        email: 'novo@example.com'
      })

      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome/i), 'Novo Usuário')
      await user.type(screen.getByLabelText(/email/i), 'novo@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'senha123')
      
      // Submeter
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(usersService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Novo Usuário',
            email: 'novo@example.com',
            password: 'senha123',
            tipo_usuario: 'NORMAL'
          })
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('deve criar usuário API com sucesso', async () => {
      const user = userEvent.setup()
      const { usersService } = await import('@/services/users')
      
      (usersService.createUser as any).mockResolvedValueOnce({
        id: 2,
        name: 'API User',
        email: 'api@example.com',
        tipo_usuario: 'API',
        api_key: 'ak_test123',
        api_secret: 'secret123'
      })

      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="API"
        />
      )

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome/i), 'API User')
      await user.type(screen.getByLabelText(/email/i), 'api@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'senha123')
      
      // Submeter
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(usersService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'API User',
            email: 'api@example.com',
            password: 'senha123',
            tipo_usuario: 'API'
          })
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('deve atualizar usuário existente', async () => {
      const user = userEvent.setup()
      const { usersService } = await import('@/services/users')
      
      const existingUser: UsuarioResponseDto = {
        id: 1,
        name: 'Usuário Existente',
        email: 'existente@example.com',
        telefone: '11999999999',
        tipo_usuario: 'NORMAL',
        role: 'user',
        status: 'active',
        baseId: 49,
        baseInfo: { id: 49, name: 'Qualina', description: '', hasAccess: true },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isOnline: false
      }

      (usersService.updateUser as any).mockResolvedValueOnce({
        ...existingUser,
        name: 'Nome Atualizado'
      })

      renderWithProviders(
        <UserFormModal
          user={existingUser}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      // Limpar e atualizar nome
      const nameInput = screen.getByLabelText(/nome/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Nome Atualizado')
      
      // Submeter
      const submitButton = screen.getByRole('button', { name: /salvar alterações/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(usersService.updateUser).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Nome Atualizado'
          })
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Tratamento de erros', () => {
    it('deve mostrar erro ao falhar criação', async () => {
      const user = userEvent.setup()
      const { usersService } = await import('@/services/users')
      const toast = (await import('react-hot-toast')).default
      
      (usersService.createUser as any).mockRejectedValueOnce(
        new Error('Email já existe')
      )

      renderWithProviders(
        <UserFormModal
          user={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          userType="NORMAL"
        />
      )

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome/i), 'Teste')
      await user.type(screen.getByLabelText(/email/i), 'teste@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'senha123')
      
      // Submeter
      const submitButton = screen.getByRole('button', { name: /criar usuário/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Email já existe')
        )
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })
  })
})