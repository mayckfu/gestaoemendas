import * as React from 'react'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

type SidebarState = 'expanded' | 'collapsed'

interface SidebarContextProps {
  state: SidebarState
  isMobile: boolean
  isOpenMobile: boolean
  setOpenMobile: (isOpen: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [state, setState] = useState<SidebarState>(
    (localStorage.getItem('sb_collapsed') as SidebarState) || 'expanded',
  )
  const [isOpenMobile, setOpenMobile] = useState(false)

  const toggleSidebar = useCallback(() => {
    setState((prevState) => {
      const newState = prevState === 'expanded' ? 'collapsed' : 'expanded'
      localStorage.setItem('sb_collapsed', newState)
      return newState
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '[') {
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile])

  const value = {
    state: isMobile ? 'expanded' : state,
    isMobile,
    isOpenMobile,
    setOpenMobile,
    toggleSidebar,
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isMobile, isOpenMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={isOpenMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-60">
          <div
            ref={ref}
            className={cn(
              'flex h-full flex-col border-r bg-card text-card-foreground',
              className,
            )}
            {...props}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'hidden md:flex h-full flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-in-out',
        className,
      )}
      {...props}
    />
  )
})
Sidebar.displayName = 'Sidebar'

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-16 items-center border-b px-4 shrink-0', className)}
    {...props}
  />
))
SidebarHeader.displayName = 'SidebarHeader'

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto', className)}
    {...props}
  />
))
SidebarContent.displayName = 'SidebarContent'

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('space-y-1 p-2', className)} {...props} />
))
SidebarMenu.displayName = 'SidebarMenu'

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>((props, ref) => <li ref={ref} {...props} />)
SidebarMenuItem.displayName = 'SidebarMenuItem'

interface SidebarMenuButtonProps
  extends React.ComponentProps<typeof Button>,
    React.PropsWithChildren<{
      isActive?: boolean
      tooltip?: string
      asChild?: boolean
    }> {}

export const SidebarMenuButton = ({
  isActive,
  tooltip,
  children,
  ...props
}: SidebarMenuButtonProps) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const button = (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start gap-2"
      {...props}
    >
      {children}
    </Button>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-auto border-t p-4', className)} {...props} />
))
SidebarFooter.displayName = 'SidebarFooter'
