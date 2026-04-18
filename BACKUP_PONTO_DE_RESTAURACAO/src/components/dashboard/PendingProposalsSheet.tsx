import { useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { DetailedAmendment } from '@/lib/mock-data'
import { formatCurrencyBRL } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { Users, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PendingProposalsSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  pendingType: string | null
  proposals: DetailedAmendment[]
}

export const PendingProposalsSheet = ({
  isOpen,
  onOpenChange,
  pendingType,
  proposals,
}: PendingProposalsSheetProps) => {
  const [selectedParliamentarian, setSelectedParliamentarian] = useState<
    string | null
  >(null)

  const parliamentarians = useMemo(() => {
    if (pendingType !== 'Por Parlamentar') return []

    const groups = proposals.reduce(
      (acc, proposal) => {
        const name = proposal.parlamentar || 'Desconhecido'
        if (!acc[name]) {
          acc[name] = {
            name,
            count: 0,
            totalValue: 0,
          }
        }
        acc[name].count += 1
        acc[name].totalValue += proposal.valor_total
        return acc
      },
      {} as Record<string, { name: string; count: number; totalValue: number }>,
    )

    return Object.values(groups).sort((a, b) => b.totalValue - a.totalValue)
  }, [pendingType, proposals])

  const filteredProposals = useMemo(() => {
    if (selectedParliamentarian) {
      return proposals.filter(
        (p) => (p.parlamentar || 'Desconhecido') === selectedParliamentarian,
      )
    }
    return proposals
  }, [selectedParliamentarian, proposals])

  if (!pendingType) return null

  const handleBack = () => {
    setSelectedParliamentarian(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedParliamentarian(null)
    }
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {selectedParliamentarian && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="text-neutral-900 dark:text-neutral-200">
              {selectedParliamentarian
                ? selectedParliamentarian
                : pendingType === 'Por Parlamentar'
                  ? 'Parlamentares'
                  : 'Propostas com Pendência'}
            </SheetTitle>
          </div>
          <SheetDescription className="text-neutral-600 dark:text-neutral-400">
            {selectedParliamentarian
              ? `${filteredProposals.length} propostas encontradas`
              : `${pendingType} (${
                  pendingType === 'Por Parlamentar'
                    ? parliamentarians.length
                    : proposals.length
                })`}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-4 pr-4">
            {pendingType === 'Por Parlamentar' && !selectedParliamentarian
              ? parliamentarians.map((p) => (
                  <Card
                    key={p.name}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedParliamentarian(p.name)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-200">
                            {p.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {p.count} emendas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums text-sm">
                          {formatCurrencyBRL(p.totalValue)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : filteredProposals.map((proposal) => (
                  <Link
                    to={`/emenda/${proposal.id}`}
                    key={proposal.id}
                    onClick={() => onOpenChange(false)}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base font-semibold">
                            {proposal.numero_proposta}
                          </CardTitle>
                          <StatusBadge
                            status={proposal.status_interno}
                            className="whitespace-normal text-right h-auto py-1 max-w-[60%]"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {proposal.autor}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Valor Total
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrencyBRL(proposal.valor_total)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
