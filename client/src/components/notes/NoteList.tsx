import { NotePencilIcon, PlusIcon } from "@phosphor-icons/react"
import { useCreateNote, useNotes } from "../../hooks/useNotes"
import { useGlobalSearch } from "../../hooks/useSearch"
import { useAppStore } from "../../store/useAppStore"

const formatDate = (date: Date | number | string | null | undefined) => {
  const value = date instanceof Date ? date : new Date(date ?? 0)
  if (Number.isNaN(value.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(value)
}

const NoteList = () => {
  const { selectedTagId, selectedNoteId, searchQuery, setSelectedNoteId } = useAppStore()
  const { data: notes = [], isLoading } = useNotes(selectedTagId ?? undefined)
  const { data: searchResults = [] } = useGlobalSearch(searchQuery)
  const createNote = useCreateNote()
  const createError = createNote.error instanceof Error ? createNote.error.message : null

  const isSearching = searchQuery.trim().length > 0
  const visibleNotes = isSearching
    ? notes.filter((note) => searchResults.some((result) => result.note_id === note.id))
    : notes

  const handleCreate = async () => {
    try {
      const note = await createNote.mutateAsync({})
      setSelectedNoteId(note.id)
    } catch {
      // Error surfaced via createNote.error
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {isSearching ? "Results" : "Notes"}
        </h2>
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="btn-blue flex items-center gap-1 !py-1 !px-2"
          disabled={createNote.isPending}
        >
          <PlusIcon size={14} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {createError && (
          <p className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {createError}
          </p>
        )}

        {isLoading && <p className="p-4 text-sm text-gray-500">Loading notes…</p>}

        {!isLoading && visibleNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-gray-500">
            <NotePencilIcon size={32} />
            <p className="text-sm">{isSearching ? "No matching notes" : "No notes yet"}</p>
          </div>
        )}

        {visibleNotes.map((note) => {
          const searchHit = searchResults.find((result) => result.note_id === note.id)
          const isActive = note.id === selectedNoteId

          return (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors dark:border-gray-700 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-medium">{note.title || "Untitled"}</p>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatDate(note.updatedAt)}
                </span>
              </div>

              {searchHit ? (
                <p
                  className="mt-1 line-clamp-2 text-xs text-gray-500 [&_mark]:bg-yellow-200 [&_mark]:text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: searchHit.content_snippet || searchHit.title_snippet,
                  }}
                />
              ) : (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {note.content || "Empty note"}
                </p>
              )}

              {(note.tags ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(note.tags ?? []).map((tag) => (
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
          )
        })}
      </div>
    </div>
  )
}

export default NoteList
