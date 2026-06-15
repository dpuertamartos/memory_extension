import { emptySearchFilters } from "../lib/searchQuery"
import { ROOT_DIVISION_ID, useAppStore } from "../store/useAppStore"
import { getDefaultIncludedDivisionIds } from "../lib/divisionTree"

export function resetAppStore(divisions?: { id: string; parentId: string | null; sortOrder: number; name: string }[]) {
  const focusDivisionId = ROOT_DIVISION_ID
  const defaultIncluded =
    divisions && divisions.length > 0
      ? getDefaultIncludedDivisionIds(divisions as Parameters<typeof getDefaultIncludedDivisionIds>[0], focusDivisionId)
      : [focusDivisionId]

  useAppStore.setState({
    focusDivisionId,
    includedDivisionIds: defaultIncluded,
    selectedTagId: null,
    selectedNoteId: null,
    newlyCreatedNoteId: null,
    searchFilters: emptySearchFilters(),
    noteSort: "updated",
    activePane: "list",
    showInactiveDivisions: false,
    subBrainsEnabled: false,
  })
}
