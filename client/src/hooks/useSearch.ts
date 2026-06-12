import { useQuery } from "@tanstack/react-query"
import { searchNotes, type SearchResult } from "../lib/searchEngine"
import { isSearchActive, type SearchFilters } from "../lib/searchQuery"

export type { SearchFilters, SearchResult }
export { emptySearchFilters, isSearchActive } from "../lib/searchQuery"

export function useGlobalSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchNotes(filters),
    enabled: isSearchActive(filters),
    staleTime: 0,
  })
}
