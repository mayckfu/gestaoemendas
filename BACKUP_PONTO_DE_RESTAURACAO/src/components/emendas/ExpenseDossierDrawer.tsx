import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Despesa } from '@/lib/mock-data'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrencyBRL } from '@/lib/utils'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { VisuallyHidden } from '@/components/ui/visually-hidden'

interface ExpenseDossierDrawerProps {
  expense: Despesa | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const DetailItem = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div>
    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
      {label}
    </p>
    <p className="text-base text-neutral-900 dark:text-neutral-200">
      {children || '-'}
    </p>
  </div>
)

export const ExpenseDossierDrawer = ({
  expense,
  isOpen,
  onOpenChange,
}: ExpenseDossierDrawerProps) => {
  const { isPrivacyMode } = usePrivacy()

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          {expense ? (
            <>
              <SheetTitle className="text-neutral-900 dark:text-neutral-200">
                Dossiê da Despesa: {expense.id}
              </SheetTitle>
              <SheetDescription className="text-neutral-600 dark:text-neutral-400">
                {expense.descricao}
              </SheetDescription>
            </>
          ) : (
            <VisuallyHidden>
              <SheetTitle>Dossiê da Despesa</SheetTitle>
              <SheetDescription>Detalhes da despesa</SheetDescription>
            </VisuallyHidden>
          )}
        </SheetHeader>
        {expense && (
          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200">
                Detalhes da Despesa
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Valor">
                  <span className="tabular-nums">
                    {formatCurrencyBRL(expense.valor, isPrivacyMode)}
                  </span>
                </DetailItem>
                <DetailItem label="Data">
                  {new Date(expense.data).toLocaleDateString('pt-BR')}
                </DetailItem>
                <DetailItem label="Categoria">{expense.categoria}</DetailItem>
                <DetailItem label="Status">
                  <StatusBadge status={expense.status_execucao as any} />
                </DetailItem>
                <DetailItem label="Fornecedor">
                  {expense.fornecedor_nome}
                </DetailItem>
                <DetailItem label="Unidade de Destino">
                  {expense.unidade_destino}
                </DetailItem>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200">
                Responsáveis
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Lançado por">
                  {expense.registrada_por}
                </DetailItem>
                <DetailItem label="Autorizado por">
                  {expense.autorizada_por}
                </DetailItem>
                <DetailItem label="Executado por">
                  {expense.responsavel_execucao}
                </DetailItem>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200">
                Anexos
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nota Fiscal:{' '}
                <a
                  href={expense.nota_fiscal_url || '#'}
                  className="text-primary hover:underline"
                >
                  {expense.nota_fiscal_url ? 'Visualizar' : 'N/A'}
                </a>
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200">
                Histórico de Status
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Histórico não implementado.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
