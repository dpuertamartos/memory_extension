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

export type MobilePane = "tags" | "divisions" | "list" | "editor" | "settings" | "calendar"
export type NoteSort = "updated" | "created" | "alpha"
export type MainView = "notes" | "calendar"

type AppState = {
  focusDivisionId: string
  includedDivisionIds: string[]
  selectedTagId: string | null
  selectedNoteId: string | null
  newlyCreatedNoteId: string | null
  searchFilters: SearchFilters
  noteSort: NoteSort
  mobilePane: MobilePane
  mainView: MainView
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
  setMobilePane: (pane: MobilePane) => void
  setMainView: (view: MainView) => void
  setShowInactiveDivisions: (show: boolean) => void
  setSubBrainsEnabled: (enabled: boolean) => void
}

function resetDivisionSelection() {
  return {
    selectedTagId: null,
    selectedNoteId: null,
    newlyCreatedNoteId: null,
    searchFilters: emptySearchFilters(),
    mobilePane: "list" as MobilePane,
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
  mobilePane: "list",
  mainView: "notes",
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
  setSelectedTagId: (id) => set({ selectedTagId: id, mobilePane: "list" }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id, mobilePane: id ? "editor" : "list" }),
  setNewlyCreatedNoteId: (id) => set({ newlyCreatedNoteId: id }),
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  updateSearchFilters: (patch) =>
    set((state) => ({ searchFilters: { ...state.searchFilters, ...patch } })),
  clearSearchFilters: () => set({ searchFilters: emptySearchFilters() }),
  setNoteSort: (sort) => set({ noteSort: sort }),
  setMobilePane: (pane) => set({ mobilePane: pane, mainView: pane === "calendar" ? "calendar" : "notes" }),
  setMainView: (view) =>
    set({ mainView: view, mobilePane: view === "calendar" ? "calendar" : "list" }),
  setShowInactiveDivisions: (show) => set({ showInactiveDivisions: show }),
  setSubBrainsEnabled: (enabled) => {
    setStoredSubBrainsEnabled(enabled)
    set({ subBrainsEnabled: enabled })
  },
}))

export { inclusionFingerprint, ROOT_DIVISION_ID }
