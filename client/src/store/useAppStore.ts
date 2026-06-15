import { create } from "zustand"
import {
  getStoredFocusDivisionId,
  getStoredSubBrainsEnabled,
  ROOT_DIVISION_ID,
  setStoredFocusDivisionId,
  setStoredSubBrainsEnabled,
} from "../lib/divisions"
import { emptySearchFilters, type SearchFilters } from "../lib/searchQuery"

export type NavPane = "list" | "calendar" | "divisions" | "tags"

export type NoteSort = "updated" | "created" | "alpha"

type AppState = {
  focusDivisionId: string
  selectedTagId: string | null
  selectedNoteId: string | null
  newlyCreatedNoteId: string | null
  searchFilters: SearchFilters
  noteSort: NoteSort
  activePane: NavPane
  showInactiveDivisions: boolean
  subBrainsEnabled: boolean
  setFocusDivision: (id: string) => void
  setSelectedTagId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  setNewlyCreatedNoteId: (id: string | null) => void
  setSearchFilters: (filters: SearchFilters) => void
  updateSearchFilters: (patch: Partial<SearchFilters>) => void
  clearSearchFilters: () => void
  setNoteSort: (sort: NoteSort) => void
  setActivePane: (pane: NavPane) => void
  setShowInactiveDivisions: (show: boolean) => void
  setSubBrainsEnabled: (enabled: boolean) => void
}

function resetDivisionSelection() {
  return {
    selectedTagId: null,
    selectedNoteId: null,
    newlyCreatedNoteId: null,
    searchFilters: emptySearchFilters(),
  }
}

export const useAppStore = create<AppState>((set) => ({
  focusDivisionId: getStoredFocusDivisionId(),
  selectedTagId: null,
  selectedNoteId: null,
  newlyCreatedNoteId: null,
  searchFilters: emptySearchFilters(),
  noteSort: "updated",
  activePane: "list",
  showInactiveDivisions: false,
  subBrainsEnabled: getStoredSubBrainsEnabled() ?? false,
  setFocusDivision: (id) => {
    setStoredFocusDivisionId(id)
    set({ focusDivisionId: id, ...resetDivisionSelection() })
  },
  setSelectedTagId: (id) => set({ selectedTagId: id, activePane: "list" }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setNewlyCreatedNoteId: (id) => set({ newlyCreatedNoteId: id }),
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  updateSearchFilters: (patch) =>
    set((state) => ({ searchFilters: { ...state.searchFilters, ...patch } })),
  clearSearchFilters: () => set({ searchFilters: emptySearchFilters() }),
  setNoteSort: (sort) => set({ noteSort: sort }),
  setActivePane: (pane) => set({ activePane: pane }),
  setShowInactiveDivisions: (show) => set({ showInactiveDivisions: show }),
  setSubBrainsEnabled: (enabled) => {
    setStoredSubBrainsEnabled(enabled)
    set((state) => ({
      subBrainsEnabled: enabled,
      activePane: !enabled && state.activePane === "divisions" ? "list" : state.activePane,
    }))
  },
}))

export { ROOT_DIVISION_ID }
