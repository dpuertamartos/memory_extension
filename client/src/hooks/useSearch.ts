import { useQuery } from "@tanstack/react-query"
import { initDb, runRawQuery } from "../lib/db"

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

async function searchNotes(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  await initDb()

  const escaped = trimmed.replace(/"/g, '""')
  const matchQuery = `"${escaped}"*`

  const ftsResults = await runRawQuery<SearchResult>(
    `SELECT
      note_id,
      title,
      content,
      snippet(notes_fts, 1, '<mark>', '</mark>', '…', 32) AS title_snippet,
      snippet(notes_fts, 2, '<mark>', '</mark>', '…', 64) AS content_snippet
    FROM notes_fts
    WHERE notes_fts MATCH ?
    ORDER BY rank`,
    [matchQuery],
  )

  const ftsIds = new Set(ftsResults.map((result) => result.note_id))

  const tagMatches = await runRawQuery<{ note_id: string; title: string; content: string; tag_name: string }>(
    `SELECT DISTINCT
      n.id AS note_id,
      n.title,
      n.content,
      t.name AS tag_name
    FROM notes n
    INNER JOIN note_tags nt ON nt.note_id = n.id
    INNER JOIN tags t ON t.id = nt.tag_id
    WHERE n.is_deleted = 0
      AND lower(t.name) LIKE lower(?) || '%'`,
    [trimmed],
  )

  const tagResults: SearchResult[] = tagMatches
    .filter((match) => !ftsIds.has(match.note_id))
    .map((match) => ({
      note_id: match.note_id,
      title: match.title,
      content: match.content,
      title_snippet: match.title,
      content_snippet: tagMatchSnippet(match.tag_name, trimmed),
    }))

  return [...ftsResults, ...tagResults]
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchNotes(query),
    enabled: query.trim().length > 0,
    staleTime: 0,
  })
}
