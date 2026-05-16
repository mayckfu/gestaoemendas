import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface ConfiguracaoAno {
  ano: number
  liberado_geral: boolean
}

interface YearsTableProps {
  years: ConfiguracaoAno[]
  onUpdateYear: (year: ConfiguracaoAno) => void
  onCreateYear: (year: number) => void
  onDeleteYear: (year: number) => void
}

export const YearsTable = ({
  years,
  onUpdateYear,
  onCreateYear,
  onDeleteYear,
}: YearsTableProps) => {
  const [newYear, setNewYear] = useState('')
  const { toast } = useToast()

  const handleToggle = async (year: ConfiguracaoAno, checked: boolean) => {
    try {
      const { error } = await supabase
        .from('configuracoes_anos' as any)
        .update({ liberado_geral: checked })
        .eq('ano', year.ano)

      if (error) throw error
      onUpdateYear({ ...year, liberado_geral: checked })
      toast({ title: 'Status do ano atualizado com sucesso.' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleAdd = async () => {
    const yearNum = parseInt(newYear)
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast({
        title: 'Por favor, insira um ano válido.',
        variant: 'destructive',
      })
      return
    }
    if (years.some((y) => y.ano === yearNum)) {
      toast({
        title: 'Este ano já está configurado.',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await supabase
        .from('configuracoes_anos' as any)
        .insert([{ ano: yearNum, liberado_geral: false }])

      if (error) throw error
      onCreateYear(yearNum)
      setNewYear('')
      toast({ title: 'Ano adicionado com sucesso.' })
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar ano',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">
            Configuração de Visibilidade por Ano
          </h3>
          <p className="text-sm text-muted-foreground">
            Controle quais anos de exercício estão disponíveis para usuários
            não-administradores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Ex: 2027"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            className="w-32"
          />
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano de Exercício</TableHead>
              <TableHead>Status de Visibilidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum ano configurado.
                </TableCell>
              </TableRow>
            ) : (
              [...years]
                .sort((a, b) => b.ano - a.ano)
                .map((y) => (
                  <TableRow key={y.ano}>
                    <TableCell className="font-medium text-base">
                      {y.ano}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={y.liberado_geral}
                          onCheckedChange={(checked) =>
                            handleToggle(y, checked)
                          }
                        />
                        {y.liberado_geral ? (
                          <Badge className="bg-success text-white">
                            Público
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Restrito (Admin)</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteYear(y.ano)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remover configuração"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
