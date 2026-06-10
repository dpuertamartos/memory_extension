import { create } from "zustand"

export type MobilePane = "tags" | "list" | "editor" | "settings"

type AppState = {
  selectedTagId: string | null
  selectedNoteId: string | null
  searchQuery: string
  mobilePane: MobilePane
  setSelectedTagId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setMobilePane: (pane: MobilePane) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedTagId: null,
  selectedNoteId: null,
  searchQuery: "",
  mobilePane: "list",
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id, mobilePane: id ? "editor" : "list" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMobilePane: (pane) => set({ mobilePane: pane }),
}))
