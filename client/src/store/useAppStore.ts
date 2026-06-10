import { create } from "zustand"

export type MobilePane = "tags" | "list" | "editor" | "settings"
export type NoteSort = "updated" | "created" | "alpha"

type AppState = {
  selectedTagId: string | null
  selectedNoteId: string | null
  searchQuery: string
  noteSort: NoteSort
  mobilePane: MobilePane
  setSelectedTagId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setNoteSort: (sort: NoteSort) => void
  setMobilePane: (pane: MobilePane) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedTagId: null,
  selectedNoteId: null,
  searchQuery: "",
  noteSort: "updated",
  mobilePane: "list",
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id, mobilePane: id ? "editor" : "list" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setNoteSort: (sort) => set({ noteSort: sort }),
  setMobilePane: (pane) => set({ mobilePane: pane }),
}))
