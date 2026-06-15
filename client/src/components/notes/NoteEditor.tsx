import { ArrowLeftIcon, NotePencilIcon, TrashIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import MarkdownEditor, { type MarkdownEditorHandle } from "./MarkdownEditor"
import TagChip from "./TagChip"
import TagEditDialog from "./TagEditDialog"
import TagSelector from "./TagSelector"
import type { Tag } from "../../db/schema"
import DivisionPicker from "./DivisionPicker"
import { useDeleteNote, useMoveNoteDivision, useNote, useSetNoteTags, useUpdateNote } from "../../hooks/useNotes"
import { useAllDivisions } from "../../hooks/useDivisions"
import { getDivisionAncestors } from "../../lib/divisionTree"
import { useAppStore } from "../../store/useAppStore"

const NoteEditor = () => {
  const { t } = useTranslation()
  const {
    selectedNoteId,
    setSelectedNoteId,
    newlyCreatedNoteId,
    setNewlyCreatedNoteId,
    subBrainsEnabled,
    selectedTagId,
    setSelectedTagId,
  } = useAppStore()
  const { data: note } = useNote(selectedNoteId)
  const { data: allDivisions = [] } = useAllDivisions()
  const { updateNote, saveStatus } = useUpdateNote()
  const deleteNote = useDeleteNote()
  const setNoteTags = useSetNoteTags()
  const moveNoteDivision = useMoveNoteDivision()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagQuery, setTagQuery] = useState("")
  const [tagAnchor, setTagAnchor] = useState<{ top: number; left: number } | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const hydratedNoteIdRef = useRef<string | null>(null)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const isNewNote = selectedNoteId !== null && selectedNoteId === newlyCreatedNoteId
  const untitled = t("common.untitled")

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
    if (!isNewNote || !note) return
    const timer = setTimeout(() => {
      titleRef.current?.focus()
      titleRef.current?.select()
    }, 100)
    return () => clearTimeout(timer)
  }, [isNewNote, note])

  if (!selectedNoteId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="rounded-full bg-accent-soft p-5 dark:bg-accent/15">
          <NotePencilIcon size={32} className="text-accent dark:text-accent-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink dark:text-stone-200">{t("notes.selectOrCreate")}</p>
          <p className="mt-1 text-xs text-ink-subtle">{t("notes.selectOrCreateHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedNoteId(null)}
          className="btn-primary !px-4 !py-2 md:hidden"
        >
          {t("notes.browseNotes")}
        </button>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-subtle">
        {t("notes.loadingNote")}
      </div>
    )
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    updateNote(note.id, { content: value })
    if (isNewNote && value.trim()) setNewlyCreatedNoteId(null)
  }

  const handleDelete = async () => {
    await deleteNote.mutateAsync(note.id)
    setNewlyCreatedNoteId(null)
    setSelectedNoteId(null)
  }

  const handleTagApplied = () => {
    editorRef.current?.removeTagTrigger()
  }

  const handleRemoveTag = (tagId: string) => {
    void setNoteTags.mutateAsync({
      noteId: note.id,
      tagIds: note.tags.filter((tag) => tag.id !== tagId).map((tag) => tag.id),
    })
  }

  const handleBack = () => {
    setSelectedNoteId(null)
  }

  const handleMoveDivision = async (targetDivisionId: string) => {
    if (!note || targetDivisionId === note.divisionId) return

    const target = allDivisions.find((d) => d.id === targetDivisionId)
    const targetPath = getDivisionAncestors(allDivisions, targetDivisionId)
      .map((d) => d.name)
      .join(" › ")
    const isInactive = target && !target.isActive

    if (isInactive) {
      const confirmed = window.confirm(
        t("divisions.moveWarningBody", {
          path: targetPath,
          warnings: t("divisions.moveWarningInactive"),
        }),
      )
      if (!confirmed) return
    }

    await moveNoteDivision.mutateAsync({
      noteId: note.id,
      targetDivisionId,
    })
  }

  return (
    <div className="relative flex h-full flex-col">
      {isNewNote && (
        <div className="flex items-center gap-2 border-b border-synapse/30 bg-synapse-soft px-4 py-2 text-sm text-synapse dark:border-synapse/40 dark:bg-synapse/10 dark:text-synapse-soft">
          <NotePencilIcon size={16} weight="duotone" className="shrink-0" aria-hidden />
          <span className="font-medium">{t("notes.newNoteCreated")}</span>
          <span className="opacity-80">{t("notes.addTitleBelow")}</span>
        </div>
      )}

      <div className="surface-header flex items-center gap-2 px-3 py-2 md:px-4 md:py-3">
        <button
          type="button"
          onClick={handleBack}
          className="icon-btn shrink-0 md:hidden"
          aria-label={t("notes.backToNotes")}
        >
          <ArrowLeftIcon size={20} />
        </button>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            updateNote(note.id, { title: event.target.value })
            if (isNewNote && event.target.value.trim() && event.target.value !== untitled) {
              setNewlyCreatedNoteId(null)
            }
          }}
          placeholder={t("notes.noteTitle")}
          className="min-w-0 flex-1 border-0 bg-transparent font-display text-base font-semibold shadow-none focus:ring-0 md:text-lg"
        />

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <span
            className={`hidden text-xs text-ink-subtle transition-opacity duration-300 sm:inline ${
              saveStatus === "saving" ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {t("notes.saving")}
          </span>
          <span
            className={`hidden text-xs text-synapse transition-opacity duration-300 dark:text-synapse-soft sm:inline ${
              saveStatus === "saved" ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {t("notes.saved")}
          </span>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label={t("notes.deleteNote")}
          >
            <TrashIcon size={18} />
          </button>
        </div>
      </div>

      {subBrainsEnabled && (
        <div className="border-b border-border px-3 py-1.5 md:px-4 dark:border-charcoal-border">
          <DivisionPicker
            compact
            value={note.divisionId}
            onChange={(id) => void handleMoveDivision(id)}
            disabled={moveNoteDivision.isPending}
            className="max-w-xs"
          />
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-border px-4 py-2 dark:border-charcoal-border">
          {note.tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onEdit={() => setEditingTag(tag)}
              editLabel={t("tags.editTagNamed", { name: tag.name })}
              onRemove={() => handleRemoveTag(tag.id)}
              removeLabel={t("notes.removeTagFromNote", { name: tag.name })}
            />
          ))}
        </div>
      )}

      {editingTag && (
        <TagEditDialog
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onDeleted={() => {
            if (selectedTagId === editingTag.id) setSelectedTagId(null)
          }}
        />
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        <MarkdownEditor
          ref={editorRef}
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
