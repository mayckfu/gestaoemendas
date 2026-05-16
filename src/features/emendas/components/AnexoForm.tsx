import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Link as LinkIcon } from 'lucide-react'
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
import { Anexo } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { parseDateFromDB } from '@/lib/date-utils'

const anexoSchema = z.object({
  filename: z.string().min(1, 'O título/descrição é obrigatório.'),
  url: z.string().url('Insira uma URL válida (ex: https://...)'),
  tipo: z.string().min(1, 'O tipo é obrigatório.'),
  data: z.date({ required_error: 'A data do documento é obrigatória.' }),
})

type AnexoFormValues = z.infer<typeof anexoSchema>

interface AnexoFormProps {
  anexo?: Anexo | null
  onSubmit: (values: AnexoFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const DOCUMENT_TYPES = {
  PORTARIA: 'Portaria',
  DELIBERACAO_CIE: 'Deliberação CIE',
  COMPROVANTE_FNS: 'Comprovante FNS',
  NOTA_FISCAL: 'Nota Fiscal',
  OFICIO: 'Ofício',
  PROPOSTA: 'Proposta',
  OUTRO: 'Outro',
}

export const AnexoForm = ({
  anexo,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AnexoFormProps) => {
  const form = useForm<AnexoFormValues>({
    resolver: zodResolver(anexoSchema),
    defaultValues: {
      filename: anexo?.filename || '',
      url: anexo?.url || '',
      tipo: anexo?.tipo || 'OUTRO',
      data: anexo?.data
        ? parseDateFromDB(anexo.data) || new Date()
        : new Date(),
    },
  })

  useEffect(() => {
    if (anexo) {
      form.reset({
        filename: anexo.filename,
        url: anexo.url,
        tipo: anexo.tipo,
        data: anexo.data
          ? parseDateFromDB(anexo.data) || new Date()
          : new Date(),
      })
    } else {
      form.reset({
        filename: '',
        url: '',
        tipo: 'OUTRO',
        data: new Date(),
      })
    }
  }, [anexo, form])

  const handleSubmit = (values: AnexoFormValues) => {
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria (Tipo)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filename"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Portaria GM/MS nº 1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (URL)</FormLabel>
              <FormControl>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="https://..."
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Documento</FormLabel>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Anexo
          </Button>
        </div>
      </form>
    </Form>
  )
}
