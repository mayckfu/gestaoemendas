import { Search, X, Filter } from 'lucide-react'
import {
  TipoRecurso,
  SituacaoOficial,
  StatusInterno,
  TipoEmenda,
} from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export type ReportFiltersState = {
  autor: string
  tipo: string
  tipoRecurso: string
  situacao: string
  statusInterno: string
  valorMin: number
  valorMax: number
  responsavel: string
  unidade: string
  demanda: string
  statusExecucao: string
  fornecedor: string
}

interface ReportsFiltersProps {
  filters: ReportFiltersState
  onFilterChange: (newFilters: Partial<ReportFiltersState>) => void
  onReset: () => void
}

export const ReportsFilters = ({
  filters,
  onFilterChange,
  onReset,
}: ReportsFiltersProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ [e.target.name]: e.target.value })
  }
  const handleSelectChange = (name: string) => (value: string) => {
    onFilterChange({ [name]: value })
  }

  const activeFiltersCount = [
    filters.autor,
    filters.responsavel,
    filters.unidade,
    filters.demanda,
    filters.fornecedor,
    filters.valorMin > 0,
    filters.valorMax > 0,
    filters.tipo !== 'all',
    filters.tipoRecurso !== 'all',
    filters.situacao !== 'all',
    filters.statusInterno !== 'all',
    filters.statusExecucao !== 'all',
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4 animate-fade-in-down">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-2 rounded-xl border border-border/40 bg-background/60 backdrop-blur-md shadow-sm sticky top-20 z-20">
        <div className="flex items-center gap-2 flex-1 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Parlamentar..."
              name="autor"
              value={filters.autor}
              onChange={handleInputChange}
              className="pl-9 bg-background/50 border-border/50 h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <Select
            value={filters.tipo}
            onValueChange={handleSelectChange('tipo')}
          >
            <SelectTrigger className="w-full lg:w-[150px] bg-background/50 border-border/50 h-10">
              <SelectValue placeholder="Tipo Emenda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {Object.entries(TipoEmenda).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.situacao}
            onValueChange={handleSelectChange('situacao')}
          >
            <SelectTrigger className="w-full lg:w-[160px] bg-background/50 border-border/50 h-10">
              <SelectValue placeholder="Status Oficial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Situações</SelectItem>
              {Object.entries(SituacaoOficial).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full lg:w-auto border-dashed border-border/50 bg-transparent hover:bg-muted/50 h-10"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-sm px-1 font-normal h-5"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    Filtros Avançados
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Refine sua busca por detalhes específicos.
                  </p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Select
                    value={filters.tipoRecurso}
                    onValueChange={handleSelectChange('tipoRecurso')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Tipo de Recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Recursos</SelectItem>
                      {Object.entries(TipoRecurso).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.statusInterno}
                    onValueChange={handleSelectChange('statusInterno')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Status Interno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      {Object.entries(StatusInterno).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Responsável..."
                    name="responsavel"
                    value={filters.responsavel}
                    onChange={handleInputChange}
                    className="h-8"
                  />
                  <Input
                    placeholder="Unidade..."
                    name="unidade"
                    value={filters.unidade}
                    onChange={handleInputChange}
                    className="h-8"
                  />
                  <Select
                    value={filters.statusExecucao}
                    onValueChange={handleSelectChange('statusExecucao')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Status Execução" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Execuções</SelectItem>
                      <SelectItem value="PLANEJADA">Planejada</SelectItem>
                      <SelectItem value="EMPENHADA">Empenhada</SelectItem>
                      <SelectItem value="LIQUIDADA">Liquidada</SelectItem>
                      <SelectItem value="PAGA">Paga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              className="w-full lg:w-auto text-muted-foreground hover:text-foreground h-10"
              onClick={onReset}
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
