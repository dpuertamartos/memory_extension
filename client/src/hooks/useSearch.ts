import { useQuery } from "@tanstack/react-query"
import { initDb, runRawQuery } from "../lib/db"

export type SearchResult = {
  note_id: string
  title: string
  content: string
  title_snippet: string
  content_snippet: string
}

async function searchNotes(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  await initDb()

  const escaped = trimmed.replace(/"/g, '""')
  const matchQuery = `"${escaped}"*`

  return runRawQuery<SearchResult>(
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
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchNotes(query),
    enabled: query.trim().length > 0,
    staleTime: 0,
  })
}
