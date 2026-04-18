import { useState, useEffect, useCallback, useRef } from 'react'
import {
  initVisitorData,
  clearVisitorData,
  checkExpiration,
  isVisitorActive,
} from '@/lib/visitor/visitorStorageManager'

const CHECK_INTERVAL_MS = 30_000 // checa expiração a cada 30s

type UseVisitorSession = {
  isVisitor: boolean
  timeRemaining: number | null // segundos restantes
  enterVisitorMode: () => void
  exitVisitorMode: () => void
  resetVisitorData: () => void
}

export function useVisitorSession(): UseVisitorSession {
  const [isVisitor, setIsVisitor] = useState<boolean>(() => isVisitorActive())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    intervalRef.current = setInterval(() => {
      const expired = checkExpiration()
      if (expired) {
        setIsVisitor(false)
        setTimeRemaining(null)
        stopTimer()
        return
      }
      const ts = localStorage.getItem('visitor_timestamp')
      if (ts) {
        const elapsed = Date.now() - parseInt(ts, 10)
        const remaining = Math.max(0, 3600 - Math.floor(elapsed / 1000))
        setTimeRemaining(remaining)
      }
    }, CHECK_INTERVAL_MS)
  }, [stopTimer])

  const enterVisitorMode = useCallback(() => {
    initVisitorData()
    setIsVisitor(true)
    setTimeRemaining(3600)
    startTimer()
  }, [startTimer])

  const exitVisitorMode = useCallback(() => {
    clearVisitorData()
    setIsVisitor(false)
    setTimeRemaining(null)
    stopTimer()
    window.location.href = '/login'
  }, [stopTimer])

  const resetVisitorData = useCallback(() => {
    initVisitorData()
    setTimeRemaining(3600)
  }, [])

  // Restaura o timer se a página for recarregada e o visitante ainda estiver ativo
  useEffect(() => {
    if (isVisitor) {
      startTimer()
    }
    return () => stopTimer()
  }, [isVisitor, startTimer, stopTimer])

  return { isVisitor, timeRemaining, enterVisitorMode, exitVisitorMode, resetVisitorData }
}
