import { TrashIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Division } from "../../db/schema"
import { useDeleteDivision, useFocusDivision, useUpdateDivision } from "../../hooks/useDivisions"
import { ROOT_DIVISION_ID, useAppStore } from "../../store/useAppStore"

type DivisionEditDialogProps = {
  division: Division
  onClose: () => void
}

const DivisionEditDialog = ({ division, onClose }: DivisionEditDialogProps) => {
  const { t } = useTranslation()
  const updateDivision = useUpdateDivision()
  const deleteDivision = useDeleteDivision()
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const { focusDivision } = useFocusDivision()
  const [name, setName] = useState(division.name)
  const [description, setDescription] = useState(division.description)
  const [isActive, setIsActive] = useState(division.isActive)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRoot = division.id === ROOT_DIVISION_ID

  useEffect(() => {
    setName(division.name)
    setDescription(division.description)
    setIsActive(division.isActive)
    setConfirmDelete(false)
    setError(null)
  }, [division])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    await updateDivision.mutateAsync({
      id: division.id,
      name: isRoot ? undefined : trimmed,
      description: description.trim(),
      isActive: isRoot ? true : isActive,
    })
    onClose()
  }

  const handleDelete = async () => {
    setError(null)
    try {
      await deleteDivision.mutateAsync(division.id)
      if (focusDivisionId === division.id) {
        focusDivision(division.parentId ?? ROOT_DIVISION_ID)
      }
      onClose()
    } catch (err) {
      const code = err instanceof Error ? err.message : ""
      if (code === "DIVISION_HAS_CHILDREN") {
        setError(t("divisions.deleteBlockedChildren"))
      } else if (code === "DIVISION_HAS_NOTES") {
        setError(t("divisions.deleteBlockedNotes"))
      } else if (code === "DIVISION_HAS_TAGS") {
        setError(t("divisions.deleteBlockedTags"))
      } else {
        setError(t("divisions.deleteFailed"))
      }
      setConfirmDelete(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-paper-elevated shadow-panel dark:border-charcoal-border dark:bg-charcoal-elevated"
        role="dialog"
        aria-labelledby="division-edit-title"
      >
        <div className="surface-header flex items-center justify-between px-4 py-3">
          <h3 id="division-edit-title" className="text-sm font-semibold">
            {t("divisions.editDivision")}
          </h3>
          <button type="button" onClick={onClose} className="icon-btn !p-1" aria-label={t("common.close")}>
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="division-name" className="mb-1 block text-xs font-medium text-ink-subtle">
              {t("common.name")}
            </label>
            <input
              id="division-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm"
              disabled={isRoot}
              autoFocus={!isRoot}
            />
            {isRoot && (
              <p className="mt-1 text-xs text-ink-subtle">{t("divisions.rootNameLocked")}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="division-description"
              className="mb-1 block text-xs font-medium text-ink-subtle"
            >
              {t("divisions.description")}
            </label>
            <textarea
              id="division-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm"
              rows={2}
            />
          </div>

          {!isRoot && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {t("divisions.activeLabel")}
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!isRoot &&
            (confirmDelete ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t("divisions.deleteConfirm", { name: division.name })}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleteDivision.isPending}
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
                {t("divisions.deleteDivision")}
              </button>
            ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3 dark:border-charcoal-border">
          <button type="button" onClick={onClose} className="btn-secondary !px-3 !py-1">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateDivision.isPending || (!isRoot && !name.trim())}
            className="btn-primary !px-3 !py-1"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DivisionEditDialog
