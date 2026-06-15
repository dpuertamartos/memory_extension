import { emptySearchFilters } from "../lib/searchQuery"
import { ROOT_DIVISION_ID, useAppStore } from "../store/useAppStore"

export function resetAppStore() {
  useAppStore.setState({
    focusDivisionId: ROOT_DIVISION_ID,
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
