/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*?worker" {
  const WorkerFactory: new () => Worker
  export default WorkerFactory
}
