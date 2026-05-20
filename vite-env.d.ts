/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_AI_ENABLED: string
  readonly VITE_LOCAL_AI_MODEL: string
  readonly VITE_LOCAL_AI_URL: string
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
