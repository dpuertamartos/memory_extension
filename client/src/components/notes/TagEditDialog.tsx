import { TrashIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Tag } from "../../db/schema"
import { useDeleteTag, useUpdateTag } from "../../hooks/useTags"
import { TAG_COLORS } from "../../lib/tagColors"

type TagEditDialogProps = {
  tag: Tag
  onClose: () => void
  onDeleted: () => void
}

const TagEditDialog = ({ tag, onClose, onDeleted }: TagEditDialogProps) => {
  const { t } = useTranslation()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setName(tag.name)
    setColor(tag.color)
    setConfirmDelete(false)
  }, [tag])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    await updateTag.mutateAsync({
      id: tag.id,
      name: trimmed,
      color,
    })
    onClose()
  }

  const handleDelete = async () => {
    await deleteTag.mutateAsync(tag.id)
    onDeleted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-paper-elevated shadow-panel dark:border-charcoal-border dark:bg-charcoal-elevated"
        role="dialog"
        aria-labelledby="tag-edit-title"
      >
        <div className="surface-header flex items-center justify-between px-4 py-3">
          <h3 id="tag-edit-title" className="text-sm font-semibold">
            {t("tags.editTag")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn !p-1"
            aria-label={t("common.close")}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="tag-name" className="mb-1 block text-xs font-medium text-ink-subtle">
              {t("common.name")}
            </label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full text-sm"
              autoFocus
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-ink-subtle">{t("common.color")}</p>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={t("tags.colorOption", { color: option })}
                  onClick={() => setColor(option)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    color === option ? "border-accent dark:border-accent-muted" : "border-transparent"
                  }`}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          {confirmDelete ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-700 dark:text-red-300">
                {t("tags.deleteTagConfirm", { name: tag.name })}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteTag.isPending}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                >
                  {t("common.delete")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="btn-secondary !px-3 !py-1"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <TrashIcon size={14} />
              {t("tags.deleteTag")}
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3 dark:border-charcoal-border">
          <button type="button" onClick={onClose} className="btn-secondary !px-3 !py-1">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateTag.isPending || !name.trim()}
            className="btn-primary !px-3 !py-1"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagEditDialog
