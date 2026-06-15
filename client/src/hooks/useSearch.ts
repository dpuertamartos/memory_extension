import { useQuery } from "@tanstack/react-query"
import { searchNotes, type SearchResult } from "../lib/searchEngine"
import { inclusionFingerprint } from "../lib/divisions"
import { isSearchActive, type SearchFilters } from "../lib/searchQuery"
import { useAppStore } from "../store/useAppStore"
import { useIncludedDivisionIds } from "./useDivisions"

export type { SearchFilters, SearchResult }
export { emptySearchFilters, isSearchActive } from "../lib/searchQuery"

export function useGlobalSearch(filters: SearchFilters) {
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useQuery({
    queryKey: ["search", inclusionKey, focusDivisionId, filters],
    queryFn: () => searchNotes(includedDivisionIds, filters),
    enabled: isSearchActive(filters),
    staleTime: 0,
  })
}
