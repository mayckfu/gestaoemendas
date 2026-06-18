import PizZip from 'pizzip'
import { saveAs } from 'file-saver'
import {
  Amendment,
  SituacaoOficial,
  TipoEmenda,
  TipoRecurso,
} from '@/lib/mock-data'
import { format } from 'date-fns'

type TableRange = {
  index: number
  end: number
  xml: string
}

const empty = ''

const sanitizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s*\r?\n\s*/g, ' ')

const escapeXml = (value: unknown) =>
  sanitizeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const formatCurrency = (value?: number | null) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatDate = (value?: string | null) => {
  if (!value) return empty
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return sanitizeText(value)
  return format(date, 'dd/MM/yyyy')
}

const getRows = (tableXml: string) =>
  [...tableXml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)].map((match) => match[0])

const getText = (xml: string) =>
  xml
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const getTables = (documentXml: string): TableRange[] => {
  const tables: TableRange[] = []
  const tagRegex = /<\/?w:tbl\b[^>]*>/g
  let depth = 0
  let start = -1
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(documentXml))) {
    const tag = match[0]

    if (tag.startsWith('</')) {
      depth -= 1

      if (depth === 0 && start >= 0) {
        tables.push({
          index: start,
          end: tagRegex.lastIndex,
          xml: documentXml.slice(start, tagRegex.lastIndex),
        })
        start = -1
      }

      continue
    }

    if (depth === 0) {
      start = match.index
    }

    depth += 1
  }

  return tables
}

const replaceCellText = (cellXml: string, value: unknown) => {
  const replacement = escapeXml(value)
  let usedFirstTextNode = false

  const replaced = cellXml.replace(/<w:t\b([^>]*)>[\s\S]*?<\/w:t>/g, (match, attrs) => {
    if (!usedFirstTextNode) {
      usedFirstTextNode = true
      return `<w:t${attrs}>${replacement}</w:t>`
    }

    return match.replace(/>[\s\S]*?</, '><')
  })

  if (usedFirstTextNode) return replaced

  return cellXml.replace(
    /(<w:p[\s\S]*?>)/,
    `$1<w:r><w:t>${replacement}</w:t></w:r>`,
  )
}

const replaceCells = (xml: string, replacements: Record<number, unknown>) => {
  let cellIndex = 0

  return xml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
    const currentIndex = cellIndex
    cellIndex += 1

    if (!Object.prototype.hasOwnProperty.call(replacements, currentIndex)) {
      return cellXml
    }

    return replaceCellText(cellXml, replacements[currentIndex])
  })
}

const getTipoDocumento = (amendment: Amendment) => {
  if (amendment.tipo === 'programa') return 'PROGRAMA'
  if (amendment.tipo === 'bancada') return 'BANCADA'
  return 'EMENDA'
}

const getTipoDetalhado = (amendment: Amendment) => {
  const tipo = TipoEmenda[amendment.tipo] || amendment.tipo || empty
  const recurso = TipoRecurso[amendment.tipo_recurso] || amendment.tipo_recurso || empty
  return `${tipo} ${recurso}`.trim()
}

const getAutor = (amendment: Amendment) =>
  amendment.autor || amendment.parlamentar || empty

const getObjeto = (amendment: Amendment) =>
  amendment.objeto_emenda || amendment.destino_recurso || empty

const getMeta = (amendment: Amendment) =>
  amendment.meta_operacional || amendment.observacoes || empty

const fillSummaryTable = (summaryTableXml: string, amendments: Amendment[]) => {
  const rows = getRows(summaryTableXml)
  const headerRow = rows[0]
  const dataRowTemplate = rows[1]

  if (!headerRow || !dataRowTemplate) {
    throw new Error('A tabela resumo do modelo nao possui cabecalho e linha de dados.')
  }

  const dataRows = amendments.map((amendment, index) =>
    replaceCells(dataRowTemplate, {
      0: String(index + 1).padStart(2, '0'),
      1: getAutor(amendment),
      2: amendment.numero_proposta || empty,
      3: getTipoDocumento(amendment),
      4: TipoRecurso[amendment.tipo_recurso] || amendment.tipo_recurso || empty,
      5: formatCurrency(amendment.valor_total),
      6: SituacaoOficial[amendment.situacao] || amendment.situacao || empty,
      7: empty,
      8: empty,
    }),
  )

  const firstRowStart = summaryTableXml.indexOf(headerRow)
  const lastRow = rows[rows.length - 1]
  const lastRowEnd = summaryTableXml.lastIndexOf(lastRow) + lastRow.length

  return [
    summaryTableXml.slice(0, firstRowStart),
    headerRow,
    ...dataRows,
    summaryTableXml.slice(lastRowEnd),
  ].join('')
}

