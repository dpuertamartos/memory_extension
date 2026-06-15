/** Fixed id for the root division — stable across migrations and imports. */
export const ROOT_DIVISION_ID = "01MAINBRAIN00000000000000"

export const ROOT_DIVISION_NAME = "Main Brain"

/** @deprecated Use FOCUS_DIVISION_STORAGE_KEY — kept for migration. */
export const ACTIVE_DIVISION_STORAGE_KEY = "local-brain-active-division-id"

export const FOCUS_DIVISION_STORAGE_KEY = "local-brain-focus-division-id"
export const INCLUDED_DIVISIONS_STORAGE_KEY = "local-brain-included-division-ids"
export const SUB_BRAINS_ENABLED_STORAGE_KEY = "local-brain-sub-brains-enabled"

export function getStoredFocusDivisionId(): string {
  try {
    const stored =
      localStorage.getItem(FOCUS_DIVISION_STORAGE_KEY) ??
      localStorage.getItem(ACTIVE_DIVISION_STORAGE_KEY)
    return stored ?? ROOT_DIVISION_ID
  } catch {
    return ROOT_DIVISION_ID
  }
}

export function setStoredFocusDivisionId(id: string) {
  try {
    localStorage.setItem(FOCUS_DIVISION_STORAGE_KEY, id)
    localStorage.setItem(ACTIVE_DIVISION_STORAGE_KEY, id)
  } catch {
    // ignore quota / private mode errors
  }
}

export function getStoredIncludedDivisionIds(): string[] | null {
  try {
    const raw = localStorage.getItem(INCLUDED_DIVISIONS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      return null
    }
    return [...parsed].sort()
  } catch {
    return null
  }
}

export function setStoredIncludedDivisionIds(ids: string[]) {
  try {
    const sorted = [...ids].sort()
    localStorage.setItem(INCLUDED_DIVISIONS_STORAGE_KEY, JSON.stringify(sorted))
  } catch {
    // ignore quota / private mode errors
  }
}

export function inclusionFingerprint(ids: string[]): string {
  return [...ids].sort().join(",")
}

export function getStoredSubBrainsEnabled(): boolean | null {
  try {
    const raw = localStorage.getItem(SUB_BRAINS_ENABLED_STORAGE_KEY)
    if (raw === null) return null
    return raw === "true"
  } catch {
    return null
  }
}

export function setStoredSubBrainsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SUB_BRAINS_ENABLED_STORAGE_KEY, String(enabled))
  } catch {
    // ignore quota / private mode errors
  }
}

/** @deprecated Use getStoredFocusDivisionId */
export function getStoredActiveDivisionId(): string {
  return getStoredFocusDivisionId()
}

/** @deprecated Use setStoredFocusDivisionId */
export function setStoredActiveDivisionId(id: string) {
  setStoredFocusDivisionId(id)
}
