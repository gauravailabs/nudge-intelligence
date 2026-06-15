import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
type Theme = 'light' | 'dark'
interface Ctx { theme: Theme; toggle: () => void }
const ThemeCtx = createContext<Ctx>({ theme: 'dark', toggle: () => {} })
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('nudge-theme') as Theme) ?? 'dark'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('nudge-theme', theme)
  }, [theme])
  return <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
    {children}
  </ThemeCtx.Provider>
}
export const useTheme = () => useContext(ThemeCtx)
