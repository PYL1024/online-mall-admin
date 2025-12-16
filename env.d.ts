/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
  /** 是否启用路由守卫 */
  readonly VITE_ENABLE_PERMISSION_GUARD: string
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
