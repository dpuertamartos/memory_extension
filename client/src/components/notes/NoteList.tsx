import { NotePencilIcon, PlusIcon } from "@phosphor-icons/react"
import { useMemo } from "react"
import { useCreateNote, useNotes } from "../../hooks/useNotes"
import { useGlobalSearch } from "../../hooks/useSearch"
import { formatRelativeTime } from "../../lib/formatRelativeTime"
import { stripMarkdown } from "../../lib/stripMarkdown"
import { useAppStore } from "../../store/useAppStore"

const highlightClass =
  "[&_mark]:rounded-sm [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-gray-900 dark:[&_mark]:bg-yellow-500/30 dark:[&_mark]:text-yellow-100"

const NoteList = () => {
  const { selectedTagId, selectedNoteId, searchQuery, noteSort, setSelectedNoteId, setNoteSort } =
    useAppStore()
  const { data: notes = [], isLoading } = useNotes(selectedTagId ?? undefined)
  const { data: searchResults = [] } = useGlobalSearch(searchQuery)
  const createNote = useCreateNote()
  const createError = createNote.error instanceof Error ? createNote.error.message : null

  const isSearching = searchQuery.trim().length > 0
  const filteredNotes = isSearching
    ? notes.filter((note) => searchResults.some((result) => result.note_id === note.id))
    : notes

  const visibleNotes = useMemo(() => {
    const sorted = [...filteredNotes]
    switch (noteSort) {
      case "created":
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      case "alpha":
        return sorted.sort((a, b) =>
          (a.title || "Untitled").localeCompare(b.title || "Untitled", undefined, {
            sensitivity: "base",
          }),
        )
      default:
        return sorted.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
    }
  }, [filteredNotes, noteSort])

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
          className="btn-blue flex items-center gap-1 !px-2 !py-1"
          disabled={createNote.isPending}
        >
          <PlusIcon size={14} />
          New
        </button>
      </div>

      {!isSearching && (
        <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
          <select
            value={noteSort}
            onChange={(event) => setNoteSort(event.target.value as typeof noteSort)}
            className="w-full rounded border-0 bg-transparent py-1 text-xs text-gray-500 shadow-none focus:ring-0"
            aria-label="Sort notes"
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      )}

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
          const titleHasHighlight = Boolean(searchHit?.title_snippet?.includes("<mark>"))

          return (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors duration-150 dark:border-gray-700 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {searchHit && titleHasHighlight ? (
                  <p
                    className={`truncate font-medium ${highlightClass}`}
                    dangerouslySetInnerHTML={{
                      __html: searchHit.title_snippet,
                    }}
                  />
                ) : (
                  <p className="truncate font-medium">{note.title || "Untitled"}</p>
                )}
                <span
                  className="shrink-0 text-xs text-gray-400"
                  title={new Date(note.updatedAt).toLocaleString()}
                >
                  {formatRelativeTime(note.updatedAt)}
                </span>
              </div>

              {searchHit ? (
                <p
                  className={`mt-1 line-clamp-2 text-xs text-gray-500 ${highlightClass}`}
                  dangerouslySetInnerHTML={{
                    __html: searchHit.content_snippet || searchHit.title_snippet,
                  }}
                />
              ) : (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {stripMarkdown(note.content) || "Empty note"}
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
