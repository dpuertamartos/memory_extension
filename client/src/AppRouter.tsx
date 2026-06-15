import { Route, Routes } from "react-router"
import BrainPage from "./pages/BrainPage"
import SettingsPage from "./pages/SettingsPage"

const AppRouter = () => {
  return (
    <Routes>
      <Route index element={<BrainPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default AppRouter
