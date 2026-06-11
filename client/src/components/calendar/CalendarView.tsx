import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import {
  formatScopeLabel,
  getMonthGridDays,
  getWeekDays,
  isSameDay,
  shiftAnchor,
  toDateKey,
  type CalendarScope,
} from "../../lib/calendarUtils"
import { formatRelativeTime } from "../../lib/formatRelativeTime"
import { useCalendarNotes } from "../../hooks/useCalendarNotes"
import { useAppStore } from "../../store/useAppStore"

const SCOPES: { id: CalendarScope; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
]

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const CalendarView = () => {
  const { setSelectedNoteId, setMainView } = useAppStore()

  const openNote = (noteId: string) => {
    setMainView("notes")
    setSelectedNoteId(noteId)
  }
  const [scope, setScope] = useState<CalendarScope>("month")
  const [anchor, setAnchor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date())

  useEffect(() => {
    if (scope === "day") {
      setSelectedDay(anchor)
    }
  }, [scope, anchor])

  const { isLoading, activityByDay, selectedDayNotes, topTags, topKeywords } = useCalendarNotes(
    scope,
    anchor,
    selectedDay,
  )

  const handlePrev = () => setAnchor((current) => shiftAnchor(scope, current, -1))
  const handleNext = () => setAnchor((current) => shiftAnchor(scope, current, 1))
  const handleToday = () => {
    const today = new Date()
    setAnchor(today)
    setSelectedDay(today)
  }

  const renderActivityDots = (day: Date) => {
    const activity = activityByDay.get(toDateKey(day))
    if (!activity) return null

    return (
      <div className="mt-0.5 flex justify-center gap-0.5">
        {activity.created > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Created" />
        )}
        {activity.updated > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Updated" />
        )}
      </div>
    )
  }

  const renderMonthGrid = () => {
    const days = getMonthGridDays(anchor)
    const month = anchor.getMonth()

    return (
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-xs font-medium text-gray-500">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = day.getMonth() === month
          const selected = selectedDay && isSameDay(day, selectedDay)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex min-h-[3.25rem] flex-col items-center rounded-lg p-1 text-sm transition-colors ${
                selected
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                  : inMonth
                    ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                    : "text-gray-400 dark:text-gray-600"
              } ${isToday ? "ring-1 ring-blue-400" : ""}`}
            >
              <span>{day.getDate()}</span>
              {renderActivityDots(day)}
            </button>
          )
        })}
      </div>
    )
  }

  const renderWeekGrid = () => {
    const days = getWeekDays(anchor)

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const selected = selectedDay && isSameDay(day, selectedDay)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              } ${isToday ? "ring-1 ring-blue-400" : ""}`}
            >
              <p className="text-xs text-gray-500">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className="text-lg font-semibold">{day.getDate()}</p>
              {renderActivityDots(day)}
            </button>
          )
        })}
      </div>
    )
  }

  const renderYearGrid = () => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {MONTH_LABELS.map((label, index) => {
        const monthDate = new Date(anchor.getFullYear(), index, 1)
        const monthActivity = [...activityByDay.entries()].filter(([key]) => {
          const [year, month] = key.split("-").map(Number)
          return year === anchor.getFullYear() && month === index + 1
        })
        const noteCount = monthActivity.reduce((sum, [, activity]) => sum + activity.notes.length, 0)

        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              setScope("month")
              setAnchor(monthDate)
              setSelectedDay(monthDate)
            }}
            className="rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <p className="font-medium">{label}</p>
            <p className="mt-1 text-xs text-gray-500">
              {noteCount === 0 ? "No activity" : `${noteCount} note${noteCount === 1 ? "" : "s"}`}
            </p>
          </button>
        )
      })}
    </div>
  )

  const renderDayList = () => (
    <div className="space-y-2">
      {selectedDayNotes.length === 0 && (
        <p className="text-sm text-gray-500">No note activity for this period.</p>
      )}
      {selectedDayNotes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => openNote(note.id)}
          className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{note.title || "Untitled"}</p>
            <span className="shrink-0 text-xs text-gray-400">
              {formatRelativeTime(note.updatedAt)}
            </span>
          </div>
          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-[10px] text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {SCOPES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                scope === id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Previous period"
          >
            <CaretLeftIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="min-w-[10rem] text-sm font-medium"
          >
            {formatScopeLabel(scope, anchor)}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Next period"
          >
            <CaretRightIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          {isLoading && <p className="text-sm text-gray-500">Loading calendar…</p>}
          {!isLoading && scope === "month" && renderMonthGrid()}
          {!isLoading && scope === "week" && renderWeekGrid()}
          {!isLoading && scope === "year" && renderYearGrid()}
          {!isLoading && scope === "day" && renderDayList()}
        </div>

        {scope !== "day" && (
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">
                {selectedDay
                  ? selectedDay.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "Selected period"}
              </h3>
              {renderDayList()}
            </div>

            {topTags.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-500">Top tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      #{tag.name} ({tag.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topKeywords.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-500">Top keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {topKeywords.map(({ word, count }) => (
                    <span
                      key={word}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {word} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

export default CalendarView
