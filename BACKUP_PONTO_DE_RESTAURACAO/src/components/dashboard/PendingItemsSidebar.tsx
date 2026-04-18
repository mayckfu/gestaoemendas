import { useState, useMemo } from 'react'
import {
  FileText,
  Archive,
  Banknote,
  ShieldAlert,
  AlertTriangle,
  Megaphone,
  Users,
  ChevronRight,
  BellRing,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailedAmendment } from '@/lib/mock-data'
import { PendingProposalsSheet } from './PendingProposalsSheet'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type AlertItem = {
  title: string
  count: number
  icon: React.ElementType
  filter: (amendment: DetailedAmendment) => boolean
  urgency: 'high' | 'medium' | 'low'
  borderClass: string
}

interface PendingItemsSidebarProps {
  amendments: DetailedAmendment[]
}

const isDismissed = (amendment: DetailedAmendment, targetId: string) => {
  return amendment.pendencias.some(
    (p) => p.targetId === targetId && (p.dispensada || p.resolvida),
  )
}

export const PendingItemsSidebar = ({
  amendments,
}: PendingItemsSidebarProps) => {
  const [selectedPending, setSelectedPending] = useState<string | null>(null)

  const allDespesas = useMemo(
    () => amendments.flatMap((a) => a.despesas),
    [amendments],
  )

  const pendingItems: AlertItem[] = useMemo(
    () => [
      {
        title: 'Despesas > Repasses',
        count: amendments.filter((a) => a.total_gasto > a.total_repassado)
          .length,
        icon: AlertTriangle,
        filter: (a) => a.total_gasto > a.total_repassado,
        urgency: 'high',
        borderClass: 'border-l-orange-500', // Urgent - Orange
      },
      {
        title: 'Sem Anexos Essenciais',
        count: amendments.filter(
          (a) =>
            !a.anexos_essenciais &&
            !isDismissed(a, 'proposta') &&
            !isDismissed(a, 'oficio'),
        ).length,
        icon: Archive,
        filter: (a) =>
          !a.anexos_essenciais &&
          !isDismissed(a, 'proposta') &&
          !isDismissed(a, 'oficio'),
        urgency: 'high',
        borderClass: 'border-l-rose-500', // Essential - Rose
      },
      {
        title: 'Falta Portaria',
        count: amendments.filter(
          (a) => !a.portaria && !isDismissed(a, 'portaria'),
        ).length,
        icon: FileText,
        filter: (a) => !a.portaria && !isDismissed(a, 'portaria'),
        urgency: 'medium',
        borderClass: 'border-l-blue-500', // Pending - Blue
      },
      {
        title: 'Falta Deliberação CIE',
        count: amendments.filter(
          (a) => !a.deliberacao_cie && !isDismissed(a, 'cie'),
        ).length,
        icon: FileText,
        filter: (a) => !a.deliberacao_cie && !isDismissed(a, 'cie'),
        urgency: 'medium',
        borderClass: 'border-l-blue-500',
      },
      {
        title: 'Sem Repasses',
        count: amendments.filter((a) => a.total_repassado <= 0).length,
        icon: Banknote,
        filter: (a) => a.total_repassado <= 0,
        urgency: 'low',
        borderClass: 'border-l-blue-400',
      },
      {
        title: 'Despesas sem autorização',
        count: allDespesas.filter((d) => !d.autorizada_por).length,
        icon: ShieldAlert,
        filter: (a) => a.despesas.some((d) => !d.autorizada_por),
        urgency: 'high',
        borderClass: 'border-l-orange-500',
      },
      {
        title: 'Propostas de Alto Valor',
        count: amendments.filter((a) => a.valor_total > 500000).length,
        icon: Megaphone,
        filter: (a) => a.valor_total > 500000,
        urgency: 'medium',
        borderClass: 'border-l-rose-500',
      },
      {
        title: 'Por Parlamentar',
        count: new Set(amendments.map((a) => a.parlamentar)).size,
        icon: Users,
        filter: () => true,
        urgency: 'low',
        borderClass: 'border-l-brand-600',
      },
    ],
    [amendments, allDespesas],
  )

  const filteredProposals = useMemo(() => {
    if (!selectedPending) return []
    const pendingItem = pendingItems.find((p) => p.title === selectedPending)
    if (!pendingItem) return []
    return amendments.filter(pendingItem.filter)
  }, [selectedPending, pendingItems, amendments])

  return (
    <>
      <Card className="bg-white border-border/50 shadow-card rounded-xl h-full overflow-hidden flex flex-col">
        <CardHeader className="bg-brand-50/50 pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-brand-600" />
            Alertas e Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {pendingItems
              .filter((item) => item.count > 0)
              .map((item) => (
                <button
                  key={item.title}
                  className={cn(
                    'group w-full flex items-center justify-between p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-all duration-200 text-left border-l-[4px]',
                    item.borderClass,
                  )}
                  onClick={() => setSelectedPending(item.title)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-white border border-neutral-200 shadow-sm group-hover:scale-105 transition-transform',
                      )}
                    >
                      <item.icon className="h-4 w-4 text-neutral-600 group-hover:text-brand-700" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-neutral-800 group-hover:text-brand-900">
                        {item.title}
                      </span>
                      {item.urgency === 'high' && (
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse-subtle"></span>
                          Urgente
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="font-bold tabular-nums bg-neutral-100 text-neutral-700 border border-neutral-200 group-hover:bg-white group-hover:border-brand-200"
                    >
                      {item.count}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>
      <PendingProposalsSheet
        isOpen={!!selectedPending}
        onOpenChange={(isOpen) => !isOpen && setSelectedPending(null)}
        pendingType={selectedPending}
        proposals={filteredProposals}
      />
    </>
  )
}
