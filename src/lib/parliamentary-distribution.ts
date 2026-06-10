import { Amendment } from '@/lib/mock-data'
import { normalizeNameKey } from '@/lib/utils'

const PARLIAMENTARY_NAME_ALIASES: Record<string, string> = {
  [normalizeNameKey('ALESSANDRO VIEIRA')]: 'Alessandro Vieira',
  [normalizeNameKey('ALESSANDO VIEIRA')]: 'Alessandro Vieira',
  [normalizeNameKey('KATARINA')]: 'Katarina',
  [normalizeNameKey('KARATINA')]: 'Katarina',
  [normalizeNameKey('FABIO REIS')]: 'Fabio Reis',
}

function cleanName(name?: string | null) {
  return name?.trim().replace(/\s+/g, ' ') || ''
}

export function isValidResponsibleName(name?: string | null) {
  const cleaned = cleanName(name)
  const key = normalizeNameKey(cleaned)

  return !!key && key !== '-'
}

export function getCanonicalResponsibleName(name: string) {
  const cleaned = cleanName(name)
  const key = normalizeNameKey(cleaned)
  return PARLIAMENTARY_NAME_ALIASES[key] || cleaned
}

export const getCanonicalParliamentaryName = getCanonicalResponsibleName

export function getResponsibleKey(name?: string | null) {
  if (!isValidResponsibleName(name)) return ''
  return normalizeNameKey(getCanonicalResponsibleName(name as string))
}

export function calculateParliamentaryDistribution(amendments: Amendment[]) {
  const totals: Record<string, number> = {}
  const displayNameMap: Record<string, string> = {}

  const addShare = (name: string | null | undefined, value: number) => {
    if (!isValidResponsibleName(name) || value <= 0) return

    const key = getResponsibleKey(name)
    const displayName = getCanonicalResponsibleName(name as string)

    displayNameMap[key] = displayName
    totals[key] = (totals[key] || 0) + value
  }

  amendments.forEach((amendment) => {
    const total = Number(amendment.valor_total || 0)
    const coauthors = [
      {
        name: amendment.segundo_parlamentar,
        value: Number(amendment.valor_segundo_responsavel || 0),
      },
      {
        name: amendment.terceiro_parlamentar,
        value: Number(amendment.valor_terceiro_responsavel || 0),
      },
      {
        name: amendment.quarto_parlamentar,
        value: Number(amendment.valor_quarto_responsavel || 0),
      },
    ].filter((share) => isValidResponsibleName(share.name) && share.value > 0)

    const coauthorTotal = coauthors.reduce((sum, share) => sum + share.value, 0)

    if (coauthorTotal > total && coauthorTotal > 0) {
      const scale = total / coauthorTotal
      coauthors.forEach((share) => addShare(share.name, share.value * scale))
      return
    }

    addShare(amendment.parlamentar, total - coauthorTotal)
    coauthors.forEach((share) => addShare(share.name, share.value))
  })

  return Object.entries(totals)
    .map(([key, value]) => ({ name: displayNameMap[key] || key, value }))
    .sort((a, b) => b.value - a.value)
}
