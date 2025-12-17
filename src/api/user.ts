import { get, post } from '@/utils/request'
import type { LoginParams, LoginResult, UserForm, UserInfo, UserListParams } from './model/user'
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
            username: '超级管理员',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
            phone: '13800138000',
            email: 'admin@example.com',
            gender: '未知',
            status: 1,
            role: 0,
            createdAt: '2023-01-01 11:45:14',
            updatedAt: '2023-01-01 11:45:14',
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
      username: '超级管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      phone: '13800138000',
      email: 'admin@example.com',
      gender: '未知',
      status: 1,
      role: 0,
      createdAt: '2023-01-01 11:45:14',
      updatedAt: '2023-01-01 11:45:14',
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
        let allMockData = Array.from({ length: 100 }).map((_, index) => ({
          id: index + 1 + (params.page - 1) * params.pageSize,
          username: `user_${index + 1}`,
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          phone: `1380013800${index}`,
          email: `user${index + 1}@example.com`,
          gender: '未知',
          status: index % 3 === 0 ? 0 : 1,
          role: index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : 0,
          createdAt: '2023-01-01 11:45:14',
          updatedAt: '2023-01-02 11:45:14',
        })) as unknown as UserInfo[]

        // 2. 模拟后端过滤逻辑 (根据 params.username 筛选)
        if (params.username) {
          allMockData = allMockData.filter((u) => u.username.includes(params.username!))
        }
        if (params.phone) {
          allMockData = allMockData.filter((u) => u.phone.includes(params.phone!))
        }
        if (params.status != undefined) {
          allMockData = allMockData.filter((u) => u.status == params.status!)
        }

        // 3. 模拟后端分页逻辑 (根据 params.page 和 pageSize 切割数组)
        const start = (params.page - 1) * params.pageSize
        const end = start + params.pageSize
        const pageList = allMockData.slice(start, end)

        resolve({
          list: pageList,
          total: allMockData.length, // 总数应该是过滤后的总数
          page: params.page,
          pageSize: params.pageSize,
        })
      }, 500)
    })
  }
  return get<PageResult<UserInfo>>('/users', params as unknown as Record<string, unknown>)
}

/**
 * 新增用户
 */
export function addUser(data: UserForm): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>('/users', { data })
}

/**
 * 更新用户状态（封禁/解禁）
 */
export function updateUserStatus(userId: number, status: number): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>(`/users/${userId}/status`, { status })
}

/**
 * 删除用户
 * @param userId
 * @returns
 */
export function deleteUser(userId: number): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>(`/users/deleteUser/${userId}`)
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: number): Promise<UserInfo> {
  if (USE_MOCK) {
    return Promise.resolve({
      id: userId,
      username: '用户的名字',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      phone: '13800138000',
      email: 'admin@example.com',
      gender: '未知',
      status: 1,
      role: 2,
      createdAt: '2023-01-01 11:45:14',
      updatedAt: '2023-01-01 11:45:14',
    } as UserInfo)
  }
  return get<UserInfo>(`/users/${userId}`)
}
