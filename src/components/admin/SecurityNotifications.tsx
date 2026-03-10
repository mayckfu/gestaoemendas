import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Info, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface SecurityNotification {
  id: string
  type: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  read: boolean
  created_at: string
}

export const SecurityNotifications = () => {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<SecurityNotification[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('security_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(data as SecurityNotification[])
      }
      setLoading(false)
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('security_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_notifications' },
        (payload) => {
          setNotifications((prev) => [
            payload.new as SecurityNotification,
            ...prev,
          ])
          toast({
            title: 'Novo Alerta de Segurança',
            description: payload.new.message,
            variant:
              payload.new.severity === 'CRITICAL' ? 'destructive' : 'default',
          })
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [toast])

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('security_notifications')
      .update({ read: true })
      .eq('id', id)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('security_notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({ title: 'Todas as notificações marcadas como lidas.' })
    }
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert className="h-5 w-5 text-destructive" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <Card className="h-full border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Notificações de Segurança
        </CardTitle>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          <Check className="mr-2 h-4 w-4" /> Marcar todas como lidas
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma notificação de segurança.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    notification.read
                      ? 'bg-background border-border/50'
                      : 'bg-muted/30 border-primary/20'
                  }`}
                >
                  <div className="mt-1">{getIcon(notification.severity)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {notification.type.replace('_', ' ')}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(notification.created_at),
                          "dd 'de' MMM 'às' HH:mm",
                          {
                            locale: ptBR,
                          },
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Marcar como lida</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
