import { TrashIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
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
  const { updateNote } = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagQuery, setTagQuery] = useState("")
  const [tagAnchor, setTagAnchor] = useState<{ top: number; left: number } | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
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

  useEffect(() => {
    const textarea = contentRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [content, selectedNoteId])

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

    const hashIndex = value.lastIndexOf("#")
    if (hashIndex === -1) {
      setTagAnchor(null)
      setTagQuery("")
      return
    }

    const afterHash = value.slice(hashIndex + 1)
    if (afterHash.includes(" ") || afterHash.includes("\n")) {
      setTagAnchor(null)
      setTagQuery("")
      return
    }

    const textarea = contentRef.current
    if (!textarea) return

    setTagQuery(afterHash)
    setTagAnchor({ top: textarea.offsetTop + 28, left: textarea.offsetLeft + 16 })
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
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="ml-2 rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Delete note"
        >
          <TrashIcon size={18} />
        </button>
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
        <textarea
          ref={contentRef}
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder="Write in Markdown… Type # to add tags"
          className="min-h-[60vh] w-full resize-none border-0 bg-transparent font-mono text-sm leading-relaxed shadow-none focus:ring-0"
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
