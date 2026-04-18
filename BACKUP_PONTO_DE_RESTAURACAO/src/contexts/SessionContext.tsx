import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react'
import { useAuth } from './AuthContext'

interface SessionContextType {
  timeLeft: number
  totalDuration: number
  isWarning: boolean
  resetTimer: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const WARNING_THRESHOLD_SECONDS = 600 // 10 minutes
const DEFAULT_TIMEOUT_MINUTES = 60

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { user, logout, isAuthenticated } = useAuth()
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalDuration, setTotalDuration] = useState(
    DEFAULT_TIMEOUT_MINUTES * 60,
  )
  const [isWarning, setIsWarning] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize total duration based on user preference
  useEffect(() => {
    if (user?.inactivity_timeout) {
      setTotalDuration(user.inactivity_timeout * 60)
    } else {
      setTotalDuration(DEFAULT_TIMEOUT_MINUTES * 60)
    }
  }, [user?.inactivity_timeout])

  const resetTimer = useCallback(() => {
    setTimeLeft(totalDuration)
    setIsWarning(false)
  }, [totalDuration])

  // Initialize timer on auth or config change
  useEffect(() => {
    if (isAuthenticated) {
      resetTimer()
    }
  }, [isAuthenticated, totalDuration, resetTimer])

  // Listen for activity
  useEffect(() => {
    if (!isAuthenticated) return

    const handleActivity = () => {
      // Only reset automatically if NOT in warning state
      // If in warning state, user must explicitly confirm via dialog
      if (!isWarning) {
        // We debounce the state update slightly to avoid excessive re-renders on mousemove
        // But since we are updating a countdown, we can just reset a ref and have the interval check it?
        // To strictly follow the "Visual Session Countdown" requirement, the timer must visually reset.
        // So we call resetTimer.
        // However, updating state on every mousemove is bad.
        // Let's rely on a throttle mechanism or just check lastActivity timestamp.
        // But the user wants to see the countdown reset.
        // So we'll use a throttled reset.
      }
    }

    // Implementing throttled reset
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttledReset = () => {
      if (throttleTimeout) return
      if (!isWarning) {
        resetTimer()
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
        }, 1000) // Throttle to once per second
      }
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, throttledReset)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset)
      })
      if (throttleTimeout) clearTimeout(throttleTimeout)
    }
  }, [isAuthenticated, isWarning, resetTimer])

  // Countdown logic
  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newValue = prev - 1

        if (newValue <= WARNING_THRESHOLD_SECONDS && !isWarning) {
          setIsWarning(true)
        }

        if (newValue <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          logout()
          return 0
        }

        return newValue
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isAuthenticated, logout, isWarning])

  // Sync warning state when timeLeft changes externally (e.g. reset)
  useEffect(() => {
    if (timeLeft > WARNING_THRESHOLD_SECONDS && isWarning) {
      setIsWarning(false)
    }
  }, [timeLeft, isWarning])

  const value = {
    timeLeft,
    totalDuration,
    isWarning,
    resetTimer,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
