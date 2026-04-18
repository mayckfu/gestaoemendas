import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PlusCircle,
  FileDown,
  ListFilter,
  Save,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  Users,
  User,
  Building2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { parse, format, parseISO, getMonth } from 'date-fns'
import { Amendment, SituacaoOficial, TipoEmenda } from '@/lib/mock-data'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  EmendasFilters,
  FiltersState,
} from '@/components/emendas/EmendasFilters'
import { DateRange } from 'react-day-picker'
import { formatCurrencyBRL, cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EmendaForm } from '@/components/emendas/EmendaForm'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useYear } from '@/contexts/YearContext'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { PeriodSelector } from '@/components/PeriodSelector'

const ITEMS_PER_PAGE = 10

const getPendencias = (amendment: Amendment) => {
  const pendencias: string[] = []
  if (!amendment.portaria) pendencias.push('Falta Portaria')
  if (!amendment.deliberacao_cie) pendencias.push('Falta CIE')
  if (!amendment.anexos_essenciais) pendencias.push('Sem Anexos Essenciais')
  if (amendment.total_repassado <= 0) pendencias.push('Sem Repasses')
  if (amendment.total_gasto > amendment.total_repassado)
    pendencias.push('Despesas > Repasses')
  return pendencias
}

const exportToCsv = (filename: string, rows: object[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  const separator = ','
  const keys = Object.keys(rows[0])
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row: any) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k]
            cell =
              cell instanceof Date
                ? cell.toLocaleString()
                : cell.toString().replace(/"/g, '""')
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`
            }
            return cell
          })
          .join(separator)
      })
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

type SortConfig = {
  key: keyof Amendment | null
  direction: 'asc' | 'desc'
}

const getRowStatusColor = (status: string) => {
  switch (status) {
    case 'CONCLUIDA':
      return 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30'
    case 'EM_EXECUCAO':
      return 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30'
    case 'PAGA':
    case 'PROPOSTA_PAGA':
      return 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30'
    case 'PAGA_SEM_DOCUMENTOS':
    case 'PAGA_COM_PENDENCIAS':
      return 'bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
    case 'EM_ANALISE':
    case 'EM_ANALISE_PAGAMENTO':
      return 'bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/30'
    case 'APROVADA_PAGAMENTO':
    case 'PROPOSTA_APROVADA':
      return 'bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/30'
    case 'RASCUNHO':
      return 'bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
    default:
      return 'bg-background hover:bg-muted/50'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'individual':
      return <User className="h-4 w-4" />
    case 'bancada':
      return <Users className="h-4 w-4" />
    case 'comissao':
    case 'programa':
      return <Building2 className="h-4 w-4" />
    default:
      return <User className="h-4 w-4" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'individual':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'bancada':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    case 'comissao':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    case 'programa':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

const EmendasListPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { checkPermission } = useAuth()
  const { isPrivacyMode } = usePrivacy()
  const { selectedYear, setSelectedYear } = useYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const [presets, setPresets] = useState<Record<string, string>>(() =>
    JSON.parse(localStorage.getItem('emendas_presets') || '{}'),
  )
  const [localAmendments, setLocalAmendments] = useState<Amendment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmenda, setEditingEmenda] = useState<Amendment | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingEmenda, setDeletingEmenda] = useState<Amendment | null>(null)

  // New states for optimization
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get('q') || '',
  )
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  })

  const monthParam = searchParams.get('month') || 'all'

  // Security: Check Roles
  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])
  const canDelete = checkPermission(['ADMIN', 'GESTOR'])
  const canCreate = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const fetchAmendments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('emendas')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedYear && selectedYear !== 'all') {
        query = query.eq('ano_exercicio', parseInt(selectedYear, 10))
      }

      const { data, error } = await query

      if (error) throw error

      setLocalAmendments(data as Amendment[])
    } catch (error: any) {
      console.error('Error fetching amendments:', error)
      setError(error.message || 'Erro ao carregar emendas.')
      toast({
        title: 'Erro ao carregar emendas',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, selectedYear])

  useEffect(() => {
    fetchAmendments()
  }, [fetchAmendments])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchTerm) {
      setSearchTerm(q)
    }
  }, [searchParams, searchTerm])

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(localAmendments.map((a) => a.autor).filter(Boolean))
    return Array.from(authors).sort()
  }, [localAmendments])

  const uniqueParlamentares = useMemo(() => {
    const parlamentares = new Set(
      localAmendments.map((a) => a.parlamentar).filter(Boolean),
    )
    return Array.from(parlamentares).sort()
  }, [localAmendments])

  const filters = useMemo<FiltersState>(() => {
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    return {
      autor: searchParams.get('autor') ?? 'all',
      parlamentar: searchParams.get('parlamentar') ?? 'all',
      tipo: searchParams.get('tipo') ?? 'all',
      tipoRecurso: searchParams.get('tipoRecurso') ?? 'all',
      situacaoOficial: searchParams.get('situacaoOficial') ?? 'all',
      statusInterno: searchParams.get('statusInterno') ?? 'all',
      periodo: fromStr
        ? {
            from: parse(fromStr, 'yyyy-MM-dd', new Date()),
            to: toStr ? parse(toStr, 'yyyy-MM-dd', new Date()) : undefined,
          }
        : undefined,
      valorMin: parseFloat(searchParams.get('valorMin') || '0'),
      valorMax: parseFloat(searchParams.get('valorMax') || '0'),
      comPortaria: searchParams.get('comPortaria') === 'true',
      comCIE: searchParams.get('comCIE') === 'true',
      comAnexos: searchParams.get('comAnexos') === 'true',
      apenasPendencias: searchParams.get('apenasPendencias') === 'true',
      semPortaria: searchParams.get('semPortaria') === 'true',
      semCIE: searchParams.get('semCIE') === 'true',
      semAnexos: searchParams.get('semAnexos') === 'true',
      semRepasses: searchParams.get('semRepasses') === 'true',
      comDespesasNaoAutorizadas:
        searchParams.get('comDespesasNaoAutorizadas') === 'true',
      despesasMaiorRepasses:
        searchParams.get('despesasMaiorRepasses') === 'true',
    }
  }, [searchParams])

  const currentPage = useMemo(
    () => parseInt(searchParams.get('page') || '1', 10),
    [searchParams],
  )

  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltersState>) => {
      const newParams = new URLSearchParams(searchParams)
      Object.entries(newFilters).forEach(([key, value]) => {
        if (key === 'periodo') {
          const dateRange = value as DateRange | undefined
          if (dateRange?.from) {
            newParams.set('from', format(dateRange.from, 'yyyy-MM-dd'))
            if (dateRange.to) {
              newParams.set('to', format(dateRange.to, 'yyyy-MM-dd'))
            } else {
              newParams.delete('to')
            }
          } else {
            newParams.delete('from')
            newParams.delete('to')
          }
        } else if (
          value === '' ||
          value === 'all' ||
          value === false ||
          value === 0
        ) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
      newParams.set('page', '1')
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('q', value)
    } else {
      newParams.delete('q')
    }
    newParams.set('page', '1')
    setSearchParams(newParams, { replace: true })
  }

  const handleResetFilters = useCallback(() => {
    setSearchParams({ page: '1' }, { replace: true })
    setSearchTerm('')
  }, [setSearchParams])

  const handleSort = (key: keyof Amendment) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleAddNew = () => {
    setEditingEmenda(null)
    setIsFormOpen(true)
  }

  const handleEdit = (emenda: Amendment) => {
    setEditingEmenda(emenda)
    setIsFormOpen(true)
  }

  const handleDelete = (emenda: Amendment) => {
    setDeletingEmenda(emenda)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Partial<Amendment>) => {
    try {
      if (editingEmenda) {
        const { error } = await supabase
          .from('emendas')
          .update(data)
          .eq('id', editingEmenda.id)

        if (error) throw error

        setLocalAmendments((prev) =>
          prev.map((item) =>
            item.id === editingEmenda.id ? { ...item, ...data } : item,
          ),
        )
        toast({ title: 'Emenda atualizada com sucesso!' })
      } else {
        const { data: newData, error } = await supabase
          .from('emendas')
          .insert([data])
          .select()
          .single()

        if (error) throw error

        setLocalAmendments((prev) => [newData as Amendment, ...prev])
        toast({ title: 'Emenda criada com sucesso!' })
      }
      setIsFormOpen(false)
      setEditingEmenda(null)
    } catch (error: any) {
      console.error('Error saving amendment:', error)
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingEmenda) {
      try {
        const { error } = await supabase
          .from('emendas')
          .delete()
          .eq('id', deletingEmenda.id)

        if (error) throw error

        setLocalAmendments((prev) =>
          prev.filter((item) => item.id !== deletingEmenda.id),
        )
        toast({ title: 'Emenda excluída com sucesso!' })
      } catch (error: any) {
        console.error('Error deleting amendment:', error)
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsDeleteOpen(false)
        setDeletingEmenda(null)
      }
    }
  }

  const filteredAmendments = useMemo(() => {
    let result = localAmendments
      .map((amendment) => ({
        ...amendment,
        pendencias: getPendencias(amendment),
      }))
      .filter((amendment) => {
        // Month Filter
        if (monthParam !== 'all') {
          if (!amendment.created_at) return false
          const month = parseInt(monthParam, 10)
          const amendmentDate = parseISO(amendment.created_at)
          if (getMonth(amendmentDate) + 1 !== month) {
            return false
          }
        }

        // Text Search (Global Search functionality)
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesEmenda = amendment.numero_emenda
            .toLowerCase()
            .includes(searchLower)
          const matchesProposta =
            amendment.numero_proposta?.toLowerCase().includes(searchLower) ||
            false
          const matchesParlamentar = amendment.parlamentar
            .toLowerCase()
            .includes(searchLower)
          const matchesPortaria =
            amendment.portaria?.toLowerCase().includes(searchLower) || false

          if (
            !matchesEmenda &&
            !matchesProposta &&
            !matchesParlamentar &&
            !matchesPortaria
          )
            return false
        }

        // Existing Filters
        if (filters.autor !== 'all' && amendment.autor !== filters.autor)
          return false
        if (
          filters.parlamentar !== 'all' &&
          amendment.parlamentar !== filters.parlamentar
        )
          return false

        if (filters.tipo !== 'all' && amendment.tipo !== filters.tipo)
          return false

        // Resource Type Filter with Group logic (MAC, PAP)
        if (filters.tipoRecurso !== 'all') {
          if (filters.tipoRecurso === 'MAC') {
            if (
              amendment.tipo_recurso !== 'INCREMENTO_MAC' &&
              amendment.tipo_recurso !== 'CUSTEIO_MAC'
            ) {
              return false
            }
          } else if (filters.tipoRecurso === 'PAP') {
            if (
              amendment.tipo_recurso !== 'INCREMENTO_PAP' &&
              amendment.tipo_recurso !== 'CUSTEIO_PAP'
            ) {
              return false
            }
          } else if (amendment.tipo_recurso !== filters.tipoRecurso) {
            return false
          }
        }

        if (
          filters.situacaoOficial !== 'all' &&
          amendment.situacao !== filters.situacaoOficial
        )
          return false
        if (
          filters.statusInterno !== 'all' &&
          amendment.status_interno !== filters.statusInterno
        )
          return false
        if (filters.valorMin && amendment.valor_total < filters.valorMin)
          return false
        if (filters.valorMax && amendment.valor_total > filters.valorMax)
          return false
        if (filters.periodo?.from) {
          const amendmentDate = new Date(amendment.created_at)
          if (amendmentDate < filters.periodo.from) return false
          if (filters.periodo.to && amendmentDate > filters.periodo.to)
            return false
        }
        if (filters.comPortaria && !amendment.portaria) return false
        if (filters.comCIE && !amendment.deliberacao_cie) return false
        if (filters.comAnexos && !amendment.anexos_essenciais) return false
        if (filters.apenasPendencias && amendment.pendencias.length === 0)
          return false
        if (filters.semPortaria && amendment.portaria) return false
        if (filters.semCIE && amendment.deliberacao_cie) return false
        if (filters.semAnexos && amendment.anexos_essenciais) return false
        if (filters.semRepasses && amendment.total_repassado > 0) return false
        if (
          filters.despesasMaiorRepasses &&
          amendment.total_gasto <= amendment.total_repassado
        )
          return false
        return true
      })

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // @ts-expect-error
        const valA = a[sortConfig.key]
        // @ts-expect-error
        const valB = b[sortConfig.key]

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [filters, localAmendments, searchTerm, sortConfig, monthParam])

  const totalPages = Math.ceil(filteredAmendments.length / ITEMS_PER_PAGE)
  const paginatedData = filteredAmendments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('page', String(page))
      setSearchParams(newParams, { replace: true })
    }
  }

  const savePreset = () => {
    const name = prompt('Digite um nome para a visualização:')
    if (name) {
      const newPresets = { ...presets, [name]: searchParams.toString() }
      setPresets(newPresets)
      localStorage.setItem('emendas_presets', JSON.stringify(newPresets))
    }
  }

  const applyPreset = (name: string) => {
    setSearchParams(new URLSearchParams(presets[name]), { replace: true })
  }

  const handleExport = () => {
    const dataToExport = filteredAmendments.map((a) => ({
      'Tipo de Recurso': TipoEmenda[a.tipo] || a.tipo,
      Autor: a.autor,
      'Nº Emenda': a.numero_emenda,
      'Nº Proposta': a.numero_proposta,
      'Valor Total': a.valor_total,
      'Situação Oficial': SituacaoOficial[a.situacao],
      Portaria: a.portaria || '-',
      Pendências: a.pendencias.join('; '),
      'Segundo Parlamentar': a.segundo_parlamentar || '',
      'Valor Segundo Resp.': a.valor_segundo_responsavel || 0,
    }))
    exportToCsv('emendas.csv', dataToExport)
  }

  const renderSortIcon = (key: keyof Amendment) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />
    if (sortConfig.direction === 'asc')
      return <ArrowUp className="ml-2 h-3 w-3 text-primary" />
    return <ArrowDown className="ml-2 h-3 w-3 text-primary" />
  }

  const renderHeader = (label: string, key: keyof Amendment) => (
    <div
      className="flex items-center cursor-pointer select-none group"
      onClick={() => handleSort(key)}
    >
      {label}
      {renderSortIcon(key)}
    </div>
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao carregar emendas</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchAmendments}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-200">
          Lista de Emendas
        </h1>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          <PeriodSelector
            year={selectedYear}
            month={monthParam}
            onYearChange={(year) => {
              setSelectedYear(year)
              const newParams = new URLSearchParams(searchParams)
              newParams.set('page', '1')
              setSearchParams(newParams, { replace: true })
            }}
            onMonthChange={(month) => {
              const newParams = new URLSearchParams(searchParams)
              if (month === 'all') {
                newParams.delete('month')
              } else {
                newParams.set('month', month)
              }
              newParams.set('page', '1')
              setSearchParams(newParams, { replace: true })
            }}
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 h-9"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 flex-1 sm:flex-none"
              onClick={handleExport}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="sm:not-sr-only sm:whitespace-nowrap">CSV</span>
            </Button>
            {canCreate && (
              <Button
                size="sm"
                className="h-9 gap-1 flex-1 sm:flex-none"
                onClick={handleAddNew}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sm:not-sr-only sm:whitespace-nowrap">
                  Nova
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <CardHeader className="py-4">
          <Collapsible defaultOpen={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="font-medium text-base text-neutral-900 dark:text-neutral-200">
                  Filtros
                </CardTitle>
                <Badge variant="outline" className="text-xs font-normal">
                  {filteredAmendments.length} encontrados
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      Visualizações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Carregar Visualização</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.keys(presets).map((name) => (
                      <DropdownMenuItem
                        key={name}
                        onClick={() => applyPreset(name)}
                      >
                        {name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ListFilter className="h-4 w-4" />
                    <span className="sr-only">Filtros</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent className="mt-4">
              <EmendasFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                uniqueAuthors={uniqueAuthors}
                uniqueParlamentares={uniqueParlamentares}
              />
              <div className="flex justify-between items-center mt-4 sm:hidden">
                <Button size="sm" variant="ghost" onClick={savePreset}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Visualização
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma emenda encontrada.
                  </div>
                ) : (
                  paginatedData.map((amendment) => (
                    <Card
                      key={amendment.id}
                      className="overflow-hidden border shadow-sm active:scale-[0.98] transition-transform duration-100"
                      onClick={() => navigate(`/emenda/${amendment.id}`)}
                    >
                      <CardHeader className="p-4 pb-2 bg-neutral-50/50">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {amendment.parlamentar}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Proposta: {amendment.numero_proposta}
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-normal">
                            Portaria: {amendment.portaria || '-'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-muted-foreground">
                            Valor Total
                          </span>
                          <span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                            {formatCurrencyBRL(
                              amendment.valor_total,
                              isPrivacyMode,
                            )}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {amendment.numero_emenda}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {TipoEmenda[amendment.tipo]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                      <TableHead className="w-[120px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Tipo de Recurso', 'tipo')}
                      </TableHead>
                      <TableHead className="min-w-[180px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Parlamentar', 'parlamentar')}
                      </TableHead>
                      <TableHead className="min-w-[120px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Nº Emenda', 'numero_emenda')}
                      </TableHead>
                      <TableHead className="min-w-[120px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Nº Proposta', 'numero_proposta')}
                      </TableHead>
                      <TableHead className="min-w-[160px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Valor Total', 'valor_total')}
                      </TableHead>
                      <TableHead className="min-w-[140px] font-medium text-neutral-900 dark:text-neutral-200">
                        Situação Oficial
                      </TableHead>
                      <TableHead className="min-w-[140px] font-medium text-neutral-900 dark:text-neutral-200">
                        {renderHeader('Portaria', 'portaria')}
                      </TableHead>
                      <TableHead className="w-[120px] text-center font-medium text-neutral-900 dark:text-neutral-200">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhuma emenda encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((amendment) => {
                        const percentRepassed =
                          amendment.valor_total > 0
                            ? ((amendment.total_repassado || 0) /
                                amendment.valor_total) *
                              100
                            : 0
                        const rowColorClass = getRowStatusColor(
                          amendment.status_interno,
                        )

                        return (
                          <TableRow
                            key={amendment.id}
                            className={cn(
                              'h-auto py-2 cursor-pointer transition-colors border-b last:border-0',
                              rowColorClass,
                            )}
                            onClick={() => navigate(`/emenda/${amendment.id}`)}
                          >
                            <TableCell className="align-top">
                              <Badge
                                className={cn(
                                  'flex items-center gap-2 w-fit',
                                  getTypeColor(amendment.tipo),
                                )}
                              >
                                {getTypeIcon(amendment.tipo)}
                                <span className="capitalize text-xs">
                                  {TipoEmenda[amendment.tipo] || amendment.tipo}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-border">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                    {amendment.parlamentar
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-neutral-900 dark:text-neutral-200 leading-tight">
                                    {amendment.parlamentar}
                                  </span>
                                  {amendment.segundo_parlamentar && (
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Users className="h-3 w-3" />
                                      {amendment.segundo_parlamentar}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {amendment.numero_emenda}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {amendment.numero_proposta}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1.5 w-full max-w-[140px]">
                                <div className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-200">
                                  {formatCurrencyBRL(
                                    amendment.valor_total,
                                    isPrivacyMode,
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <Progress
                                    value={percentRepassed}
                                    className="h-1.5 bg-neutral-200 dark:bg-neutral-700"
                                  />
                                  <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>
                                      {formatCurrencyBRL(
                                        amendment.total_repassado || 0,
                                        isPrivacyMode,
                                      )}
                                    </span>
                                    <span>{percentRepassed.toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <StatusBadge
                                status={amendment.situacao}
                                className="whitespace-normal text-center w-full h-auto py-1 text-xs"
                              />
                            </TableCell>
                            <TableCell className="align-top font-medium text-center">
                              {amendment.portaria || '-'}
                            </TableCell>
                            <TableCell className="align-top">
                              <div
                                className="flex items-center justify-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/emenda/${amendment.id}`)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">
                                        Ver Detalhes
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver Detalhes</TooltipContent>
                                </Tooltip>

                                {canEdit && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEdit(amendment)
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar</TooltipContent>
                                  </Tooltip>
                                )}

                                {canDelete && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(amendment)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Excluir</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Excluir</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage - 1)
              }}
              className={
                currentPage === 1 ? 'pointer-events-none opacity-50' : ''
              }
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={currentPage === i + 1}
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(i + 1)
                }}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage + 1)
              }}
              className={
                currentPage >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col gap-0 bg-background"
        >
          <SheetHeader className="p-6 border-b shadow-sm z-10 shrink-0">
            <SheetTitle className="text-xl">
              {editingEmenda ? 'Editar Emenda' : 'Nova Emenda'}
            </SheetTitle>
            <SheetDescription>
              Preencha os dados da emenda abaixo.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 relative">
            <EmendaForm
              initialData={editingEmenda}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a emenda "
              {deletingEmenda?.numero_emenda}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EmendasListPage
