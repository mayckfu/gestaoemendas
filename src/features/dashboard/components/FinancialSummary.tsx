import { useMemo } from 'react'
import { Amendment, Despesa } from '@/lib/mock-data'
import { FinancialSummaryGroupCard } from './FinancialSummaryGroupCard'
import { sumExecutedExpenses } from '@/lib/financial-calculations'
import {
  calculateResourceTotals,
  getResourceBucket,
  ResourceBucket,
} from '@/lib/resource-classification'

interface FinancialSummaryProps {
  amendments: Amendment[]
  despesas: Despesa[]
}

export const FinancialSummary = ({
  amendments,
  despesas,
}: FinancialSummaryProps) => {
  const summaryData = useMemo(() => {
    const calculateExecutedValue = (targetAmendments: Amendment[]) => {
      const ids = new Set(targetAmendments.map((amendment) => amendment.id))
      return sumExecutedExpenses(
        despesas.filter((despesa) => despesa.emenda_id && ids.has(despesa.emenda_id)),
      )
    }

    const totals = calculateResourceTotals(amendments)
    const bucketSummary = (buckets: ResourceBucket[], total: number) => {
      const paid = calculateExecutedValue(
        amendments.filter((a) => buckets.includes(getResourceBucket(a.tipo_recurso))),
      )
      return { total, paid, pending: Math.max(0, total - paid) }
    }

    return {
      custeioMac: bucketSummary(['custeioMac'], totals.custeioMac),
      custeioPap: bucketSummary(['custeioPap'], totals.custeioPap),
      incrementoMac: bucketSummary(
        ['incrementoMac'],
        totals.incrementoMac,
      ),
      incrementoPap: bucketSummary(
        ['incrementoPap'],
        totals.incrementoPap,
      ),
    }
  }, [amendments, despesas])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
      >
        <FinancialSummaryGroupCard
          title="Custeio"
          subtitle="MAC e PAP separados"
          type="custeio"
          lines={[
            {
              label: 'MAC',
              total: summaryData.custeioMac.total,
              executed: summaryData.custeioMac.paid,
              pending: summaryData.custeioMac.pending,
              to: '/emendas?tipoRecurso=CUSTEIO_MAC_TOTAL',
            },
            {
              label: 'PAP',
              total: summaryData.custeioPap.total,
              executed: summaryData.custeioPap.paid,
              pending: summaryData.custeioPap.pending,
              to: '/emendas?tipoRecurso=CUSTEIO_PAP_TOTAL',
            },
          ]}
        />
      </div>
      <div
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <FinancialSummaryGroupCard
          title="Incremento"
          subtitle="MAC e PAP separados"
          type="incremento"
          lines={[
            {
              label: 'MAC',
              total: summaryData.incrementoMac.total,
              executed: summaryData.incrementoMac.paid,
              pending: summaryData.incrementoMac.pending,
              to: '/emendas?tipoRecurso=INCREMENTO_MAC',
            },
            {
              label: 'PAP',
              total: summaryData.incrementoPap.total,
              executed: summaryData.incrementoPap.paid,
              pending: summaryData.incrementoPap.pending,
              to: '/emendas?tipoRecurso=INCREMENTO_PAP',
            },
          ]}
        />
      </div>
    </div>
  )
}
