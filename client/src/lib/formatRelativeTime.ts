export function formatRelativeTime(
  date: Date | number | string | null | undefined,
  locale?: string,
): string {
  const value = date instanceof Date ? date : new Date(date ?? 0)
  if (Number.isNaN(value.getTime())) return ""

  const diffSec = Math.round((value.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  const absSec = Math.abs(diffSec)
  if (absSec < 60) return rtf.format(diffSec, "second")

  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute")

  const diffHour = Math.round(diffSec / 3600)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour")

  const diffDay = Math.round(diffSec / 86400)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day")

  const diffMonth = Math.round(diffSec / (86400 * 30))
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month")

  return rtf.format(Math.round(diffSec / (86400 * 365)), "year")
}
