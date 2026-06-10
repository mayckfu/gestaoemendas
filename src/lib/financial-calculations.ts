import { Despesa, Repasse } from '@/lib/mock-data'

export const EXECUTED_EXPENSE_STATUSES: Despesa['status_execucao'][] = [
  'LIQUIDADA',
  'PAGA',
]

export function isExecutedExpense(expense: Despesa) {
  return EXECUTED_EXPENSE_STATUSES.includes(expense.status_execucao)
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
