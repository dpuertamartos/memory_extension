import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import LayoutApp from "./layout/LayoutApp"
import DbProvider from "./providers/DbProvider"
import { useThemeStore } from "./store/useThemeStore"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

const App = () => {
  const { isDarkMode } = useThemeStore()
  const queryClient = getQueryClient()

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <div className={isDarkMode ? "dark" : "light"}>
          <DbProvider>
            <LayoutApp />
          </DbProvider>
        </div>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App
