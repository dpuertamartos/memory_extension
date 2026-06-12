import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import LayoutApp from "./layout/LayoutApp"
import DbProvider from "./providers/DbProvider"
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
  const queryClient = getQueryClient()

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DbProvider>
          <LayoutApp />
        </DbProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App
