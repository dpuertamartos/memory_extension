import { DeviceMobileIcon, DownloadSimpleIcon, HardDrivesIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { usePwaInstall } from "../hooks/usePwaInstall"
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n"
import JSZip from "jszip"
import { eq } from "drizzle-orm"
import { noteTagsTable, notesTable, tagsTable } from "../db/schema"
import { db, exportDatabaseFile, importDatabaseFile, initDb } from "../lib/db"
import { useLocaleStore } from "../store/useLocaleStore"

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const SettingsPage = () => {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocaleStore()
  const { canInstall, isInstalled, showIosHint, promptInstall } = usePwaInstall()

  const handleSqliteExport = async () => {
    const blob = await exportDatabaseFile()
    downloadBlob(blob, "local-brain.sqlite")
  }

  const handleMarkdownExport = async () => {
    await initDb()

    const notes = await db.select().from(notesTable).where(eq(notesTable.isDeleted, false))
    const zip = new JSZip()
    const untitled = t("common.untitled")

    for (const note of notes) {
      const tagRows = await db
        .select({ name: tagsTable.name })
        .from(noteTagsTable)
        .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
        .where(eq(noteTagsTable.noteId, note.id))

      const tagNames = tagRows.map((row) => row.name)
      const frontmatter = [
        "---",
        `title: ${JSON.stringify(note.title || untitled)}`,
        `id: ${note.id}`,
        `created_at: ${note.createdAt.toISOString()}`,
        `updated_at: ${note.updatedAt.toISOString()}`,
        `tags: [${tagNames.map((name) => JSON.stringify(name)).join(", ")}]`,
        "---",
        "",
      ].join("\n")

      const filename = `${note.title || "untitled"}-${note.id.slice(0, 8)}.md`
        .replace(/[^\w.-]+/g, "-")
        .toLowerCase()

      zip.file(filename, `${frontmatter}${note.content}`)
    }

    const blob = await zip.generateAsync({ type: "blob" })
    downloadBlob(blob, "local-brain-notes.zip")
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(t("settings.importConfirm"))
    if (!confirmed) return

    await importDatabaseFile(file)
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1>{t("settings.title")}</h1>
      <p className="mb-6 text-sm text-ink-muted">{t("settings.description")}</p>

      <div className="space-y-4">
        <div className="rounded-lg border border-synapse/30 bg-synapse-soft p-4 dark:border-synapse/40 dark:bg-synapse/10">
          <div className="mb-2 flex items-center gap-2">
            <HardDrivesIcon size={20} className="text-synapse dark:text-synapse-soft" />
            <h2 className="text-sm font-semibold text-synapse dark:text-synapse-soft">
              {t("settings.privacyTitle")}
            </h2>
          </div>
          <p className="text-sm text-ink-muted dark:text-charcoal-muted">{t("settings.privacyBody")}</p>
        </div>

        <div className="surface-inset p-4">
          <label htmlFor="locale-select" className="mb-1 block text-sm font-medium">
            {t("settings.language")}
          </label>
          <p className="mb-3 text-xs text-ink-subtle">{t("settings.languageDescription")}</p>
          <select
            id="locale-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            className="w-full rounded-md border border-border bg-paper-elevated px-3 py-2 text-sm dark:border-charcoal-border dark:bg-charcoal"
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        {isInstalled ? (
          <p className="rounded-lg border border-synapse/30 bg-synapse-soft px-4 py-3 text-sm text-synapse dark:border-synapse/40 dark:bg-synapse/10 dark:text-synapse-soft">
            {t("settings.installed")}
          </p>
        ) : canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <DeviceMobileIcon size={18} />
            {t("settings.installApp")}
          </button>
        ) : showIosHint ? (
          <div className="surface-inset px-4 py-3 text-sm text-ink-muted">
            <p className="mb-1 font-medium text-ink dark:text-stone-200">{t("settings.iosTitle")}</p>
            <p>{t("settings.iosHint")}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSqliteExport()}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportSqlite")}
        </button>

        <button
          type="button"
          onClick={() => void handleMarkdownExport()}
          className="btn-secondary flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportMarkdown")}
        </button>

        <label className="btn-muted flex w-full cursor-pointer items-center justify-center gap-2">
          <UploadSimpleIcon size={18} />
          {t("settings.importSqlite")}
          <input
            type="file"
            accept=".sqlite,.db,application/x-sqlite3"
            className="hidden"
            onChange={(event) => void handleImport(event)}
          />
        </label>
      </div>
    </div>
  )
}

export default SettingsPage
