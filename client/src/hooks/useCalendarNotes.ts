import { useMemo } from "react"
import type { NoteWithTags } from "./useNotes"
import { useNotes } from "./useNotes"
import {
  extractTopKeywords,
  getScopeRange,
  toDateKey,
  type CalendarScope,
} from "../lib/calendarUtils"

export type DayActivity = {
  created: number
  updated: number
  notes: NoteWithTags[]
}

export function useCalendarNotes(scope: CalendarScope, anchor: Date, selectedDay: Date | null) {
  const { data: notes = [], isLoading } = useNotes()
  const { from, to } = getScopeRange(scope, anchor)

  const notesInScope = useMemo(
    () =>
      notes.filter((note) => {
        const created = new Date(note.createdAt).getTime()
        const updated = new Date(note.updatedAt).getTime()
        const start = from.getTime()
        const end = to.getTime()
        return (created >= start && created <= end) || (updated >= start && updated <= end)
      }),
    [notes, from, to],
  )

  const activityByDay = useMemo(() => {
    const map = new Map<string, DayActivity>()

    const ensure = (key: string): DayActivity => {
      const existing = map.get(key)
      if (existing) return existing
      const entry: DayActivity = { created: 0, updated: 0, notes: [] }
      map.set(key, entry)
      return entry
    }

    for (const note of notesInScope) {
      const createdKey = toDateKey(new Date(note.createdAt))
      const updatedKey = toDateKey(new Date(note.updatedAt))

      const createdEntry = ensure(createdKey)
      createdEntry.created += 1
      if (!createdEntry.notes.some((item) => item.id === note.id)) {
        createdEntry.notes.push(note)
      }

      if (createdKey !== updatedKey) {
        const updatedEntry = ensure(updatedKey)
        updatedEntry.updated += 1
        if (!updatedEntry.notes.some((item) => item.id === note.id)) {
          updatedEntry.notes.push(note)
        }
      }
    }

    return map
  }, [notesInScope])

  const selectedDayNotes = useMemo(() => {
    if (!selectedDay) return notesInScope
    const key = toDateKey(selectedDay)
    return activityByDay.get(key)?.notes ?? []
  }, [activityByDay, notesInScope, selectedDay])

  const topTags = useMemo(() => {
    const counts = new Map<string, { name: string; color: string; count: number }>()
    for (const note of selectedDayNotes) {
      for (const tag of note.tags) {
        const existing = counts.get(tag.id)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(tag.id, { name: tag.name, color: tag.color, count: 1 })
        }
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  }, [selectedDayNotes])

  const topKeywords = useMemo(() => {
    const texts = selectedDayNotes.flatMap((note) => [note.title, note.content])
    return extractTopKeywords(texts)
  }, [selectedDayNotes])

  return {
    isLoading,
    notesInScope,
    activityByDay,
    selectedDayNotes,
    topTags,
    topKeywords,
    range: { from, to },
  }
}
