import { useMemo } from 'react'
import { Amendment, Repasse, Despesa } from '@/lib/mock-data'
import { FinancialSummaryCard } from './FinancialSummaryCard'

interface FinancialSummaryProps {
  amendments: Amendment[]
  repasses: Repasse[]
  despesas: Despesa[]
}

export const FinancialSummary = ({
  amendments,
  repasses,
  despesas,
}: FinancialSummaryProps) => {
  const summaryData = useMemo(() => {
    // Helper to get the progress value for a set of amendments
    // It calculates the progress for each amendment as the MAX of its repasses and liquidated expenses
    // to avoid double counting the same money in different stages of the flow.
    const calculateProgressValue = (targetAmendments: Amendment[]) => {
      return targetAmendments.reduce((sum, amendment) => {
        const amendmentRepasses = repasses
          .filter((r) => r.emenda_id === amendment.id && r.status === 'REPASSADO')
          .reduce((s, r) => s + r.valor, 0)
        
        const amendmentDespesas = despesas
          .filter((d) => 
            d.emenda_id === amendment.id && 
            (d.status_execucao === 'LIQUIDADA' || d.status_execucao === 'PAGA')
          )
          .reduce((s, d) => s + d.valor, 0)
        
        // Take the maximum to represent the furthest financial stage reached
        return sum + Math.max(amendmentRepasses, amendmentDespesas)
      }, 0)
    }

    // MAC Data
    const macAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_MAC' || a.tipo_recurso === 'CUSTEIO_MAC',
    )
    const totalMac = macAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidMac = calculateProgressValue(macAmendments)
    const pendingMac = Math.max(0, totalMac - paidMac)

    // PAP Data
    const papAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_PAP' || a.tipo_recurso === 'CUSTEIO_PAP',
    )
    const totalPap = papAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidPap = calculateProgressValue(papAmendments)
    const pendingPap = Math.max(0, totalPap - paidPap)

    // Equipamentos Data
    const equipAmendments = amendments.filter(
      (a) => a.tipo_recurso === 'EQUIPAMENTO',
    )
    const totalEquip = equipAmendments.reduce(
      (sum, a) => sum + a.valor_total,
      0,
    )
    const paidEquip = calculateProgressValue(equipAmendments)
    const pendingEquip = Math.max(0, totalEquip - paidEquip)

    return {
      mac: { total: totalMac, paid: paidMac, pending: pendingMac },
      pap: { total: totalPap, paid: paidPap, pending: pendingPap },
      equip: { total: totalEquip, paid: paidEquip, pending: pendingEquip },
    }
  }, [amendments, repasses, despesas])

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
