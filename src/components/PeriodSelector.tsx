import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import { useYear } from '@/contexts/YearContext'

interface PeriodSelectorProps {
  year: string
  month: string
  onYearChange: (year: string) => void
  onMonthChange: (month: string) => void
  className?: string
}

export function PeriodSelector({
  year,
  month,
  onYearChange,
  onMonthChange,
  className,
}: PeriodSelectorProps) {
  const { availableYears } = useYear()

  let years =
    availableYears.length > 0
      ? availableYears
      : [
          (new Date().getFullYear() - 1).toString(),
          new Date().getFullYear().toString(),
          (new Date().getFullYear() + 1).toString(),
        ]

  if (year && year !== 'all' && !years.includes(year)) {
    years = [...years, year].sort((a, b) => Number(a) - Number(b))
  }

  const months = [
    { value: 'all', label: 'Todos os Meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-3 bg-card/50 p-1.5 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm sm:w-auto sm:flex-row sm:items-center',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <ToggleGroup
            type="single"
            value={year}
            onValueChange={(val) => val && onYearChange(val)}
            className="w-max bg-muted/50 p-1 rounded-lg gap-1"
          >
            {years.map((y) => (
              <ToggleGroupItem
                key={y}
                value={y}
                className="h-7 px-3 text-xs font-medium rounded-md data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
              >
                {y}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <div className="h-6 w-px bg-border/50 hidden sm:block" />

      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="h-9 w-full bg-background/50 border-0 shadow-none focus:ring-0 hover:bg-background/80 transition-colors sm:w-[160px]">
          <SelectValue placeholder="Selecione o Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
