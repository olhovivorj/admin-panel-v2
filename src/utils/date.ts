/**
 * Utilitários para formatação de datas
 */

/**
 * Formatar data para exibição no formato brasileiro
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) {
    return '-'
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    return '-'
  }
}

/**
 * Formatar data para exibição apenas data (sem hora)
 */
export const formatDateOnly = (date: string | Date | null | undefined): string => {
  if (!date) {
    return '-'
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj)
  } catch (error) {
    return '-'
  }
}

/**
 * Formatar data para input HTML (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) {
    return ''
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return ''
    }

    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}

/**
 * Calcular tempo relativo (ex: "há 2 horas", "ontem")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) {
    return '-'
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return 'agora'
    }
    if (diffMinutes < 60) {
      return `há ${diffMinutes} min`
    }
    if (diffHours < 24) {
      return `há ${diffHours}h`
    }
    if (diffDays === 1) {
      return 'ontem'
    }
    if (diffDays < 7) {
      return `há ${diffDays} dias`
    }
    if (diffDays < 30) {
      return `há ${Math.floor(diffDays / 7)} semanas`
    }
    if (diffDays < 365) {
      return `há ${Math.floor(diffDays / 30)} meses`
    }

    return `há ${Math.floor(diffDays / 365)} anos`
  } catch (error) {
    return '-'
  }
}

/**
 * Validar se data é válida
 */
export const isValidDate = (date: string | Date | null | undefined): boolean => {
  if (!date) {
    return false
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return !isNaN(dateObj.getTime())
  } catch (error) {
    return false
  }
}