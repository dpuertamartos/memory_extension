export type DateField = "created" | "updated"
export type DatePreset = "last_week" | "last_month" | "this_month" | "this_year"

export type SearchFilters = {
  keywords: string[]
  tagIds: string[]
  dateField: DateField
  datePreset: DatePreset | null
  dateFrom: Date | null
  dateTo: Date | null
}

export function emptySearchFilters(): SearchFilters {
  return {
    keywords: [],
    tagIds: [],
    dateField: "updated",
    datePreset: null,
    dateFrom: null,
    dateTo: null,
  }
}

export function isSearchActive(filters: SearchFilters): boolean {
  return (
    filters.keywords.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.datePreset !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null
  )
}

export function escapeFtsTerm(term: string): string {
  return term.replace(/"/g, '""')
}

/** Build an FTS5 MATCH expression: each word is a prefix term, combined with AND. */
export function buildFtsMatchQuery(words: string[]): string | null {
  const terms = words.map((word) => word.trim()).filter(Boolean)
  if (terms.length === 0) return null
  return terms.map((term) => `"${escapeFtsTerm(term)}"*`).join(" AND ")
}

export function resolveDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date()
  const to = endOfDay(now)

  switch (preset) {
    case "last_week": {
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      return { from: startOfDay(from), to }
    }
    case "last_month": {
      const from = new Date(now)
      from.setMonth(from.getMonth() - 1)
      return { from: startOfDay(from), to }
    }
    case "this_month":
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to }
    case "this_year":
      return { from: startOfDay(new Date(now.getFullYear(), 0, 1)), to }
  }
}

export function getEffectiveDateRange(filters: SearchFilters): { from: Date; to: Date } | null {
  if (filters.dateFrom || filters.dateTo) {
    return {
      from: filters.dateFrom ? startOfDay(filters.dateFrom) : new Date(0),
      to: filters.dateTo ? endOfDay(filters.dateTo) : endOfDay(new Date()),
    }
  }
  if (filters.datePreset) {
    return resolveDateRange(filters.datePreset)
  }
  return null
}

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

export function datePresetLabel(preset: DatePreset, field: DateField): string {
  const fieldLabel = field === "created" ? "Created" : "Updated"
  const labels: Record<DatePreset, string> = {
    last_week: "last week",
    last_month: "last month",
    this_month: "this month",
    this_year: "this year",
  }
  return `${fieldLabel} ${labels[preset]}`
}
