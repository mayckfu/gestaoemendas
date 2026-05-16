import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  isVisitorModeGloballyEnabled,
  setVisitorModeGloballyEnabled,
} from '@/lib/visitor/visitorStorageManager'

export function VisitorModeConfig() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true)
      const isEnabled = await isVisitorModeGloballyEnabled()
      setEnabled(isEnabled)
      setIsLoading(false)
    }
    loadConfig()
  }, [])

  async function handleToggle(newValue: boolean) {
    setIsUpdating(true)
    const success = await setVisitorModeGloballyEnabled(newValue)
    if (success) {
      setEnabled(newValue)
      toast({
        title: newValue ? 'Modo Visitante Ativado' : 'Modo Visitante Desativado',
        description: newValue 
          ? 'O botão de acesso para visitantes agora está visível na tela de login.' 
          : 'O acesso para visitantes foi desativado globalmente com sucesso.',
      })
    } else {
      toast({
        title: 'Erro ao salvar configuração',
        description: 'Verifique se você possui as permissões necessárias e tente novamente.',
        variant: 'destructive',
      })
    }
    setIsUpdating(false)
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm flex items-center justify-center p-6 h-[180px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden relative">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-primary mb-1">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wider uppercase">Políticas Globais</span>
        </div>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          Controle de Modo Visitante
        </CardTitle>
        <CardDescription>
          Gerencie a exibição e o funcionamento da demonstração pública do sistema na tela de login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div className="space-y-0.5 pr-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="visitor-mode-toggle" className="text-sm font-semibold cursor-pointer">
                {enabled ? 'Acesso Aberto (Ativado)' : 'Acesso Bloqueado (Desativado)'}
              </Label>
              {enabled ? (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {enabled 
                ? 'Permite que qualquer pessoa acesse uma demonstração sandbox com dados simulados diretamente pela tela de login.'
                : 'Oculta o botão de login de visitante e impede novas inicializações de sessão sandbox.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="visitor-mode-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
          {enabled ? <Eye className="h-4 w-4 shrink-0 mt-0.5" /> : <EyeOff className="h-4 w-4 shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold">Nota de Segurança:</p>
            <p className="mt-0.5 opacity-90">
              {enabled
                ? 'Quando ativo, os acessos dos visitantes (IP e Localização) são registrados no painel de Notificações de Segurança abaixo.'
                : 'Quando desativado, apenas usuários reais cadastrados e autorizados conseguem logar no sistema.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
