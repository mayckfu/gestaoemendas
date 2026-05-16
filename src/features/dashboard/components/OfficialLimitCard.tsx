import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { formatCurrencyBRL } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { CreditCard, Settings, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface OfficialLimitCardProps {
  year: string
  limitData: {
    limite_mac: number
    limite_pap: number
    limite_capital: number
  } | null
  consumed: { mac: number; pap: number; capital: number }
  isAdmin: boolean
  onUpdate: () => void
}

export function OfficialLimitCard({
  year,
  limitData,
  consumed,
  isAdmin,
  onUpdate,
}: OfficialLimitCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mac, setMac] = useState(0)
  const [pap, setPap] = useState(0)
  const [capital, setCapital] = useState(0)
  const { toast } = useToast()
  const { isPrivacyMode } = usePrivacy()

  useEffect(() => {
    if (isOpen) {
      setMac(limitData?.limite_mac || 0)
      setPap(limitData?.limite_pap || 0)
      setCapital(limitData?.limite_capital || 0)
    }
  }, [isOpen, limitData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await (supabase as any)
        .from('limites_exercicio')
        .upsert({
          ano: parseInt(year),
          limite_mac: mac,
          limite_pap: pap,
          limite_capital: capital,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      toast({ title: 'Limites atualizados com sucesso.' })
      onUpdate()
      setIsOpen(false)
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar limites',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const macLimit = limitData?.limite_mac || 0
  const papLimit = limitData?.limite_pap || 0
  const capitalLimit = limitData?.limite_capital || 0

  const renderItem = (
    title: string,
    limit: number,
    consumedVal: number,
    colorClass: string,
  ) => {
    const remaining = limit - consumedVal
    const pct = limit > 0 ? (consumedVal / limit) * 100 : 0
    return (
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-neutral-50/50 border border-neutral-100 transition-colors hover:bg-neutral-50">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-neutral-800">{title}</h3>
          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-md tracking-wide uppercase',
              remaining < 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700',
            )}
          >
            Saldo: {formatCurrencyBRL(remaining, isPrivacyMode)}
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden mt-1">
          <div
            className={cn('h-full transition-all duration-500', colorClass)}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>
            Limite:{' '}
            <strong className="text-neutral-800">
              {formatCurrencyBRL(limit, isPrivacyMode)}
            </strong>
          </span>
          <span>
            Consumo:{' '}
            <strong className="text-neutral-800">
              {formatCurrencyBRL(consumedVal, isPrivacyMode)}
            </strong>
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-white shadow-card border-border/50 overflow-hidden animate-fade-in-up">
      <CardHeader className="bg-brand-50/50 border-b border-border/50 pb-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2 uppercase tracking-wide">
          <CreditCard className="h-5 w-5 text-brand-600" />
          LIMITE OFICIAL {year}
        </CardTitle>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white text-brand-700 border-brand-200 hover:bg-brand-50 hover:text-brand-800"
              >
                <Settings className="h-4 w-4" />
                Editar Limite {year}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Settings className="h-5 w-5 text-brand-600" />
                  Editar Limite Oficial – {year}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mac">Limite MAC</Label>
                  <MoneyInput id="mac" value={mac} onChange={setMac} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pap">Limite PAP</Label>
                  <MoneyInput id="pap" value={pap} onChange={setPap} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capital">Limite CAPITAL</Label>
                  <MoneyInput
                    id="capital"
                    value={capital}
                    onChange={setCapital}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}[
                  Salvar Alterações ]
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6 grid gap-4 md:grid-cols-3">
        {renderItem('MAC', macLimit, consumed.mac, 'bg-blue-500')}
        {renderItem('PAP', papLimit, consumed.pap, 'bg-cyan-500')}
        {renderItem('Capital', capitalLimit, consumed.capital, 'bg-purple-500')}
      </CardContent>
    </Card>
  )
}
