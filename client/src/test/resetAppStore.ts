import { emptySearchFilters } from "../lib/searchQuery"
import { useAppStore } from "../store/useAppStore"

export function resetAppStore() {
  useAppStore.setState({
    selectedTagId: null,
    selectedNoteId: null,
    newlyCreatedNoteId: null,
    searchFilters: emptySearchFilters(),
    noteSort: "updated",
    mobilePane: "list",
    mainView: "notes",
  })
}
