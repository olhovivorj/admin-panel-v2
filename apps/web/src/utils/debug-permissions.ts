/**
 * Utilitário para debug de permissions
 */
export function debugPermissions(context: string, data: any) {
  console.group(`🔍 Debug Permissions - ${context}`)
  console.log('Type:', typeof data)
  console.log('Is Array:', Array.isArray(data))
  console.log('Is Object:', data && typeof data === 'object' && !Array.isArray(data))
  console.log('Value:', data)
  
  if (data === null) {
    console.warn('⚠️ Permissions is null')
  } else if (data === undefined) {
    console.error('❌ Permissions is undefined!')
  } else if (typeof data === 'object') {
    try {
      console.log('Keys:', Object.keys(data))
    } catch (e) {
      console.error('❌ Error getting keys:', e)
    }
  }
  
  console.groupEnd()
}

/**
 * Converte permissions para formato seguro
 */
export function safePermissions(permissions: any): Record<string, boolean> {
  // Se for null/undefined, retorna objeto vazio
  if (!permissions) {
    return {}
  }
  
  // Se já for objeto (não array), retorna ele mesmo
  if (typeof permissions === 'object' && !Array.isArray(permissions)) {
    return permissions
  }
  
  // Se for array, converte para objeto
  if (Array.isArray(permissions)) {
    return permissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {})
  }
  
  // Qualquer outro caso, retorna objeto vazio
  return {}
}