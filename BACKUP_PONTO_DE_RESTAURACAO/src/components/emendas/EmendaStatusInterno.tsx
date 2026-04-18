import { useState } from 'react'
import { Check, ChevronsUpDown, History } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusInterno, StatusInternoEnum, Historico } from '@/lib/mock-data'
import { StatusBadge } from '@/components/StatusBadge'

interface EmendaStatusInternoProps {
  currentStatus: StatusInternoEnum
  history: Historico[]
  onUpdateStatus: (newStatus: StatusInternoEnum) => void
}

export const EmendaStatusInterno = ({
  currentStatus,
  history,
  onUpdateStatus,
}: EmendaStatusInternoProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>(currentStatus)

  const statusHistory = history
    .filter((h) => h.evento === 'INTERNAL_STATUS_CHANGE')
    .sort(
      (a, b) =>
        new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    )

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    if (currentValue !== currentStatus) {
      onUpdateStatus(currentValue as StatusInternoEnum)
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-asplan-deep flex items-center gap-2">
          <History className="h-5 w-5" />
          STATUS INTERNO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Status Atual
            </span>
            <div className="flex items-center gap-4">
              <StatusBadge status={currentStatus} />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                  >
                    {value
                      ? StatusInterno[value as StatusInternoEnum]
                      : 'Selecione o status...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar status..." />
                    <CommandList>
                      <CommandEmpty>Status não encontrado.</CommandEmpty>
                      <CommandGroup>
                        {Object.entries(StatusInterno).map(([key, label]) => (
                          <CommandItem
                            key={key}
                            value={key}
                            onSelect={handleSelect}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                value === key ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Histórico de Alterações
            </span>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-neutral-50 dark:bg-muted/20">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma alteração registrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1 border-l-2 border-neutral-200 pl-4 relative"
                    >
                      <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-300" />
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(item.criado_em),
                          'dd/MM/yyyy HH:mm:ss',
                          {
                            locale: ptBR,
                          },
                        )}
                      </span>
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {item.detalhe}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        por {item.feito_por}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
