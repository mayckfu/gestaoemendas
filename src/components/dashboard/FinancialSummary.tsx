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
    // Helper to get repasses for a list of amendments
    const getRepassesValue = (targetAmendments: Amendment[]) => {
      const amendmentIds = new Set(targetAmendments.map((a) => a.id))
      return repasses
        .filter(
          (r) => amendmentIds.has(r.emenda_id) && r.status === 'REPASSADO',
        )
        .reduce((sum, r) => sum + r.valor, 0)
    }

    // Helper to get liquidated expenses for a list of amendments
    const getLiquidatedExpensesValue = (targetAmendments: Amendment[]) => {
      const amendmentIds = new Set(targetAmendments.map((a) => a.id))
      return despesas
        .filter(
          (d) =>
            amendmentIds.has(d.emenda_id) &&
            (d.status_execucao === 'LIQUIDADA' || d.status_execucao === 'PAGA'),
        )
        .reduce((sum, d) => sum + d.valor, 0)
    }

    // MAC Data
    const macAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_MAC' || a.tipo_recurso === 'CUSTEIO_MAC',
    )
    const totalMac = macAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidMac = getRepassesValue(macAmendments)
    const pendingMac = totalMac - paidMac

    // PAP Data
    const papAmendments = amendments.filter(
      (a) =>
        a.tipo_recurso === 'INCREMENTO_PAP' || a.tipo_recurso === 'CUSTEIO_PAP',
    )
    const totalPap = papAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const paidPap = getRepassesValue(papAmendments)
    const pendingPap = totalPap - paidPap

    // Equipamentos Data
    const equipAmendments = amendments.filter(
      (a) => a.tipo_recurso === 'EQUIPAMENTO',
    )
    const totalEquip = equipAmendments.reduce(
      (sum, a) => sum + a.valor_total,
      0,
    )

    // UPDATED LOGIC: Calculate Liquidado for Equipments based on Repasses table AND Liquidated/Paid Expenses.
    // This ensures synchronization with both transfer mechanisms (repasses) and direct execution (despesas).
    const repassesEquip = getRepassesValue(equipAmendments)
    const despesasEquip = getLiquidatedExpensesValue(equipAmendments)

    // Sum both values to get the total execution/transfer value.
    // Assumption: Repasses and Direct Expenses are recorded separately and do not overlap in value for the same item
    // in a way that causes double counting of the SAME money (e.g. repasse -> despesa).
    // If they do, this logic prioritizes showing the total financial movement.
    const paidEquip = repassesEquip + despesasEquip

    const pendingEquip = totalEquip - paidEquip

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
