import { create } from "zustand"
import { emptySearchFilters, type SearchFilters } from "../lib/searchQuery"

export type MobilePane = "tags" | "list" | "editor" | "settings" | "calendar"
export type NoteSort = "updated" | "created" | "alpha"
export type MainView = "notes" | "calendar"

type AppState = {
  selectedTagId: string | null
  selectedNoteId: string | null
  newlyCreatedNoteId: string | null
  searchFilters: SearchFilters
  noteSort: NoteSort
  mobilePane: MobilePane
  mainView: MainView
  setSelectedTagId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  setNewlyCreatedNoteId: (id: string | null) => void
  setSearchFilters: (filters: SearchFilters) => void
  updateSearchFilters: (patch: Partial<SearchFilters>) => void
  clearSearchFilters: () => void
  setNoteSort: (sort: NoteSort) => void
  setMobilePane: (pane: MobilePane) => void
  setMainView: (view: MainView) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedTagId: null,
  selectedNoteId: null,
  newlyCreatedNoteId: null,
  searchFilters: emptySearchFilters(),
  noteSort: "updated",
  mobilePane: "list",
  mainView: "notes",
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
}))
