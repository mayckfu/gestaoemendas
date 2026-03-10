import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  ChevronLeft,
  Bell,
  LogOut,
  Check,
  User as UserIcon,
  Timer,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import { useSession } from '@/contexts/SessionContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatNotificationDate } from '@/lib/date-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GlobalSearch } from '@/components/GlobalSearch'

export const Header = () => {
  const navigate = useNavigate()
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification()
  const { timeLeft, isWarning } = useSession()
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleNotificationClick = async (id: string, emendaId: string) => {
    await markAsRead(id)
    navigate(`/emenda/${emendaId}`)
  }

  // Format time for header display
  const formatTimeHeader = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b border-border bg-white px-4 md:px-6 z-30 shadow-sm transition-all print:hidden">
      <div className="flex items-center gap-3">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-muted"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 transition-transform duration-300',
                state === 'expanded' ? 'rotate-0' : 'rotate-180',
              )}
            />
          </Button>
        )}
        <div className="flex flex-col">
          <span className="font-bold text-lg text-brand-900 leading-tight tracking-tight">
            {isMobile ? 'ASPLAN' : 'CONTROLE DE EMENDAS'}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-xl px-4 hidden md:block">
        <Button
          variant="outline"
          className="relative w-full h-10 justify-start text-sm text-muted-foreground bg-neutral-50 border-transparent hover:bg-neutral-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-100 rounded-full px-4 group"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="inline-flex">Buscar...</span>
          <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Session Timer */}
        <div
          className={cn(
            'hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-colors',
            isWarning
              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              : 'bg-neutral-50 text-neutral-600 border-neutral-200',
          )}
          title="Tempo restante de sessão"
        >
          <Timer className="h-3.5 w-3.5" />
          <span>{formatTimeHeader(timeLeft)}</span>
        </div>

        {/* Mobile Search Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePrivacyMode}
              className="relative text-muted-foreground hover:text-brand-700 hover:bg-brand-50"
              aria-label={
                isPrivacyMode ? 'Mostrar valores' : 'Esconder valores'
              }
            >
              {isPrivacyMode ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPrivacyMode ? 'Mostrar valores' : 'Esconder valores'}</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-brand-700 hover:bg-brand-50"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-white animate-pulse" />
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 shadow-float border-border"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-neutral-50/50">
              <span className="font-semibold text-sm text-brand-900">
                Notificações
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-brand-600 hover:text-brand-800"
                  onClick={(e) => {
                    e.preventDefault()
                    markAllAsRead()
                  }}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                  <p>Nenhuma notificação nova.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'w-full relative group border-b border-border/50 last:border-0 transition-colors',
                        !notification.is_read
                          ? 'bg-brand-50/40'
                          : 'hover:bg-neutral-50',
                      )}
                    >
                      <button
                        className="w-full text-left px-4 py-3 flex items-start gap-3"
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            notification.emenda_id,
                          )
                        }
                      >
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full mt-1.5 shrink-0 transition-colors',
                            !notification.is_read
                              ? 'bg-brand-500'
                              : 'bg-transparent',
                          )}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <p
                            className={cn(
                              'text-sm leading-snug',
                              !notification.is_read
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground',
                            )}
                          >
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                        </div>
                      </button>
                      {!notification.is_read && (
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                              >
                                <Check className="h-3 w-3 text-muted-foreground" />
                                <span className="sr-only">
                                  Marcar como lida
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Marcar como lida</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full border border-border bg-neutral-100 hover:bg-white hover:shadow-sm transition-all"
            >
              <UserIcon className="h-5 w-5 text-brand-700" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-float">
            <DropdownMenuLabel className="font-normal bg-brand-50/50 p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-brand-900">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email || 'email@asplan.gov'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/perfil">
                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
