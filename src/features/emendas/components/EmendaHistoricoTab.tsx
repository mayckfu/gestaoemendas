import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Historico } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EmendaHistoricoTabProps {
  historico: Historico[]
}

export const EmendaHistoricoTab = ({ historico }: EmendaHistoricoTabProps) => {
  const sortedHistory = [...historico].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
  )

  return (
    <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200">
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Timeline View */}
        <div className="block md:hidden space-y-4">
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum histórico registrado.
            </p>
          ) : (
            <div className="relative pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-6">
              {sortedHistory.map((h) => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(h.criado_em).toLocaleString('pt-BR')}
                    </span>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                      {h.evento}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {h.detalhe}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                        {h.feito_por.charAt(0)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {h.feito_por}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                <TableHead className="font-medium text-neutral-900 dark:text-neutral-200">
                  Data/Hora
                </TableHead>
                <TableHead className="font-medium text-neutral-900 dark:text-neutral-200">
                  Usuário
                </TableHead>
                <TableHead className="font-medium text-neutral-900 dark:text-neutral-200">
                  Evento
                </TableHead>
                <TableHead className="font-medium text-neutral-900 dark:text-neutral-200">
                  Detalhes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((h) => (
                <TableRow
                  key={h.id}
                  className="h-10 py-2 text-neutral-600 dark:text-neutral-400 odd:bg-white even:bg-neutral-50 hover:bg-neutral-100 dark:odd:bg-card dark:even:bg-muted/50 dark:hover:bg-muted"
                >
                  <TableCell>
                    {new Date(h.criado_em).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{h.feito_por}</TableCell>
                  <TableCell>{h.evento}</TableCell>
                  <TableCell>{h.detalhe}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
