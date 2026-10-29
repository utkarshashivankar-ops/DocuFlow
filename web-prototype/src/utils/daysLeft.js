import { differenceInCalendarDays, parseISO } from 'date-fns'

export function daysLeft(expiryDate) {
  if (!expiryDate) return null
  return differenceInCalendarDays(parseISO(expiryDate), new Date())
}

export function expiryStatus(expiryDate) {
  const days = daysLeft(expiryDate)
  if (days === null) return 'unknown'
  if (days < 0) return 'expired'
  if (days < 15) return 'urgent'
  if (days < 60) return 'soon'
  return 'safe'
}
