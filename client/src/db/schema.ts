import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const notesTable = sqliteTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const tagsTable = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const noteTagsTable = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notesTable.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.tagId] })],
)

export const notesRelations = relations(notesTable, ({ many }) => ({
  noteTags: many(noteTagsTable),
}))

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  noteTags: many(noteTagsTable),
}))

export const noteTagsRelations = relations(noteTagsTable, ({ one }) => ({
  note: one(notesTable, {
    fields: [noteTagsTable.noteId],
    references: [notesTable.id],
  }),
  tag: one(tagsTable, {
    fields: [noteTagsTable.tagId],
    references: [tagsTable.id],
  }),
}))

export const schema = {
  notesTable,
  tagsTable,
  noteTagsTable,
  notesRelations,
  tagsRelations,
  noteTagsRelations,
}

export type Note = typeof notesTable.$inferSelect
export type Tag = typeof tagsTable.$inferSelect
export type NoteTag = typeof noteTagsTable.$inferSelect
