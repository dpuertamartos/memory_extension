export type CalendarScope = "day" | "week" | "month" | "year"

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

export function addYears(date: Date, years: number): Date {
  const copy = new Date(date)
  copy.setFullYear(copy.getFullYear() + years)
  return copy
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getScopeRange(scope: CalendarScope, anchor: Date): { from: Date; to: Date } {
  switch (scope) {
    case "day":
      return { from: startOfDay(anchor), to: endOfDay(anchor) }
    case "week": {
      const start = startOfDay(anchor)
      start.setDate(start.getDate() - start.getDay())
      const end = endOfDay(addDays(start, 6))
      return { from: start, to: end }
    }
    case "month": {
      const from = startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
      const to = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0))
      return { from, to }
    }
    case "year": {
      const from = startOfDay(new Date(anchor.getFullYear(), 0, 1))
      const to = endOfDay(new Date(anchor.getFullYear(), 11, 31))
      return { from, to }
    }
  }
}

export function shiftAnchor(scope: CalendarScope, anchor: Date, delta: number): Date {
  switch (scope) {
    case "day":
      return addDays(anchor, delta)
    case "week":
      return addDays(anchor, delta * 7)
    case "month":
      return addMonths(anchor, delta)
    case "year":
      return addYears(anchor, delta)
  }
}

export function formatScopeLabel(scope: CalendarScope, anchor: Date): string {
  switch (scope) {
    case "day":
      return anchor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    case "week": {
      const { from, to } = getScopeRange("week", anchor)
      const sameMonth = from.getMonth() === to.getMonth()
      const fromLabel = from.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      const toLabel = to.toLocaleDateString(undefined, {
        month: sameMonth ? undefined : "short",
        day: "numeric",
        year: "numeric",
      })
      return `${fromLabel} – ${toLabel}`
    }
    case "month":
      return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    case "year":
      return String(anchor.getFullYear())
  }
}

export function getMonthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfDay(first)
  start.setDate(start.getDate() - start.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    days.push(addDays(start, i))
  }
  return days
}

export function getWeekDays(anchor: Date): Date[] {
  const { from } = getScopeRange("week", anchor)
  return Array.from({ length: 7 }, (_, index) => addDays(from, index))
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "it",
  "this",
  "that",
  "with",
  "as",
  "by",
  "from",
  "be",
  "are",
  "was",
  "were",
  "not",
  "no",
  "yes",
  "you",
  "your",
  "i",
  "my",
  "me",
  "we",
  "our",
  "they",
  "their",
  "he",
  "she",
  "his",
  "her",
  "untitled",
])

export function extractTopKeywords(
  texts: string[],
  limit = 8,
): { word: string; count: number }[] {
  const counts = new Map<string, number>()

  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}
