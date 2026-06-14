import JSZip from "jszip"
import { eq } from "drizzle-orm"
import { divisionsTable, noteTagsTable, notesTable, tagsTable } from "../db/schema"
import { buildDivisionPath } from "../sync/snapshot"
import { db, initDb } from "./db"

export async function exportNotesAsMarkdownZip(untitledLabel: string): Promise<Blob> {
  await initDb()

  const [notes, divisions] = await Promise.all([
    db.select().from(notesTable).where(eq(notesTable.isDeleted, false)),
    db.select().from(divisionsTable),
  ])

  const zip = new JSZip()

  for (const note of notes) {
    const tagRows = await db
      .select({ name: tagsTable.name })
      .from(noteTagsTable)
      .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
      .where(eq(noteTagsTable.noteId, note.id))

    const tagNames = tagRows.map((row) => row.name)
    const divisionPath = buildDivisionPath(divisions, note.divisionId)

    const frontmatter = [
      "---",
      `title: ${JSON.stringify(note.title || untitledLabel)}`,
      `id: ${note.id}`,
      `division_id: ${JSON.stringify(note.divisionId)}`,
      `division: ${JSON.stringify(divisionPath)}`,
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

  return zip.generateAsync({ type: "blob" })
}
