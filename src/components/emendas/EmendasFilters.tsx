import { DateRange } from 'react-day-picker'
import { X } from 'lucide-react'
import {
  TipoRecurso,
  SituacaoOficial,
  StatusInterno,
  TipoEmenda,
} from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { MoneyInput } from '@/components/ui/money-input'

export type FiltersState = {
  autor: string
  parlamentar: string
  tipo: string
  tipoRecurso: string
  situacaoOficial: string
  statusInterno: string
  periodo: DateRange | undefined
  valorMin: number
  valorMax: number
  comPortaria: boolean
  comCIE: boolean
  comAnexos: boolean
  apenasPendencias: boolean
  semPortaria?: boolean
  semCIE?: boolean
  semAnexos?: boolean
  semRepasses?: boolean
  comDespesasNaoAutorizadas?: boolean
  despesasMaiorRepasses?: boolean
}

interface EmendasFiltersProps {
  filters: FiltersState
  onFilterChange: (newFilters: Partial<FiltersState>) => void
  onReset: () => void
  uniqueAuthors: string[]
  uniqueParlamentares: string[]
}

export const EmendasFilters = ({
  filters,
  onFilterChange,
  onReset,
  uniqueAuthors,
  uniqueParlamentares,
}: EmendasFiltersProps) => {
  const handleSelectChange = (name: string) => (value: string) => {
    onFilterChange({ [name]: value })
  }
  const handleCheckboxChange =
    (name: keyof FiltersState) => (checked: boolean) => {
      onFilterChange({ [name]: checked })
    }
  const handleDateChange = (date: DateRange | undefined) => {
    onFilterChange({ periodo: date })
  }
  const handleMoneyChange = (name: string) => (value: number) => {
    onFilterChange({ [name]: value })
  }

  return (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={filters.autor}
          onValueChange={handleSelectChange('autor')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Autor Principal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Autores</SelectItem>
            {uniqueAuthors.map((autor) => (
              <SelectItem key={autor} value={autor}>
                {autor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.parlamentar}
          onValueChange={handleSelectChange('parlamentar')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Parlamentar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Parlamentares</SelectItem>
            {uniqueParlamentares.map((parlamentar) => (
              <SelectItem key={parlamentar} value={parlamentar}>
                {parlamentar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.tipo} onValueChange={handleSelectChange('tipo')}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Recurso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(TipoEmenda).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tipoRecurso}
          onValueChange={handleSelectChange('tipoRecurso')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Recurso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="MAC">MAC (Todos)</SelectItem>
            <SelectItem value="PAP">PAP (Todos)</SelectItem>
            {Object.entries(TipoRecurso).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.situacaoOficial}
          onValueChange={handleSelectChange('situacaoOficial')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Situação Oficial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(SituacaoOficial).map(([key, value]) => (
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
          <SelectTrigger>
            <SelectValue placeholder="Status Interno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(StatusInterno).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          date={filters.periodo}
          onDateChange={handleDateChange}
        />

        <MoneyInput
          placeholder="Valor Mín."
          value={filters.valorMin}
          onChange={handleMoneyChange('valorMin')}
        />

        <MoneyInput
          placeholder="Valor Máx."
          value={filters.valorMax}
          onChange={handleMoneyChange('valorMax')}
        />

        <div className="flex items-center space-x-2">
          <Checkbox
            id="comPortaria"
            checked={filters.comPortaria}
            onCheckedChange={handleCheckboxChange('comPortaria')}
          />
          <Label
            htmlFor="comPortaria"
            className="text-neutral-600 dark:text-neutral-400"
          >
            Com Portaria
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="comCIE"
            checked={filters.comCIE}
            onCheckedChange={handleCheckboxChange('comCIE')}
          />
          <Label
            htmlFor="comCIE"
            className="text-neutral-600 dark:text-neutral-400"
          >
            Com Deliberação CIE
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="comAnexos"
            checked={filters.comAnexos}
            onCheckedChange={handleCheckboxChange('comAnexos')}
          />
          <Label
            htmlFor="comAnexos"
            className="text-neutral-600 dark:text-neutral-400"
          >
            Com Anexos Essenciais
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="apenasPendencias"
            checked={filters.apenasPendencias}
            onCheckedChange={handleCheckboxChange('apenasPendencias')}
          />
          <Label
            htmlFor="apenasPendencias"
            className="text-neutral-600 dark:text-neutral-400"
          >
            Apenas com pendências
          </Label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onReset}>
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  )
}
