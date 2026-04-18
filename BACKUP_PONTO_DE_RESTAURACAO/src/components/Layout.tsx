import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SessionTimeout } from '@/components/SessionTimeout'

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
      <div className="flex flex-col overflow-hidden h-screen print:overflow-visible print:h-auto print:block">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 dark:bg-background scroll-smooth print:overflow-visible print:h-auto print:block print:bg-white">
          <div className="max-w-[1600px] mx-auto px-6 py-8 w-full print:px-0 print:py-0 print:max-w-none">
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
