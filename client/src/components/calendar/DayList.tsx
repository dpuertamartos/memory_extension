import { useTranslation } from "react-i18next"
import type { NoteWithTags } from "../../hooks/useNotes"
import { formatRelativeTime } from "../../lib/formatRelativeTime"
import TagChip from "../notes/TagChip"

type DayListProps = {
  notes: NoteWithTags[]
  locale: string
  onOpenNote: (noteId: string) => void
}

const DayList = ({ notes, locale, onOpenNote }: DayListProps) => {
  const { t } = useTranslation()
  const untitled = t("common.untitled")

  return (
    <div className="space-y-2">
      {notes.length === 0 && (
        <p className="text-sm text-ink-subtle">{t("calendar.noNoteActivity")}</p>
      )}
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onOpenNote(note.id)}
          className="surface-inset w-full p-3 text-left transition-colors hover:bg-accent-soft/40 dark:hover:bg-charcoal"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{note.title || untitled}</p>
            <span className="shrink-0 text-xs text-ink-subtle">
              {formatRelativeTime(note.updatedAt, locale)}
            </span>
          </div>
          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} size="xs" />
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

export default DayList
