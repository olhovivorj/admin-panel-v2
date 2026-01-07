import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface UseOperationToastOptions<TData, TError, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
  loadingMessage: string
  successMessage: string | ((data: TData, variables: TVariables) => string)
  errorMessage?: string | ((error: TError, variables: TVariables) => string)
  toastId?: string | ((variables: TVariables) => string)
}

export function useOperationToast<TData = unknown, TError = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  loadingMessage,
  successMessage,
  errorMessage = 'Erro na operação',
  toastId,
}: UseOperationToastOptions<TData, TError, TVariables>) {

  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      const id = typeof toastId === 'function' ? toastId(variables) : toastId
      toast.loading(loadingMessage, { id })
      return { toastId: id }
    },
    onSuccess: (data, variables, context) => {
      const id = context?.toastId
      if (id) {
        toast.dismiss(id)
      }

      const message = typeof successMessage === 'function'
        ? successMessage(data, variables)
        : successMessage

      toast.success(message)
      onSuccess?.(data, variables)
    },
    onError: (error, variables, context) => {
      const id = context?.toastId
      if (id) {
        toast.dismiss(id)
      }

      const message = typeof errorMessage === 'function'
        ? errorMessage(error as TError, variables)
        : errorMessage

      toast.error(message)
      onError?.(error as TError, variables)
    },
  })
}