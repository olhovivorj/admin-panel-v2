import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface SidebarContextData {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextData>({} as SidebarContextData)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('@ari:sidebarCollapsed')
    return stored === 'true'
  })

  useEffect(() => {
    localStorage.setItem('@ari:sidebarCollapsed', String(isCollapsed))
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
