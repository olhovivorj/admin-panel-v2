import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EndpointConfigModal } from '../EndpointConfigModal';
import { usersService } from '@/services/users';
import toast from 'react-hot-toast';

// Mocks
jest.mock('@/services/users');
jest.mock('react-hot-toast');

const mockUser = {
  id: 1,
  name: 'Test API User',
  email: 'test@api.com',
  tipo_usuario: 'API' as const,
  api_key: 'ak_test123',
  api_secret: null,
  rate_limit_per_hour: 1000,
  permissoes_endpoints: {
    clientes: true,
    produtos: true,
    vendas: false,
  },
  ip_whitelist: ['192.168.1.100', '10.0.0.0/8'],
  ID_BASE: 2,
  status: 'active' as const,
  role: 'user' as const,
  ativo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderComponent = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <EndpointConfigModal
        user={mockUser}
        isOpen={true}
        onClose={jest.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
};

describe('EndpointConfigModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Configurações Avançadas de API')).toBeInTheDocument();
      expect(screen.getByText('Test API User - test@api.com')).toBeInTheDocument();
    });

    it('should not render for non-API users', () => {
      const normalUser = { ...mockUser, tipo_usuario: 'NORMAL' as const };
      const { container } = renderComponent({ user: normalUser });
      
      expect(container.firstChild).toBeNull();
    });

    it('should render three tabs', () => {
      renderComponent();
      
      expect(screen.getByText('Endpoints e Limites')).toBeInTheDocument();
      expect(screen.getByText('Segurança')).toBeInTheDocument();
      expect(screen.getByText('Histórico')).toBeInTheDocument();
    });
  });

  describe('Security Tab - IP Whitelist', () => {
    beforeEach(() => {
      renderComponent();
      // Navegar para aba de Segurança
      fireEvent.click(screen.getByText('Segurança'));
    });

    it('should display existing IP whitelist', () => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.0/8')).toBeInTheDocument();
      expect(screen.getByText('(Range)')).toBeInTheDocument();
    });

    it('should add new IP to whitelist', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');
      const addButton = screen.getByRole('button', { name: /adicionar/i });

      await user.type(input, '172.16.0.1');
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('IP adicionado à whitelist');
      });
    });

    it('should validate IP format', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');
      const addButton = screen.getByRole('button', { name: /adicionar/i });

      await user.type(input, '999.999.999.999');
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('IP inválido. Use formato: 192.168.1.100 ou 192.168.1.0/24');
      });
    });

    it('should validate CIDR format', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');
      const addButton = screen.getByRole('button', { name: /adicionar/i });

      await user.type(input, '192.168.1.0/33'); // Invalid CIDR
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('IP inválido. Use formato: 192.168.1.100 ou 192.168.1.0/24');
      });
    });

    it('should prevent duplicate IPs', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');
      const addButton = screen.getByRole('button', { name: /adicionar/i });

      await user.type(input, '192.168.1.100'); // Already exists
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Este IP já está na lista');
      });
    });

    it('should remove IP from whitelist', async () => {
      const user = userEvent.setup();
      const removeButtons = screen.getAllByTitle('Remover IP');
      
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('IP removido da whitelist');
        expect(screen.queryByText('192.168.1.100')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no IPs configured', async () => {
      const userWithoutWhitelist = { ...mockUser, ip_whitelist: [] };
      renderComponent({ user: userWithoutWhitelist });
      
      fireEvent.click(screen.getByText('Segurança'));

      expect(screen.getByText('Nenhuma restrição de IP configurada')).toBeInTheDocument();
      expect(screen.getByText('Qualquer IP poderá acessar esta API')).toBeInTheDocument();
    });

    it('should add IP on Enter key press', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');

      await user.type(input, '172.16.0.1{Enter}');

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('IP adicionado à whitelist');
      });
    });
  });

  describe('Saving Configuration', () => {
    it('should save IP whitelist changes', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      (usersService.updateUser as jest.Mock).mockResolvedValue({});

      renderComponent({ onClose });
      
      // Navegar para aba de Segurança
      fireEvent.click(screen.getByText('Segurança'));
      
      // Adicionar novo IP
      const input = screen.getByPlaceholderText('Ex: 192.168.1.100 ou 192.168.1.0/24');
      await user.type(input, '172.16.0.1');
      await user.click(screen.getByRole('button', { name: /adicionar/i }));

      // Salvar
      const saveButton = screen.getByRole('button', { name: /salvar configurações/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(usersService.updateUser).toHaveBeenCalledWith(1, {
          permissions: expect.any(Object),
          ip_whitelist: ['192.168.1.100', '10.0.0.0/8', '172.16.0.1'],
        });
        expect(toast.success).toHaveBeenCalledWith('Configurações atualizadas com sucesso!');
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should handle save errors', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      (usersService.updateUser as jest.Mock).mockRejectedValue(error);

      renderComponent();
      
      const saveButton = screen.getByRole('button', { name: /salvar configurações/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar configurações');
      });
    });

    it('should clear whitelist when all IPs removed', async () => {
      const user = userEvent.setup();
      (usersService.updateUser as jest.Mock).mockResolvedValue({});

      renderComponent();
      
      // Navegar para aba de Segurança
      fireEvent.click(screen.getByText('Segurança'));
      
      // Remover todos os IPs
      const removeButtons = screen.getAllByTitle('Remover IP');
      for (const button of removeButtons) {
        await user.click(button);
      }

      // Salvar
      const saveButton = screen.getByRole('button', { name: /salvar configurações/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(usersService.updateUser).toHaveBeenCalledWith(1, {
          permissions: expect.any(Object),
          ip_whitelist: null,
        });
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      renderComponent({ onClose });
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when X button clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      renderComponent({ onClose });
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should disable save button on History tab', () => {
      renderComponent();
      
      // Navegar para aba de Histórico
      fireEvent.click(screen.getByText('Histórico'));
      
      const saveButton = screen.getByRole('button', { name: /salvar configurações/i });
      expect(saveButton).toBeDisabled();
    });
  });
});