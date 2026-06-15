// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import i18n from "../../i18n"
import { renderApp } from "../../test/renderApp"
import { resetAppStore } from "../../test/resetAppStore"
import { useAppStore } from "../../store/useAppStore"
import AppNav from "./AppNav"

describe("AppNav", () => {
  beforeEach(() => {
    resetAppStore()
    void i18n.changeLanguage("en")
  })

  it("renders unified nav tabs in English", () => {
    renderApp(<AppNav />)
    expect(screen.getByRole("button", { name: "Notes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tags" })).toBeInTheDocument()
    expect(screen.getByText("Notes")).toHaveClass("app-nav-label")
  })

  it("renders Spanish labels with truncation", async () => {
    await i18n.changeLanguage("es")
    renderApp(<AppNav />)
    expect(screen.getByRole("button", { name: "Notas" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Calendario" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Etiquetas" })).toBeInTheDocument()
    expect(screen.getByText("Calendario")).toHaveClass("app-nav-label")
  })

  it("switches active pane via store", () => {
    renderApp(<AppNav />)
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }))
    expect(useAppStore.getState().activePane).toBe("calendar")
  })

  it("shows sub-brains tab when feature is enabled", () => {
    useAppStore.getState().setSubBrainsEnabled(true)
    renderApp(<AppNav />)
    expect(screen.getByRole("button", { name: "Sub-brains" })).toBeInTheDocument()
  })
})
