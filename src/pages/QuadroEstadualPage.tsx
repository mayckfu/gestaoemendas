import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Printer,
  FileDown,
  Calendar as CalendarIcon,
  User as UserIcon,
  Search,
  Loader2,
  Wallet,
  Plus,
  FileText,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrencyBRL } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { Amendment, TipoRecurso, TipoEmenda } from '@/lib/mock-data'
import { EmendaForm } from '@/components/emendas/EmendaForm'
import { useToast } from '@/components/ui/use-toast'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useYear } from '@/contexts/YearContext'

const QuadroEstadualPage = () => {
  const { toast } = useToast()
  const { isPrivacyMode } = usePrivacy()
  const { selectedYear, setSelectedYear } = useYear()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Amendment[]>([])

  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('emendas')
        .select('*')
        .eq('origem', 'ESTADUAL')
        .order('created_at', { ascending: false })

      // Fetch all to allow local filtering by author and year,
      // or filter directly by year if we strictly want only one year.
      // Since the original UI allows changing year via a select in this page specifically,
      // we'll fetch all and filter locally like before, OR we filter on DB.
      // Filtering on DB is better.
      if (selectedYear && selectedYear !== 'all') {
        query = query.eq('ano_exercicio', parseInt(selectedYear))
      }

      const { data: emendas, error } = await query

      if (error) throw error

      setData((emendas as Amendment[]) || [])
    } catch (error: any) {
      console.error('Error fetching state amendments:', error)
      toast({
        title: 'Erro ao carregar dados',
        description:
          'Não foi possível carregar o quadro estadual. ' +
          (error.message || ''),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, selectedYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchAuthor =
        selectedAuthor === 'all' || item.autor === selectedAuthor
      return matchAuthor
    })
  }, [data, selectedAuthor])

  const totalValue = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + item.valor_total, 0)
  }, [filteredData])

  const uniqueAuthors = useMemo(() => {
    const authors = Array.from(new Set(data.map((item) => item.autor))).filter(
      Boolean,
    )
    return authors.sort()
  }, [data])

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleCreate = async (formData: Partial<Amendment>) => {
    try {
      const { error } = await supabase.from('emendas').insert({
        ...formData,
        origem: 'ESTADUAL',
      })

      if (error) throw error

      toast({
        title: 'Registro criado com sucesso',
        description: 'A nova emenda estadual foi adicionada.',
      })
      setIsCreateOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('Error creating amendment:', error)
      toast({
        title: 'Erro ao criar registro',
        description: error.message || 'Ocorreu um erro ao salvar a emenda.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-asplan-deep">
            Quadro Estadual
          </h1>
          <p className="text-muted-foreground mt-1">
            Quadro Demonstrativo dos Recursos - Emendas Estaduais
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-asplan-primary hover:bg-asplan-primary/90 flex-1 md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 md:flex-none"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="flex-1 md:flex-none"
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Printable Header - Visible only on print */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold text-center text-black mb-2">
          Quadro Demonstrativo dos Recursos - Emendas Estaduais
        </h1>
        <p className="text-center text-sm text-gray-600">
          Gerado em {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Filters and Summary */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr] print:block">
        <Card className="print:hidden h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Exercício
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({ length: 5 }, (_, i) =>
                    (new Date().getFullYear() - i).toString(),
                  ).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                Autor
              </label>
              <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o autor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueAuthors.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-brand-50 to-white border-brand-100 shadow-sm print:shadow-none print:border-black">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 uppercase tracking-wide">
                    Valor Total Acumulado
                  </p>
                  <h2 className="text-3xl font-bold text-brand-900 mt-1 tabular-nums break-words">
                    {formatCurrencyBRL(totalValue, isPrivacyMode)}
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center print:hidden shrink-0 ml-4">
                  <Wallet className="h-6 w-6 text-brand-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200 shadow-sm print:shadow-none print:border-black">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                    Quantidade de Propostas
                  </p>
                  <h2 className="text-3xl font-bold text-neutral-900 mt-1 tabular-nums">
                    {filteredData.length}
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center print:hidden shrink-0 ml-4">
                  <FileText className="h-6 w-6 text-neutral-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table (Desktop) */}
          <Card className="print:shadow-none print:border-none hidden md:block">
            <CardContent className="p-0">
              <div className="rounded-md border print:border-black">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 print:bg-gray-100">
                      <TableHead className="font-semibold text-brand-900 print:text-black">
                        Autor
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 print:text-black">
                        Nº Proposta
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 print:text-black">
                        Tipo de Recurso
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 print:text-black">
                        Tipo (Objeto)
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 text-right print:text-black">
                        Valor (R$)
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 print:text-black">
                        Portaria
                      </TableHead>
                      <TableHead className="font-semibold text-brand-900 print:text-black w-[250px]">
                        Descrição Resumida
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span>Carregando dados...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhum registro encontrado para os filtros
                          selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow
                          key={item.id}
                          className="print:border-b-black"
                        >
                          <TableCell className="font-medium">
                            <Link
                              to={`/emenda/${item.id}`}
                              className="hover:underline text-primary"
                            >
                              {item.autor}
                            </Link>
                          </TableCell>
                          <TableCell>{item.numero_proposta || '—'}</TableCell>
                          <TableCell>
                            {TipoRecurso[item.tipo_recurso] ||
                              item.tipo_recurso}
                          </TableCell>
                          <TableCell className="capitalize">
                            {item.objeto_emenda ||
                              item.meta_operacional ||
                              TipoEmenda[item.tipo]}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrencyBRL(item.valor_total, isPrivacyMode)}
                          </TableCell>
                          <TableCell>{item.portaria || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground print:text-black">
                            <span className="line-clamp-2 print:line-clamp-none">
                              {item.descricao_completa ||
                                item.observacoes ||
                                '—'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Cards (Mobile) - Redesigned for clarity */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground bg-white rounded-lg border">
                Nenhum registro encontrado.
              </div>
            ) : (
              filteredData.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden shadow-sm border-neutral-200"
                >
                  <div className="bg-muted/30 p-4 border-b border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-semibold text-neutral-700">
                        {item.numero_emenda}
                      </span>
                    </div>
                    <StatusBadge status={item.situacao} />
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* Author Section */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
                        <UserIcon className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                          Autor
                        </span>
                        <span className="font-semibold text-brand-900 text-base leading-tight">
                          {item.autor}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-neutral-100 w-full my-2" />

                    {/* Proposal & Value Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase text-muted-foreground block">
                          Nº Proposta
                        </span>
                        <span className="text-sm font-medium text-neutral-800 bg-neutral-50 px-2 py-1 rounded inline-block">
                          {item.numero_proposta || '—'}
                        </span>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-xs font-bold uppercase text-muted-foreground block">
                          Valor Total
                        </span>
                        <span className="text-lg font-bold text-brand-700 tabular-nums">
                          {formatCurrencyBRL(item.valor_total, isPrivacyMode)}
                        </span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <Button
                      variant="secondary"
                      className="w-full mt-2 font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                      asChild
                    >
                      <Link to={`/emenda/${item.id}`}>
                        Ver Detalhes Completos
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro Estadual</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova emenda estadual. O registro será
              classificado automaticamente como Estadual.
            </DialogDescription>
          </DialogHeader>
          <EmendaForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QuadroEstadualPage
