import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text, unique, type AnySQLiteColumn } from "drizzle-orm/sqlite-core"
import { ROOT_DIVISION_ID } from "../lib/divisions"

export const divisionsTable = sqliteTable(
  "divisions",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): AnySQLiteColumn => divisionsTable.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [unique().on(table.parentId, table.name)],
)

export const notesTable = sqliteTable("notes", {
  id: text("id").primaryKey(),
  divisionId: text("division_id")
    .notNull()
    .references(() => divisionsTable.id)
    .default(ROOT_DIVISION_ID),
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

export const tagsTable = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    divisionId: text("division_id")
      .notNull()
      .references(() => divisionsTable.id)
      .default(ROOT_DIVISION_ID),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [unique().on(table.divisionId, table.name)],
)

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

export const divisionsRelations = relations(divisionsTable, ({ one, many }) => ({
  parent: one(divisionsTable, {
    fields: [divisionsTable.parentId],
    references: [divisionsTable.id],
    relationName: "divisionChildren",
  }),
  children: many(divisionsTable, { relationName: "divisionChildren" }),
  notes: many(notesTable),
  tags: many(tagsTable),
}))

export const notesRelations = relations(notesTable, ({ one, many }) => ({
  division: one(divisionsTable, {
    fields: [notesTable.divisionId],
    references: [divisionsTable.id],
  }),
  noteTags: many(noteTagsTable),
}))

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  division: one(divisionsTable, {
    fields: [tagsTable.divisionId],
    references: [divisionsTable.id],
  }),
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
  divisionsTable,
  notesTable,
  tagsTable,
  noteTagsTable,
  divisionsRelations,
  notesRelations,
  tagsRelations,
  noteTagsRelations,
}

export type Division = typeof divisionsTable.$inferSelect
export type Note = typeof notesTable.$inferSelect
export type Tag = typeof tagsTable.$inferSelect
export type NoteTag = typeof noteTagsTable.$inferSelect
