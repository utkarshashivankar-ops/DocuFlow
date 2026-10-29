import { format, parseISO } from 'date-fns'

export function formatDate(dateStr, pattern = 'MMM d, yyyy') {
  if (!dateStr) return '—'
  try {
    return format(typeof dateStr === 'string' ? parseISO(dateStr) : dateStr, pattern)
  } catch {
    return dateStr
  }
}
