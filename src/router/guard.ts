import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'

// NProgress 配置
NProgress.configure({ showSpinner: false })

// 白名单路由（无需登录即可访问）
const whiteList = ['/login', '/404']

/**
 * 是否启用路由守卫
 * 通过环境变量控制，开发环境可禁用方便调试
 */
const enablePermissionGuard = import.meta.env.VITE_ENABLE_PERMISSION_GUARD === 'true'

/**
 * 设置路由守卫
 */
export function setupRouterGuard(router: Router) {
  // 前置守卫
  router.beforeEach(async (to, _from, next) => {
    // 开始进度条
    NProgress.start()

    // 设置页面标题
    const title = to.meta?.title as string
    document.title = title
      ? `${title} - ${import.meta.env.VITE_APP_TITLE}`
      : import.meta.env.VITE_APP_TITLE

    // 如果禁用了路由守卫（开发模式），直接放行
    if (!enablePermissionGuard) {
      next()
      return
    }

    // 获取 Token
    const hasToken = getToken()
    const userStore = useUserStore()

    if (hasToken) {
      // 已登录
      if (to.path === '/login') {
        // 已登录但访问登录页，重定向到首页
        next({ path: '/' })
      } else {
        // 检查是否已获取用户信息
        if (!userStore.userInfo) {
          try {
            await userStore.fetchUserInfo()
            // 获取用户信息后，重新进入当前路由以触发权限检查
            next({ ...to, replace: true })
          } catch (error) {
            // 获取用户信息失败，重置状态并跳转到登录页
            console.error('获取用户信息失败：', error)
            userStore.resetState()
            next(`/login?redirect=${to.path}`)
          }
        } else {
          // 检查权限
          const roles = to.meta?.roles as number[] | undefined
          if (roles && roles.length > 0) {
            const userRole = userStore.userInfo.role as number | undefined
            if (userRole && roles.includes(userRole)) {
              next()
            } else {
              // 无权限，跳转到 404 或提示页面
              next({ path: '/404' })
            }
          } else {
            // 无需权限检查，直接放行
            next()
          }
        }
      }
    } else {
      // 未登录
      if (whiteList.includes(to.path)) {
        // 在白名单中，直接放行
        next()
      } else {
        // 不在白名单中，重定向到登录页
        next(`/login?redirect=${to.path}`)
      }
    }
  })

  // 后置守卫
  router.afterEach(() => {
    // 结束进度条
    NProgress.done()
  })
}
