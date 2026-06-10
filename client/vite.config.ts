import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  worker: {
    format: "es",
  },
  plugins: [
    {
      name: "sqlite-wasm-opfs-fix",
      enforce: "pre",
      transform(code, id) {
        if (id.includes("@sqlite.org/sqlite-wasm") && code.includes("new Worker")) {
          const workerRegex = /new\s+Worker\s*\(\s*(new\s+URL\s*\([^)]+,[^)]+\))\s*\)/g
          const transformed = code.replace(workerRegex, "new Worker($1, { type: 'module' })")
          if (transformed !== code) {
            return { code: transformed, map: null }
          }
        }
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-saas-transparent-square.png"],
      manifest: {
        name: "Local Brain",
        short_name: "Brain",
        description: "Local-first note-taking PWA",
        theme_color: "#034DA2",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "logo-saas-transparent-square.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,wasm}"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
})
