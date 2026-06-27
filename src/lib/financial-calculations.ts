import { Amendment, Despesa, Repasse } from '@/lib/mock-data'

export const EXECUTED_EXPENSE_STATUSES: Despesa['status_execucao'][] = [
  'LIQUIDADA',
  'PAGA',
]

const PAID_AMENDMENT_STATUSES: Amendment['status_interno'][] = [
  'PAGA_SEM_DOCUMENTOS',
  'PAGA_COM_PENDENCIAS',
  'CONCLUIDA',
  'PROPOSTA_PAGA',
]

export function isExecutedExpense(expense: Despesa) {
  return EXECUTED_EXPENSE_STATUSES.includes(expense.status_execucao)
}

export function isPaidAmendment(amendment: Amendment) {
  return (
    amendment.situacao === 'PAGA' ||
    PAID_AMENDMENT_STATUSES.includes(amendment.status_interno)
  )
}

export function isCompletedRepasse(repasse: Repasse) {
  return repasse.status === 'REPASSADO'
}

export function sumValues<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + Number(getValue(item) || 0), 0)
}

export function sumCompletedRepasses(repasses: Repasse[]) {
  return sumValues(repasses.filter(isCompletedRepasse), (repasse) => repasse.valor)
}

export function sumExecutedExpenses(despesas: Despesa[]) {
  return sumValues(despesas.filter(isExecutedExpense), (despesa) => despesa.valor)
}

export function getPaidAmountForAmendment(
  amendment: Amendment,
  despesas: Despesa[] = [],
) {
  const paidExpenses = sumExecutedExpenses(despesas)
  const paidProposalValue = isPaidAmendment(amendment)
    ? Number(amendment.valor_total || 0)
    : 0

  return Math.max(paidProposalValue, paidExpenses)
}
