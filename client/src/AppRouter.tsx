import { Route, Routes } from "react-router"
import BrainPage from "./pages/BrainPage"
import SettingsPage from "./pages/SettingsPage"
import { useAppStore } from "./store/useAppStore"

const AppRouter = () => {
  const { mobilePane } = useAppStore()

  return (
    <Routes>
      <Route
        index
        element={
          mobilePane === "settings" ? (
            <div className="h-full md:hidden">
              <SettingsPage />
            </div>
          ) : (
            <BrainPage />
          )
        }
      />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default AppRouter
