import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SessionTimeout } from '@/components/SessionTimeout'
import { VisitorBanner } from './VisitorBanner'

const AppLayout = () => {
  const { state, isMobile } = useSidebar()

  return (
    <div
      className={cn(
        'grid min-h-screen w-full bg-background',
        !isMobile && state === 'expanded' && 'md:grid-cols-[260px_1fr]',
        !isMobile && state === 'collapsed' && 'md:grid-cols-[72px_1fr]',
        'transition-all duration-300 ease-in-out',
        'print:block print:w-full print:h-auto',
      )}
    >
      <SessionTimeout />
      <AppSidebar />
      <div className="flex min-w-0 flex-col overflow-hidden h-dvh print:overflow-visible print:h-auto print:block">
        <VisitorBanner />
        <Header />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50/50 dark:bg-background scroll-smooth print:overflow-visible print:h-auto print:block print:bg-white">
          <div className="box-border min-w-0 max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-8 w-full print:px-0 print:py-0 print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  )
}
