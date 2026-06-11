import { DeviceMobileIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react"
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
      <p className="mb-6 text-sm text-gray-500">{t("settings.description")}</p>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <label htmlFor="locale-select" className="mb-1 block text-sm font-medium">
            {t("settings.language")}
          </label>
          <p className="mb-3 text-xs text-gray-500">{t("settings.languageDescription")}</p>
          <select
            id="locale-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        {isInstalled ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            {t("settings.installed")}
          </p>
        ) : canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="btn-blue flex w-full items-center justify-center gap-2"
          >
            <DeviceMobileIcon size={18} />
            {t("settings.installApp")}
          </button>
        ) : showIosHint ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <p className="mb-1 font-medium">{t("settings.iosTitle")}</p>
            <p>{t("settings.iosHint")}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSqliteExport()}
          className="btn-blue flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportSqlite")}
        </button>

        <button
          type="button"
          onClick={() => void handleMarkdownExport()}
          className="btn-white flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportMarkdown")}
        </button>

        <label className="btn-gray flex w-full cursor-pointer items-center justify-center gap-2">
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
