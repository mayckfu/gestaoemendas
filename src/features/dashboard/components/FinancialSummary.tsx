import { useMemo } from 'react'
import { Amendment, Despesa } from '@/lib/mock-data'
import { FinancialSummaryCard } from './FinancialSummaryCard'
import { sumExecutedExpenses } from '@/lib/financial-calculations'

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

    // MAC Data
    const macAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_MAC' || a.tipo_recurso === 'CUSTEIO_MAC',
    )
    const totalMac = macAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidMac = calculateExecutedValue(macAmendments)
    const pendingMac = Math.max(0, totalMac - paidMac)

    // PAP Data
    const papAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_PAP' || a.tipo_recurso === 'CUSTEIO_PAP',
    )
    const totalPap = papAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidPap = calculateExecutedValue(papAmendments)
    const pendingPap = Math.max(0, totalPap - paidPap)

    // Equipamentos Data
    const equipAmendments = amendments.filter(
      (a) => a.tipo_recurso === 'EQUIPAMENTO',
    )
    const totalEquip = equipAmendments.reduce(
      (sum, a) => sum + a.valor_total,
      0,
    )
    const paidEquip = calculateExecutedValue(equipAmendments)
    const pendingEquip = Math.max(0, totalEquip - paidEquip)

    return {
      mac: { total: totalMac, paid: paidMac, pending: pendingMac },
      pap: { total: totalPap, paid: paidPap, pending: pendingPap },
      equip: { total: totalEquip, paid: paidEquip, pending: pendingEquip },
    }
  }, [amendments, despesas])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
      >
        <FinancialSummaryCard
          title="Incremento MAC"
          totalValue={summaryData.mac.total}
          paidValue={summaryData.mac.paid}
          pendingValue={summaryData.mac.pending}
          type="MAC"
          to="/propostas/mac"
        />
      </div>
      <div
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <FinancialSummaryCard
          title="Incremento PAP"
          totalValue={summaryData.pap.total}
          paidValue={summaryData.pap.paid}
          pendingValue={summaryData.pap.pending}
          type="PAP"
          to="/propostas/pap"
        />
      </div>
      <div
        className="animate-fade-in-up opacity-0"
        style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
      >
        <FinancialSummaryCard
          title="Equipamentos"
          totalValue={summaryData.equip.total}
          paidValue={summaryData.equip.paid}
          pendingValue={summaryData.equip.pending}
          type="EQUIPAMENTO"
          to="/emendas?tipoRecurso=EQUIPAMENTO"
        />
      </div>
    </div>
  )
}
