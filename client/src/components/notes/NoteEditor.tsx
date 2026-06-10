import { TrashIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import MarkdownEditor from "./MarkdownEditor"
import TagSelector from "./TagSelector"
import { useDeleteNote, useNote, useUpdateNote } from "../../hooks/useNotes"
import { useAppStore } from "../../store/useAppStore"

const stripTagTrigger = (text: string, query: string) => {
  const hashIndex = text.lastIndexOf("#")
  if (hashIndex === -1) return text

  const typed = text.slice(hashIndex + 1)
  if (!typed.startsWith(query)) return text

  return text.slice(0, hashIndex) + text.slice(hashIndex + 1 + query.length)
}

const NoteEditor = () => {
  const { selectedNoteId, setSelectedNoteId } = useAppStore()
  const { data: note } = useNote(selectedNoteId)
  const { updateNote, saveStatus } = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagQuery, setTagQuery] = useState("")
  const [tagAnchor, setTagAnchor] = useState<{ top: number; left: number } | null>(null)
  const hydratedNoteIdRef = useRef<string | null>(null)

  // Hydrate local editor state only when the user switches notes — not on every
  // query refetch after a debounced save (which caused text rollback while typing).
  useEffect(() => {
    if (!selectedNoteId) {
      hydratedNoteIdRef.current = null
      setTitle("")
      setContent("")
      setTagQuery("")
      setTagAnchor(null)
      return
    }

    if (!note || note.id !== selectedNoteId) return
    if (hydratedNoteIdRef.current === selectedNoteId) return

    hydratedNoteIdRef.current = selectedNoteId
    setTitle(note.title)
    setContent(note.content)
    setTagQuery("")
    setTagAnchor(null)
  }, [note, selectedNoteId])

  if (!selectedNoteId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Select a note or create a new one
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading note…
      </div>
    )
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    updateNote(note.id, { content: value })
  }

  const handleDelete = async () => {
    await deleteNote.mutateAsync(note.id)
    setSelectedNoteId(null)
  }

  const handleTagApplied = () => {
    if (!tagQuery) return

    const stripped = stripTagTrigger(content, tagQuery)
    if (stripped !== content) {
      setContent(stripped)
      updateNote(note.id, { content: stripped })
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            updateNote(note.id, { title: event.target.value })
          }}
          placeholder="Note title"
          className="w-full border-0 bg-transparent text-lg font-semibold shadow-none focus:ring-0"
        />
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <span
            className={`text-xs text-gray-400 transition-opacity duration-300 ${
              saveStatus === "saving" ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            Saving…
          </span>
          <span
            className={`text-xs text-green-600 transition-opacity duration-300 dark:text-green-400 ${
              saveStatus === "saved" ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            Saved locally
          </span>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete note"
          >
            <TrashIcon size={18} />
          </button>
        </div>
      </div>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-gray-100 px-4 py-2 dark:border-gray-700">
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto p-4">
        <MarkdownEditor
          noteId={note.id}
          content={content}
          onChange={handleContentChange}
          onTagTrigger={(query, anchor) => {
            setTagQuery(query)
            setTagAnchor(anchor)
          }}
          onTagDismiss={() => {
            setTagAnchor(null)
            setTagQuery("")
          }}
        />

        {tagAnchor && (
          <TagSelector
            noteId={note.id}
            selectedTags={note.tags}
            anchor={tagAnchor}
            query={tagQuery}
            onTagApplied={handleTagApplied}
            onClose={() => {
              setTagAnchor(null)
              setTagQuery("")
            }}
          />
        )}
      </div>
    </div>
  )
}

export default NoteEditor
