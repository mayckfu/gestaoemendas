import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface PrivacyContextType {
  isPrivacyMode: boolean
  togglePrivacyMode: () => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('asplan_privacy_mode') === 'true'
  })

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev
      localStorage.setItem('asplan_privacy_mode', String(next))
      return next
    })
  }

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export const usePrivacy = () => {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}
