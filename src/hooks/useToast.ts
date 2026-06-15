import { useState, useCallback, useRef } from 'react'

interface Toast { msg: string; type: 'success' | 'error' | 'info' }

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<any>(null)

  const show = useCallback((msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  return { toast, showToast: show }
}
