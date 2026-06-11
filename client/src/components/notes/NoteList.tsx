import { NotePencilIcon, PlusIcon } from "@phosphor-icons/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import FilterBanner from "./FilterBanner"
import { useCreateNote, useNotes } from "../../hooks/useNotes"
import { isSearchActive, useGlobalSearch } from "../../hooks/useSearch"
import { formatRelativeTime } from "../../lib/formatRelativeTime"
import { stripMarkdown } from "../../lib/stripMarkdown"
import { useAppStore } from "../../store/useAppStore"

const highlightClass =
  "[&_mark]:rounded-sm [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-gray-900 dark:[&_mark]:bg-yellow-500/30 dark:[&_mark]:text-yellow-100"

const NoteList = () => {
  const { t, i18n } = useTranslation()
  const {
    selectedTagId,
    selectedNoteId,
    newlyCreatedNoteId,
    searchFilters,
    noteSort,
    setSelectedNoteId,
    setNewlyCreatedNoteId,
    setNoteSort,
  } = useAppStore()
  const { data: notes = [], isLoading } = useNotes(selectedTagId ?? undefined)
  const { data: searchResults = [] } = useGlobalSearch(searchFilters)
  const createNote = useCreateNote()
  const createError = createNote.error instanceof Error ? createNote.error.message : null
  const untitled = t("common.untitled")

  const isSearching = isSearchActive(searchFilters)
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
          (a.title || untitled).localeCompare(b.title || untitled, i18n.language, {
            sensitivity: "base",
          }),
        )
      default:
        return sorted.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
    }
  }, [filteredNotes, noteSort, untitled, i18n.language])

  const handleCreate = async () => {
    try {
      const note = await createNote.mutateAsync({})
      setNewlyCreatedNoteId(note.id)
      setSelectedNoteId(note.id)
    } catch {
      // Error surfaced via createNote.error
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {isSearching ? t("notes.results") : selectedTagId ? t("notes.filtered") : t("notes.title")}
        </h2>
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="btn-blue flex items-center gap-1.5 !px-3 !py-2"
          disabled={createNote.isPending}
        >
          <PlusIcon size={16} />
          {t("notes.newNote")}
        </button>
      </div>

      <FilterBanner noteCount={visibleNotes.length} />

      {!isSearching && (
        <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
          <select
            value={noteSort}
            onChange={(event) => setNoteSort(event.target.value as typeof noteSort)}
            className="w-full rounded border-0 bg-transparent py-1 text-xs text-gray-500 shadow-none focus:ring-0"
            aria-label={t("notes.sortNotes")}
          >
            <option value="updated">{t("notes.sortUpdated")}</option>
            <option value="created">{t("notes.sortCreated")}</option>
            <option value="alpha">{t("notes.sortAlpha")}</option>
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {createError && (
          <p className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {createError}
          </p>
        )}

        {isLoading && <p className="p-4 text-sm text-gray-500">{t("notes.loadingNotes")}</p>}

        {!isLoading && visibleNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-gray-500">
            <NotePencilIcon size={32} />
            <p className="text-sm">
              {isSearching ? t("notes.noMatchingNotes") : t("notes.noNotesYet")}
            </p>
          </div>
        )}

        {visibleNotes.map((note) => {
          const searchHit = searchResults.find((result) => result.note_id === note.id)
          const isActive = note.id === selectedNoteId
          const isNew = note.id === newlyCreatedNoteId
          const titleHasHighlight = Boolean(searchHit?.title_snippet?.includes("<mark>"))

          return (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full border-b border-gray-100 px-4 py-3.5 text-left transition-colors duration-150 dark:border-gray-700 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : isNew
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20"
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
                  <p className="truncate font-medium">
                    {note.title || untitled}
                    {isNew && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {t("common.new")}
                      </span>
                    )}
                  </p>
                )}
                <span
                  className="shrink-0 text-xs text-gray-400"
                  title={new Date(note.updatedAt).toLocaleString(i18n.language)}
                >
                  {formatRelativeTime(note.updatedAt, i18n.language)}
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
                  {stripMarkdown(note.content) || t("notes.emptyNote")}
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
