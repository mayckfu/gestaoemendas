import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  SituacaoOficial,
  StatusInterno,
  SituacaoOficialEnum,
  StatusInternoEnum,
} from '@/lib/mock-data'

type Status =
  | SituacaoOficialEnum
  | StatusInternoEnum
  | 'Pendente'
  | 'Aprovado'
  | 'Rejeitado'
  | 'Em Análise'
  | 'Rascunho'
  | 'Em Revisão'
  | 'Aguardando Repasse'
  | 'Concluído'
  | 'Realizado'
  | 'Aprovada'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusDisplayMap: Record<string, string> = {
  ...SituacaoOficial,
  ...StatusInterno,
  Pendente: 'Pendente',
  Aprovado: 'Aprovado',
  Rejeitado: 'Rejeitado',
  'Em Análise': 'Em Análise',
  Rascunho: 'Rascunho',
  'Em Revisão': 'Em Revisão',
  'Aguardando Repasse': 'Aguardando Repasse',
  Concluído: 'Concluído',
  Realizado: 'Realizado',
  Aprovada: 'Aprovada',
}

// Updated with high-contrast colors (text-white for dark backgrounds)
const statusColors: Record<string, string> = {
  // Oficial
  PAGA: 'bg-emerald-700 text-white border-emerald-800',
  EMPENHADA_AGUARDANDO_FORMALIZACAO: 'bg-blue-700 text-white border-blue-800',
  FAVORAVEL: 'bg-sky-700 text-white border-sky-800',
  EM_ANALISE: 'bg-indigo-700 text-white border-indigo-800',
  LIBERADO_PAGAMENTO_FNS: 'bg-teal-700 text-white border-teal-800',
  OUTRA: 'bg-neutral-600 text-white border-neutral-700',

  // Interno
  RASCUNHO: 'bg-neutral-600 text-white border-neutral-700',
  EM_EXECUCAO: 'bg-blue-700 text-white border-blue-800',
  PAGA_SEM_DOCUMENTOS: 'bg-amber-700 text-white border-amber-800',
  PAGA_COM_PENDENCIAS: 'bg-orange-700 text-white border-orange-800',
  CONCLUIDA: 'bg-emerald-800 text-white border-emerald-900',
  PROPOSTA_PAGA: 'bg-emerald-700 text-white border-emerald-800',
  EM_ANALISE_PAGAMENTO: 'bg-indigo-700 text-white border-indigo-800',
  APROVADA_PAGAMENTO: 'bg-teal-700 text-white border-teal-800',
  AUTORIZADA_AGUARDANDO_EMPENHO: 'bg-blue-600 text-white border-blue-700',
  AGUARDANDO_AUTORIZACAO_FNS: 'bg-orange-600 text-white border-orange-700',
  PORTARIA_PUBLICADA_AGUARDANDO_FNS:
    'bg-purple-700 text-white border-purple-800',
  ENVIADA_PUBLICACAO_PORTARIA: 'bg-violet-700 text-white border-violet-800',
  PROPOSTA_APROVADA: 'bg-green-700 text-white border-green-800',
  CLASSIFICADA_AGUARDANDO_SECRETARIA:
    'bg-yellow-700 text-white border-yellow-800',
  ANALISE_TECNICA_MERITO: 'bg-cyan-700 text-white border-cyan-800',

  // Others
  Pendente: 'bg-amber-600 text-white border-amber-700',
  Aprovado: 'bg-green-700 text-white border-green-800',
  Rejeitado: 'bg-red-700 text-white border-red-800',
  'Em Análise': 'bg-indigo-600 text-white border-indigo-700',
  'Em Revisão': 'bg-blue-600 text-white border-blue-700',
  'Aguardando Repasse': 'bg-purple-600 text-white border-purple-700',
  Concluído: 'bg-emerald-700 text-white border-emerald-800',
  Realizado: 'bg-emerald-700 text-white border-emerald-800',
  Aprovada: 'bg-green-700 text-white border-green-800',
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const displayText = statusDisplayMap[status] || status
  return (
    <Badge
      className={cn(
        'whitespace-nowrap px-3 py-1 text-xs font-semibold shadow-sm border',
        statusColors[status] || 'bg-neutral-600 text-white border-neutral-700',
        className,
      )}
    >
      {displayText}
    </Badge>
  )
}
