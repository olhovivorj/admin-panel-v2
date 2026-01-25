import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usersService, UsuarioResponseDto } from '@/services/users'
import toast from 'react-hot-toast'

// Hook temporário para editar usuários de outras bases
export function useUserEdit() {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const editUserCrossBase = useCallback(async (userId: number) => {
    setIsLoading(true)
    try {
      // Primeiro, buscar o usuário sem o interceptor problemático
      const userResponse = await usersService.getUser(userId)
      
      if (!userResponse) {
        throw new Error('Usuário não encontrado')
      }

      return userResponse
    } catch (error: any) {
      // Se der 401, tentar fazer login novamente
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 1000)
      } else {
        toast.error('Erro ao buscar usuário')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    editUserCrossBase,
    isLoading
  }
}