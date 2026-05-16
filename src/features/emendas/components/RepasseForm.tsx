import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Repasse } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'
import { formatDateToDB, parseDateFromDB } from '@/lib/date-utils'

const repasseSchema = z.object({
  data: z.date({ required_error: 'A data é obrigatória.' }),
  valor: z.coerce
    .number({ invalid_type_error: 'O valor deve ser um número.' })
    .positive('O valor deve ser maior que zero.'),
  fonte: z.string().min(1, 'A fonte é obrigatória.'),
  status: z.enum(['REPASSADO', 'PENDENTE', 'CANCELADO'], {
    required_error: 'O status é obrigatório.',
  }),
  observacoes: z.string().optional(),
  ordem_bancaria: z.string().optional(),
})

type RepasseFormValues = z.infer<typeof repasseSchema>

interface RepasseFormProps {
  repasse?: Repasse | null
  onSubmit: (values: Repasse) => void
  onCancel: () => void
}

export const RepasseForm = ({
  repasse,
  onSubmit,
  onCancel,
}: RepasseFormProps) => {
  const form = useForm<RepasseFormValues>({
    resolver: zodResolver(repasseSchema),
    defaultValues: {
      data: repasse ? parseDateFromDB(repasse.data) || new Date() : new Date(),
      valor: repasse?.valor || 0,
      fonte: repasse?.fonte || '',
      status: repasse?.status || 'PENDENTE',
      observacoes: repasse?.observacoes || '',
      ordem_bancaria: repasse?.ordem_bancaria || '',
    },
  })

  const handleSubmit = (values: RepasseFormValues) => {
    const newRepasse: Repasse = {
      id: repasse?.id || '',
      ...values,
      data: formatDateToDB(values.data),
    }
    onSubmit(newRepasse)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Repasse</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <MoneyInput
                  placeholder="0,00"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fonte"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fonte</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fundo Nacional de Saúde" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ordem_bancaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem Bancária</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2024OB800123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status do Repasse</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="REPASSADO">Repassado</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione notas sobre o repasse..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  )
}
