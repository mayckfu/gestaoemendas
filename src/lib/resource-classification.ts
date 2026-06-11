import { Amendment, TipoRecursoEnum } from '@/lib/mock-data'

export type ResourceBucket =
  | 'custeioMac'
  | 'custeioPap'
  | 'incrementoMac'
  | 'incrementoPap'
  | 'equipamentoLegado'
  | 'outro'

export const CUSTEIO_MAC_TYPES: TipoRecursoEnum[] = ['CUSTEIO_MAC']

export const CUSTEIO_PAP_TYPES: TipoRecursoEnum[] = ['CUSTEIO_PAP']

export const INCREMENTO_MAC_TYPES: TipoRecursoEnum[] = ['INCREMENTO_MAC']
export const INCREMENTO_PAP_TYPES: TipoRecursoEnum[] = ['INCREMENTO_PAP']

export function getResourceBucket(tipoRecurso?: TipoRecursoEnum | string | null): ResourceBucket {
  if (CUSTEIO_MAC_TYPES.includes(tipoRecurso as TipoRecursoEnum)) {
    return 'custeioMac'
  }
  if (CUSTEIO_PAP_TYPES.includes(tipoRecurso as TipoRecursoEnum)) {
    return 'custeioPap'
  }
  if (INCREMENTO_MAC_TYPES.includes(tipoRecurso as TipoRecursoEnum)) {
    return 'incrementoMac'
  }
  if (INCREMENTO_PAP_TYPES.includes(tipoRecurso as TipoRecursoEnum)) {
    return 'incrementoPap'
  }
  if (tipoRecurso === 'EQUIPAMENTO') {
    return 'equipamentoLegado'
  }
  return 'outro'
}

export function calculateResourceTotals(amendments: Amendment[]) {
  return amendments.reduce(
    (totals, amendment) => {
      const value = Number(amendment.valor_total || 0)
      const bucket = getResourceBucket(amendment.tipo_recurso)
      totals[bucket] += value
      return totals
    },
    {
      custeioMac: 0,
      custeioPap: 0,
      incrementoMac: 0,
      incrementoPap: 0,
      equipamentoLegado: 0,
      outro: 0,
    } satisfies Record<ResourceBucket, number>,
  )
}

export function isMacResource(tipoRecurso?: TipoRecursoEnum | string | null) {
  const bucket = getResourceBucket(tipoRecurso)
  return bucket === 'custeioMac' || bucket === 'incrementoMac'
}

export function isPapResource(tipoRecurso?: TipoRecursoEnum | string | null) {
  const bucket = getResourceBucket(tipoRecurso)
  return bucket === 'custeioPap' || bucket === 'incrementoPap'
}
