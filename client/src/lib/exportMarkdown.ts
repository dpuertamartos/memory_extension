import JSZip from "jszip"
import { eq } from "drizzle-orm"
import { noteTagsTable, notesTable, tagsTable } from "../db/schema"
import { db, initDb } from "./db"

export async function exportNotesAsMarkdownZip(untitledLabel: string): Promise<Blob> {
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
      `title: ${JSON.stringify(note.title || untitledLabel)}`,
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

  return zip.generateAsync({ type: "blob" })
}