const fillDetailTable = (
  detailTableTemplateXml: string,
  amendment: Amendment,
  index: number,
) =>
  replaceCells(detailTableTemplateXml, {
    15: String(index + 1).padStart(2, '0'),
    16: getTipoDetalhado(amendment),
    17: getAutor(amendment),
    18: amendment.numero_emenda || empty,
    19: amendment.numero_proposta || empty,
    20: empty,
    21: empty,
    22: empty,
    23: empty,
    31: formatDate(amendment.data_repasse),
    32: amendment.natureza || empty,
    33: formatCurrency(amendment.valor_total),
    34: getObjeto(amendment),
    35: getMeta(amendment),
  })

const findDetailTable = (tables: TableRange[]) =>
  tables.find((table, index) => {
    if (index === 0) return false
    const text = getText(table.xml).toLowerCase()
    return text.includes('data do repasse') && text.includes('meta')
  })

const findDetailTables = (tables: TableRange[]) =>
  tables.filter((table, index) => {
    if (index === 0) return false
    const text = getText(table.xml).toLowerCase()
    return text.includes('data do repasse') && text.includes('meta')
  })

const buildDocumentFromTemplate = (documentXml: string, amendments: Amendment[]) => {
  const tableMatches = getTables(documentXml)
  const summaryMatch = tableMatches[0]
  const detailTables = findDetailTables(tableMatches)
  const detailMatch = detailTables[0]

  if (!summaryMatch || !detailMatch) {
    throw new Error('O modelo precisa ter a tabela resumo e o bloco detalhado da emenda.')
  }

  const nextTableAfterDetail = tableMatches.find((table) => table.index > detailMatch.index)
  const detailSegmentEnd = nextTableAfterDetail?.index ?? detailMatch.end
  const lastDetailMatch = detailTables[detailTables.length - 1]
  const nextTableAfterLastDetail = tableMatches.find(
    (table) => table.index > lastDetailMatch.index,
  )
  const originalDetailsEnd = nextTableAfterLastDetail?.index ?? lastDetailMatch.end
  const detailSegment = documentXml.slice(detailMatch.index, detailSegmentEnd)
  const summaryTable = fillSummaryTable(summaryMatch.xml, amendments)
  const detailBlocks = amendments
    .map((amendment, index) => {
      const filledTable = fillDetailTable(detailMatch.xml, amendment, index)
      return detailSegment.replace(detailMatch.xml, filledTable)
    })
    .join('')

  return [
    documentXml.slice(0, summaryMatch.index),
    summaryTable,
    documentXml.slice(summaryMatch.end, detailMatch.index),
    detailBlocks,
    documentXml.slice(originalDetailsEnd),
  ].join('')
}

export const exportToDocx = async (amendments: Amendment[]) => {
  try {
    if (!amendments.length) {
      throw new Error('Nenhuma emenda encontrada para exportar.')
    }

    const response = await fetch('/template.docx')

    if (!response.ok) {
      throw new Error(`Nao foi possivel carregar o template. Status: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const zip = new PizZip(arrayBuffer)
    const documentFile = zip.file('word/document.xml')

    if (!documentFile) {
      throw new Error('O template nao contem word/document.xml.')
    }

    zip.file('word/document.xml', buildDocumentFromTemplate(documentFile.asText(), amendments))

    const out = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    saveAs(out, `Monitoramento_Emendas_${format(new Date(), 'yyyyMMdd_HHmm')}.docx`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao gerar DOCX:', error)
    return { success: false, error }
  }
}
