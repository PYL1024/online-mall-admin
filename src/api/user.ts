import { get, post, patch, del, put } from '@/utils/request'
import {
  UserStatus,
  type LoginParams,
  type LoginResult,
  type UserForm,
  type UserInfo,
  type UserListParams,
} from './model/user'
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
            gender: '男',
            status: UserStatus.ACTIVE,
            role: 2,
            createdTime: '2023-01-01 11:45:14',
            updatedTime: '2023-01-01 11:45:14',
          },
        } as LoginResult)
      }, 500)
    })
  }
  return post<LoginResult>('/api/admin/auth/login', data as unknown as Record<string, unknown>)
}

/**
 * 重置密码
 */
export function resetPassword(data: Record<string, string>): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>('/api/admin/auth/reset-password', data)
}

/**
 * 用户退出登录
 */
export function logout(): Promise<void> {
  if (USE_MOCK) {
    return Promise.resolve()
  }
  return post<void>('/api/admin/signout')
}

/**
 * 获取当前管理员信息
 */
export function getCurrentAdmin(): Promise<UserInfo> {
  if (USE_MOCK) {
    return Promise.resolve({
      id: 1,
      username: '超级管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      phone: '13800138000',
      email: 'admin@example.com',
      gender: '男',
      status: UserStatus.ACTIVE,
      role: 2,
      createdTime: '2023-01-01 11:45:14',
      updatedTime: '2023-01-01 11:45:14',
    } as UserInfo)
  }
  return get<UserInfo>('/api/admin/info')
}

/**
 * 更新管理员信息
 */
export function updateAdminInfo(data: Partial<UserInfo>): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return put<void>('/api/admin/update', data as unknown as Record<string, unknown>)
}

/**
 * 修改管理员密码
 */
export function changePassword(data: Record<string, string>): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return put<void>('/api/admin/change-password', data)
}

/**
 * 获取用户列表
 */
export function getUserList(params: UserListParams): Promise<PageResult<UserInfo>> {
  // if (USE_MOCK) {
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       let allMockData = Array.from({ length: 100 }).map((_, index) => ({
  //         id: index + 1 + (params.page - 1) * params.pageSize,
  //         username: `user_${index + 1}`,
  //         avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  //         phone: `1380013800${index}`,
  //         email: `user${index + 1}@example.com`,
  //         gender: '未知',
  //         status: index % 3 === 0 ? UserStatus.DISABLED : UserStatus.ACTIVE,
  //         role: index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : 0,
  //         createdTime: '2023-01-01 11:45:14',
  //         updatedTime: '2023-01-02 11:45:14',
  //       })) as unknown as UserInfo[]

  //       // 2. 模拟后端过滤逻辑
  //       if (params.keyword) {
  //         allMockData = allMockData.filter(
  //           (u) =>
  //             u.username.includes(params.keyword!) ||
  //             u.phone.includes(params.keyword!) ||
  //             u.email.includes(params.keyword!),
  //         )
  //       }
  //       if (params.status != undefined) {
  //         allMockData = allMockData.filter((u) => u.status == params.status!)
  //       }
  //       if (params.role != undefined) {
  //         allMockData = allMockData.filter((u) => u.role == params.role!)
  //       }

  //       // 3. 模拟后端分页逻辑
  //       const start = (params.page - 1) * params.pageSize
  //       const end = start + params.pageSize
  //       const pageList = allMockData.slice(start, end)

  //       resolve({
  //         list: pageList,
  //         total: allMockData.length,
  //         page: params.page,
  //         pageSize: params.pageSize,
  //       })
  //     }, 500)
  //   })
  // }
  const baseUrl = '/api/admin/users'
  const searchParams = new URLSearchParams()
  searchParams.set('page', params.page.toString())
  searchParams.set('pageSize', params.pageSize.toString())

  if (params.keyword !== undefined && params.keyword !== '') {
    searchParams.set('keyword', params.keyword)
  }
  if (params.status !== undefined) {
    searchParams.set('status', params.status.toString())
  }
  if (params.role !== undefined) {
    searchParams.set('role', params.role.toString())
  }

  const url = `${baseUrl}?${searchParams.toString()}`
  return get<PageResult<UserInfo>>(url)
}

/**
 * 获取管理员列表
 */
export function getAdminList(params: UserListParams): Promise<PageResult<UserInfo>> {
  if (USE_MOCK) {
    // 复用 getUserList 的 Mock 逻辑，但强制过滤 role=1
    return getUserList({ ...params, role: 1 })
  }
  return get<PageResult<UserInfo>>(
    '/admin/admins/list',
    params as unknown as Record<string, unknown>,
  )
}

/**
 * 新增用户
 */
export function addUser(data: UserForm): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return post<void>('/admin/users', { data })
}

/**
 * 创建管理员
 */
export function addAdmin(data: Pick<UserForm, 'password' | 'phone'>): Promise<UserInfo> {
  if (USE_MOCK) {
    return Promise.resolve({
      id: Math.floor(Math.random() * 1000),
      username: `admin_${data.phone}`,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    } as UserInfo)
  }
  return post<UserInfo>('/admin/admins/create', data as unknown as Record<string, unknown>)
}

/**
 * 更新用户状态（封禁/解禁）
 */
export function updateUserStatus(
  userId: number,
  data: { action: number; endTime?: number },
): Promise<void> {
  // if (USE_MOCK) return Promise.resolve()
  return patch<void>(`/admin/users/status/${userId}`, data as unknown as Record<string, unknown>)
}

/**
 * 删除用户
 * @param userId
 * @returns
 */
export function deleteUser(userId: number): Promise<void> {
  // if (USE_MOCK) return Promise.resolve()
  return del<void>(`/admin/users/delete/${userId}`)
}

/**
 * 删除管理员
 */
export function deleteAdmin(adminId: number): Promise<void> {
  if (USE_MOCK) return Promise.resolve()
  return del<void>(`/admin/admins/${adminId}`)
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
      status: UserStatus.ACTIVE,
      role: 2,
      createdTime: '2023-01-01 11:45:14',
      updatedTime: '2023-01-01 11:45:14',
    } as UserInfo)
  }
  return get<UserInfo>(`/admin/users/${userId}`)
}
