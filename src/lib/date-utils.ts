import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDateToDB(date: Date | undefined | null): string {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

export function parseDateFromDB(
  dateStr: string | undefined | null,
): Date | undefined {
  if (!dateStr) return undefined

  // If it's a full ISO string with time
  if (dateStr.includes('T')) {
    return new Date(dateStr)
  }

  // If it's YYYY-MM-DD, construct date manually to avoid timezone offsets
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    return new Date(year, month, day)
  }

  return new Date(dateStr)
}

export function formatDisplayDate(
  dateStr: string | Date | undefined | null,
): string {
  if (!dateStr) return '-'

  let date: Date

  if (dateStr instanceof Date) {
    date = dateStr
  } else {
    // Handle string input
    const parsed = parseDateFromDB(dateStr)
    if (!parsed) return '-'
    date = parsed
  }

  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatNotificationDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

  if (diffInMinutes < 1) return 'Agora'
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Há ${diffInHours} h`

  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}
