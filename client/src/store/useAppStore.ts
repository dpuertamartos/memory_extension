import { create } from "zustand"
import {
  getStoredFocusDivisionId,
  getStoredIncludedDivisionIds,
  getStoredSubBrainsEnabled,
  inclusionFingerprint,
  ROOT_DIVISION_ID,
  setStoredFocusDivisionId,
  setStoredIncludedDivisionIds,
  setStoredSubBrainsEnabled,
} from "../lib/divisions"
import { emptySearchFilters, type SearchFilters } from "../lib/searchQuery"

export type NavPane = "list" | "calendar" | "divisions" | "tags"

export type NoteSort = "updated" | "created" | "alpha"

type AppState = {
  focusDivisionId: string
  includedDivisionIds: string[]
  selectedTagId: string | null
  selectedNoteId: string | null
  newlyCreatedNoteId: string | null
  searchFilters: SearchFilters
  noteSort: NoteSort
  activePane: NavPane
  showInactiveDivisions: boolean
  subBrainsEnabled: boolean
  setFocusDivision: (id: string, defaultIncludedIds: string[]) => void
  toggleDivisionIncluded: (id: string, checked: boolean, cascadeIds: string[]) => void
  setIncludedDivisionIds: (ids: string[]) => void
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
    activePane: "list" as NavPane,
  }
}

function sortIds(ids: string[]): string[] {
  return [...ids].sort()
}

export const useAppStore = create<AppState>((set) => ({
  focusDivisionId: getStoredFocusDivisionId(),
  includedDivisionIds: getStoredIncludedDivisionIds() ?? [getStoredFocusDivisionId()],
  selectedTagId: null,
  selectedNoteId: null,
  newlyCreatedNoteId: null,
  searchFilters: emptySearchFilters(),
  noteSort: "updated",
  activePane: "list",
  showInactiveDivisions: false,
  subBrainsEnabled: getStoredSubBrainsEnabled() ?? false,
  setFocusDivision: (id, defaultIncludedIds) => {
    const sorted = sortIds(defaultIncludedIds)
    setStoredFocusDivisionId(id)
    setStoredIncludedDivisionIds(sorted)
    set({ focusDivisionId: id, includedDivisionIds: sorted, ...resetDivisionSelection() })
  },
  toggleDivisionIncluded: (id, checked, cascadeIds) => {
    set((state) => {
      const next = new Set(state.includedDivisionIds)
      if (checked) {
        for (const cascadeId of cascadeIds) next.add(cascadeId)
      } else {
        next.delete(id)
      }
      const sorted = sortIds([...next])
      setStoredIncludedDivisionIds(sorted)
      return { includedDivisionIds: sorted }
    })
  },
  setIncludedDivisionIds: (ids) => {
    const sorted = sortIds(ids)
    setStoredIncludedDivisionIds(sorted)
    set({ includedDivisionIds: sorted })
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

export { inclusionFingerprint, ROOT_DIVISION_ID }
