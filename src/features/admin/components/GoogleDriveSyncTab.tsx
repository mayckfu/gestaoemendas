import { useEffect, useState } from 'react'
import { Database, Folder, Mail, RefreshCw, AlertCircle, CheckCircle2, FileText, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

interface ProcessedFile {
  id: string
  file_id: string
  name: string
  size: number | null
  status: 'pending' | 'processing' | 'processed' | 'failed'
  error_message: string | null
  extracted_notes_count: number
  processed_at: string
}

export function GoogleDriveSyncTab() {
  const { toast } = useToast()
  const [folderId, setFolderId] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])

  useEffect(() => {
    loadSettings()
    loadProcessedFiles()

    // Realtime subscription for file updates
    const channel = supabase
      .channel('google_drive_files_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'google_drive_files' },
        () => {
          loadProcessedFiles()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('value')
        .eq('key', 'google_drive_settings')
        .maybeSingle()

      if (error) throw error

      if (data?.value) {
        setFolderId(data.value.folder_id || '')
        setClientEmail(data.value.client_email || '')
      }
    } catch (err: any) {
      console.error('Error loading google drive settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadProcessedFiles() {
    try {
      const { data, error } = await (supabase as any)
        .from('google_drive_files')
        .select('*')
        .order('processed_at', { ascending: false })

      if (error) throw error
      setProcessedFiles((data as ProcessedFile[]) || [])
    } catch (err: any) {
      console.error('Error loading processed files:', err)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .upsert({
          key: 'google_drive_settings',
          value: {
            folder_id: folderId.trim(),
            client_email: clientEmail.trim()
          },
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do Google Drive foram salvas com sucesso.',
      })
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast({
        title: 'Erro ao salvar configurações',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSyncNow() {
    setIsSyncing(true)
    toast({
      title: 'Sincronização Iniciada',
      description: 'Lendo arquivos PDF na pasta do Google Drive. Isso pode levar alguns instantes...',
    })

    try {
      const { data, error } = await supabase.functions.invoke('sync-google-drive', {
        body: { folderId: folderId.trim() }
      })

      if (error) throw error

      if (data?.success) {
        const processed = data.processed || []
        const count = processed.filter((f: any) => f.status === 'processed').length
        const failedCount = processed.filter((f: any) => f.status === 'failed').length

        toast({
          title: 'Sincronização Concluída',
          description: `Sucesso: ${count} arquivo(s) processados. Falhas: ${failedCount} arquivo(s).`,
        })
      } else {
        throw new Error('Retorno inválido do servidor')
      }
      
      loadProcessedFiles()
    } catch (err: any) {
      console.error('Error syncing drive:', err)
      toast({
        title: 'Erro na Sincronização',
        description: err.message || 'Houve um problema ao processar a sincronização.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  function formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return '-'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm flex items-center justify-center p-12 h-[250px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Database className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Sincronização Inteligente</span>
          </div>
          <CardTitle className="text-lg font-medium">
            Integração com Google Drive
          </CardTitle>
          <CardDescription>
            Configure a pasta compartilhada do Google Drive contendo os documentos PDF (como ofícios ou relatórios). A Laura analisará os arquivos e consolidará as informações em sua base de conhecimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-id" className="text-sm font-semibold flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-muted-foreground" />
                ID da Pasta do Google Drive
              </Label>
              <Input
                id="folder-id"
                placeholder="Ex: 1A2b3C_d4E5f6G7h8I9j0K..."
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                O ID é o código final encontrado na URL da pasta do Google Drive (após /folders/).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-sm font-semibold flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-mail da Conta de Serviço (Google Cloud)
              </Label>
              <Input
                id="client-email"
                placeholder="Ex: laura-sync@seu-projeto.iam.gserviceaccount.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Para que o sistema consiga acessar seus arquivos, você precisa **compartilhar a pasta do Google Drive com este endereço de e-mail** (permissão de Leitor).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="flex-1 sm:flex-initial">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSyncing || !folderId}
                onClick={handleSyncNow}
                className="flex-1 sm:flex-initial"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Arquivos Processados
          </CardTitle>
          <CardDescription>
            Lista de documentos PDF lidos e analisados pelo cérebro da Laura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl p-4 bg-muted/20">
              Nenhum arquivo processado ainda. Clique em "Sincronizar Agora" para iniciar.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome do Arquivo</th>
                    <th className="px-4 py-3 font-semibold">Tamanho</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Fatos/Notas</th>
                    <th className="px-4 py-3 font-semibold text-right">Data de Processamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-300 max-w-[200px] truncate" title={file.name}>
                        {file.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-4 py-3">
                        {file.status === 'processed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Sucesso
                          </span>
                        )}
                        {file.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Lendo...
                          </span>
                        )}
                        {file.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full" title={file.error_message || ''}>
                            <AlertCircle className="h-3 w-3" />
                            Erro
                          </span>
                        )}
                        {file.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-semibold">
                        {file.extracted_notes_count > 0 ? `${file.extracted_notes_count} itens` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {new Date(file.processed_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
