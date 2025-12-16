import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/api/model/user'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/user'
import type { LoginParams } from '@/api/model/user'
import { setToken, removeToken, getToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(getToken())
  const userInfo = ref<UserInfo | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const nickname = computed(() => userInfo.value?.nickname || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  /**
   * 登录
   */
  async function login(params: LoginParams) {
    try {
      const result = await loginApi(params)
      token.value = result.token
      userInfo.value = result.userInfo
      setToken(result.token)
      return result
    } catch (error) {
      throw error
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 忽略退出登录的错误
    } finally {
      token.value = null
      userInfo.value = null
      removeToken()
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    try {
      const info = await getCurrentUser()
      userInfo.value = info
      return info
    } catch (error) {
      throw error
    }
  }

  /**
   * 重置状态
   */
  function resetState() {
    token.value = null
    userInfo.value = null
    removeToken()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    nickname,
    avatar,
    login,
    logout,
    fetchUserInfo,
    resetState,
  }
})
