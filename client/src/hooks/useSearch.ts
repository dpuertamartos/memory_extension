import { useQuery } from "@tanstack/react-query"
import { initDb, runRawQuery } from "../lib/db"
import {
  buildFtsMatchQuery,
  getEffectiveDateRange,
  isSearchActive,
  type DateField,
  type SearchFilters,
} from "../lib/searchQuery"

export type { SearchFilters } from "../lib/searchQuery"
export { emptySearchFilters, isSearchActive } from "../lib/searchQuery"

export type SearchResult = {
  note_id: string
  title: string
  content: string
  title_snippet: string
  content_snippet: string
}

function tagMatchSnippet(tagName: string, query: string): string {
  const matchLength = Math.min(query.length, tagName.length)
  const matched = tagName.slice(0, matchLength)
  const rest = tagName.slice(matchLength)
  return `Tagged with <mark>#${matched}</mark>${rest}`
}

function intersectSets(base: Set<string> | null, next: Set<string>): Set<string> {
  if (!base) return next
  return new Set([...base].filter((id) => next.has(id)))
}

async function getNotesInDateRange(
  field: DateField,
  from: Date,
  to: Date,
): Promise<Set<string>> {
  const column = field === "created" ? "created_at" : "updated_at"
  const rows = await runRawQuery<{ id: string }>(
    `SELECT id FROM notes
     WHERE is_deleted = 0 AND ${column} >= ? AND ${column} <= ?`,
    [from.getTime(), to.getTime()],
  )
  return new Set(rows.map((row) => row.id))
}

async function getNotesWithAllTags(tagIds: string[]): Promise<Set<string>> {
  if (tagIds.length === 0) return new Set()

  const placeholders = tagIds.map(() => "?").join(", ")
  const rows = await runRawQuery<{ note_id: string }>(
    `SELECT note_id
     FROM note_tags
     WHERE tag_id IN (${placeholders})
     GROUP BY note_id
     HAVING COUNT(DISTINCT tag_id) = ?`,
    [...tagIds, tagIds.length],
  )
  return new Set(rows.map((row) => row.note_id))
}

async function getKeywordMatchIds(keywords: string[]): Promise<Set<string>> {
  const matchQuery = buildFtsMatchQuery(keywords)
  if (!matchQuery) return new Set()

  const ftsResults = await runRawQuery<{ note_id: string }>(
    `SELECT note_id FROM notes_fts WHERE notes_fts MATCH ?`,
    [matchQuery],
  )
  const ids = new Set(ftsResults.map((result) => result.note_id))

  for (const keyword of keywords) {
    const tagMatches = await runRawQuery<{ note_id: string }>(
      `SELECT DISTINCT n.id AS note_id
       FROM notes n
       INNER JOIN note_tags nt ON nt.note_id = n.id
       INNER JOIN tags t ON t.id = nt.tag_id
       WHERE n.is_deleted = 0
         AND lower(t.name) LIKE lower(?) || '%'`,
      [keyword],
    )
    for (const match of tagMatches) {
      ids.add(match.note_id)
    }
  }

  return ids
}

async function fetchSnippetsForNotes(
  noteIds: string[],
  keywords: string[],
): Promise<Map<string, SearchResult>> {
  if (noteIds.length === 0) return new Map()

  const matchQuery = keywords.length > 0 ? buildFtsMatchQuery(keywords) : null
  const snippets = new Map<string, SearchResult>()

  if (matchQuery) {
    const ftsResults = await runRawQuery<SearchResult>(
      `SELECT
        note_id,
        title,
        content,
        snippet(notes_fts, 1, '<mark>', '</mark>', '…', 32) AS title_snippet,
        snippet(notes_fts, 2, '<mark>', '</mark>', '…', 64) AS content_snippet
      FROM notes_fts
      WHERE notes_fts MATCH ? AND note_id IN (${noteIds.map(() => "?").join(", ")})`,
      [matchQuery, ...noteIds],
    )
    for (const result of ftsResults) {
      snippets.set(result.note_id, result)
    }
  }

  const missingIds = noteIds.filter((id) => !snippets.has(id))
  if (missingIds.length > 0) {
    const notes = await runRawQuery<{ id: string; title: string; content: string }>(
      `SELECT id, title, content FROM notes
       WHERE id IN (${missingIds.map(() => "?").join(", ")})`,
      missingIds,
    )
    for (const note of notes) {
      snippets.set(note.id, {
        note_id: note.id,
        title: note.title,
        content: note.content,
        title_snippet: note.title,
        content_snippet: note.content.slice(0, 120),
      })
    }
  }

  if (keywords.length > 0) {
    for (const keyword of keywords) {
      const tagMatches = await runRawQuery<{
        note_id: string
        title: string
        content: string
        tag_name: string
      }>(
        `SELECT DISTINCT n.id AS note_id, n.title, n.content, t.name AS tag_name
         FROM notes n
         INNER JOIN note_tags nt ON nt.note_id = n.id
         INNER JOIN tags t ON t.id = nt.tag_id
         WHERE n.is_deleted = 0
           AND lower(t.name) LIKE lower(?) || '%'
           AND n.id IN (${noteIds.map(() => "?").join(", ")})`,
        [keyword, ...noteIds],
      )

      for (const match of tagMatches) {
        const existing = snippets.get(match.note_id)
        if (existing && !existing.content_snippet.includes("<mark>")) {
          snippets.set(match.note_id, {
            ...existing,
            content_snippet: tagMatchSnippet(match.tag_name, keyword),
          })
        }
      }
    }
  }

  return snippets
}

async function searchNotes(filters: SearchFilters): Promise<SearchResult[]> {
  if (!isSearchActive(filters)) return []

  await initDb()

  let candidateIds: Set<string> | null = null

  const dateRange = getEffectiveDateRange(filters)
  if (dateRange) {
    candidateIds = intersectSets(
      candidateIds,
      await getNotesInDateRange(filters.dateField, dateRange.from, dateRange.to),
    )
  }

  if (filters.tagIds.length > 0) {
    candidateIds = intersectSets(candidateIds, await getNotesWithAllTags(filters.tagIds))
  }

  if (filters.keywords.length > 0) {
    candidateIds = intersectSets(candidateIds, await getKeywordMatchIds(filters.keywords))
  }

  if (!candidateIds || candidateIds.size === 0) return []

  const noteIds = [...candidateIds]
  const snippetMap = await fetchSnippetsForNotes(noteIds, filters.keywords)

  return noteIds
    .map((id) => snippetMap.get(id))
    .filter((result): result is SearchResult => Boolean(result))
}

export function useGlobalSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchNotes(filters),
    enabled: isSearchActive(filters),
    staleTime: 0,
  })
}
