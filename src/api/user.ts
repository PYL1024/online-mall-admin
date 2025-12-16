import { get, post } from '@/utils/request'
import type { LoginParams, LoginResult, UserInfo, UserListParams } from './model/user'
import type { PageResult } from './model/common'

// 模拟开关：如果为 true，则直接返回模拟数据，不请求后端
const USE_MOCK = true

/**
 * 用户登录
 */
export async function login(data: LoginParams): Promise<LoginResult> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock-token-admin-123456',
          userInfo: {
            id: 1,
            username: data.username,
            nickname: '系统管理员',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
            email: 'admin@example.com',
            phone: '13800138000',
            status: 1,
            role: 'admin',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
          },
        } as LoginResult)
      }, 500)
    })
  }
  return post<LoginResult>('/auth/login', data as unknown as Record<string, unknown>)
}

/**
 * 用户退出登录
 */
export function logout(): Promise<void> {
  if (USE_MOCK) {
    return Promise.resolve()
  }
  return post<void>('/auth/logout')
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): Promise<UserInfo> {
  if (USE_MOCK) {
    return Promise.resolve({
      id: 1,
      username: 'admin',
      nickname: '系统管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'admin@example.com',
      phone: '13800138000',
      status: 1,
      role: 'admin',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    } as UserInfo)
  }
  return get<UserInfo>('/auth/current')
}

/**
 * 获取用户列表
 */
export function getUserList(params: UserListParams): Promise<PageResult<UserInfo>> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const list = Array.from({ length: params.pageSize }).map((_, index) => ({
          id: index + 1 + (params.page - 1) * params.pageSize,
          username: `user_${index + 1}`,
          nickname: `测试用户${index + 1}`,
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          email: `user${index + 1}@example.com`,
          phone: `1380013800${index}`,
          status: index % 3 === 0 ? 0 : 1,
          role: index === 0 ? 'admin' : 'user',
          createdAt: '2023-01-01 12:00:00',
          updatedAt: '2023-01-02 12:00:00',
        }))
        resolve({
          list: list as unknown as UserInfo[],
          total: 100,
          page: params.page,
          pageSize: params.pageSize,
        })
      }, 500)
    })
  }
  return get<PageResult<UserInfo>>('/users', params as unknown as Record<string, unknown>)
}

/**
 * 更新用户状态（封禁/解禁）
 */
export function updateUserStatus(userId: number, status: number): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>(`/users/${userId}/status`, { status })
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: number): Promise<UserInfo> {
  if (USE_MOCK) {
    return Promise.resolve({
      id: userId,
      username: 'admin',
      nickname: '系统管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'admin@example.com',
      phone: '13800138000',
      status: 1,
      role: 'admin',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    } as UserInfo)
  }
  return get<UserInfo>(`/users/${userId}`)
}
