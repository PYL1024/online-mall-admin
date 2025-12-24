/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
  /** 是否启用路由守卫 */
  readonly VITE_ENABLE_PERMISSION_GUARD: string
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
}

import 'vue-router'
import { UserRole } from '@/api/model/user'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: UserRole[] // 允许访问该路由的用户角色
    hidden?: boolean // 是否在侧边栏隐藏该路由
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
