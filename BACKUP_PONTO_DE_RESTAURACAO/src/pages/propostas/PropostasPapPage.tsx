import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Amendment } from '@/lib/mock-data'
import { formatCurrencyBRL } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { supabase } from '@/lib/supabase/client'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useYear } from '@/contexts/YearContext'

const PropostasPapPage = () => {
  const navigate = useNavigate()
  const { isPrivacyMode } = usePrivacy()
  const { selectedYear } = useYear()
  const [papAmendments, setPapAmendments] = useState<Amendment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPapAmendments = async () => {
      setIsLoading(true)
      try {
        let query = supabase
          .from('emendas')
          .select('*')
          .in('tipo_recurso', ['INCREMENTO_PAP', 'CUSTEIO_PAP'])
          .order('created_at', { ascending: false })

        if (selectedYear && selectedYear !== 'all') {
          query = query.eq('ano_exercicio', parseInt(selectedYear))
        }

        const { data, error } = await query

        if (error) throw error

        setPapAmendments(data as Amendment[])
      } catch (error) {
        console.error('Error fetching PAP amendments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPapAmendments()
  }, [selectedYear])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Propostas PAP —{' '}
          {selectedYear === 'all' ? 'Todos os Anos' : selectedYear}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Propostas ({papAmendments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Nº Emenda</TableHead>
                <TableHead>Nº Proposta</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Situação Oficial</TableHead>
                <TableHead>Status Interno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papAmendments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma proposta encontrada para o exercício{' '}
                    {selectedYear === 'all' ? 'selecionado' : selectedYear}.
                  </TableCell>
                </TableRow>
              ) : (
                papAmendments.map((amendment) => (
                  <TableRow
                    key={amendment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/emenda/${amendment.id}`)}
                  >
                    <TableCell>{amendment.autor}</TableCell>
                    <TableCell>{amendment.numero_emenda}</TableCell>
                    <TableCell>{amendment.numero_proposta}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrencyBRL(amendment.valor_total, isPrivacyMode)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={amendment.situacao} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={amendment.status_interno} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PropostasPapPage
