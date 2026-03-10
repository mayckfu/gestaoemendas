import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Home,
  FileText,
  BarChart2,
  Settings,
  Building2,
  LogOut,
  Map,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export const AppSidebar = () => {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { state } = useSidebar()
  const { user, isAdmin, logout } = useAuth()
  const isExpanded = state === 'expanded'

  const yearParam =
    searchParams.get('year') ||
    localStorage.getItem('asplan_dashboard_year') ||
    new Date().getFullYear().toString()

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home, visible: true },
    { href: '/emendas', label: 'Emendas', icon: FileText, visible: true },
    {
      href: '/quadro-estadual',
      label: 'Quadro Estadual',
      icon: Map,
      visible: true,
    },
    {
      href: '/relatorios',
      label: 'Relatórios',
      icon: BarChart2,
      visible: true,
    },
    {
      href: '/pre-lancamento',
      label: 'Contabilis Elaboração',
      icon: Calculator,
      visible: true,
    },
    {
      href: '/admin',
      label: 'Administração',
      icon: Settings,
      visible: isAdmin,
    },
  ]

  const getHref = (baseHref: string) => {
    const preserveYearRoutes = [
      '/',
      '/emendas',
      '/quadro-estadual',
      '/relatorios',
      '/propostas/mac',
      '/propostas/pap',
    ]
    if (preserveYearRoutes.includes(baseHref)) {
      return `${baseHref}?year=${yearParam}`
    }
    return baseHref
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'US'

  return (
    <Sidebar className="border-r border-border bg-white shadow-soft z-40 print:hidden">
      {/* Header with Brand Color */}
      <SidebarHeader className="h-20 flex items-center justify-start border-b border-white/10 bg-brand-700 px-4 shrink-0 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white shadow-sm backdrop-blur-sm">
            <Building2 className="h-6 w-6" />
          </div>
          {isExpanded && (
            <div className="flex flex-col text-white animate-fade-in">
              <span className="font-bold text-sm leading-tight">
                Gestão Emendas
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* User Profile Section */}
      <div
        className={cn(
          'flex flex-col gap-3 px-4 py-6 border-b border-border transition-all bg-brand-50/30',
          !isExpanded && 'items-center px-2',
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-brand-600 text-white font-bold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden animate-fade-in">
              <span className="text-sm font-semibold text-brand-900 truncate">
                {user?.name || 'Usuário'}
              </span>
              <span className="text-xs text-brand-600 uppercase font-medium tracking-wide truncate">
                {user?.role || 'Visitante'}
              </span>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-3 py-6">
        <SidebarMenu className="space-y-1">
          {navLinks
            .filter((link) => link.visible)
            .map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={label}
                    className={cn(
                      'w-full justify-start gap-3 px-4 py-3 rounded-r-lg rounded-l-none transition-all duration-200 group relative overflow-hidden',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-700'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-700 border-l-4 border-transparent',
                    )}
                  >
                    <Link
                      to={getHref(href)}
                      className="flex items-center w-full z-10 relative"
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive
                            ? 'text-brand-700'
                            : 'text-neutral-400 group-hover:text-brand-600',
                        )}
                      />
                      {isExpanded && (
                        <span className="flex-1 truncate ml-3">{label}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border bg-neutral-50">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50 gap-3',
            !isExpanded && 'justify-center px-0',
          )}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {isExpanded && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
