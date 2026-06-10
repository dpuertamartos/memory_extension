import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import JSZip from "jszip"
import { eq } from "drizzle-orm"
import { noteTagsTable, notesTable, tagsTable } from "../db/schema"
import { db, exportDatabaseFile, importDatabaseFile, initDb } from "../lib/db"

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const SettingsPage = () => {
  const handleSqliteExport = async () => {
    const blob = await exportDatabaseFile()
    downloadBlob(blob, "local-brain.sqlite")
  }

  const handleMarkdownExport = async () => {
    await initDb()

    const notes = await db.select().from(notesTable).where(eq(notesTable.isDeleted, false))
    const zip = new JSZip()

    for (const note of notes) {
      const tagRows = await db
        .select({ name: tagsTable.name })
        .from(noteTagsTable)
        .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
        .where(eq(noteTagsTable.noteId, note.id))

      const tagNames = tagRows.map((row) => row.name)
      const frontmatter = [
        "---",
        `title: ${JSON.stringify(note.title || "Untitled")}`,
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

    const confirmed = window.confirm(
      "Importing will overwrite your current local database. Continue?",
    )
    if (!confirmed) return

    await importDatabaseFile(file)
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1>Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Your data lives entirely in this browser. Export regularly to keep backups.
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => void handleSqliteExport()}
          className="btn-blue flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          Export SQLite database
        </button>

        <button
          type="button"
          onClick={() => void handleMarkdownExport()}
          className="btn-white flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          Download all notes as Markdown (.zip)
        </button>

        <label className="btn-gray flex w-full cursor-pointer items-center justify-center gap-2">
          <UploadSimpleIcon size={18} />
          Import SQLite backup
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
