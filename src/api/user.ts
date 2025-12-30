import { get, post, patch, del, put } from '@/utils/request'
import {
  type LoginParams,
  type LoginResult,
  type UserForm,
  type UserInfo,
  type UserListParams,
} from './model/user'
import type { PageResult } from './model/common'

// 模拟开关：如果为 true，则直接返回模拟数据，不请求后端
const USE_MOCK = false

/**
 * 管理员登录
 */
export async function login(data: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/api/admin/auth/login', data as unknown as Record<string, unknown>)
}

/**
 * 重置密码
 */
export function resetPassword(data: Record<string, string>): Promise<void> {
  return post<void>('/api/admin/auth/reset-password', data)
}

/**
 * 退出登录
 */
export function logout(): Promise<void> {
  return post<void>('/api/admin/signout')
}

/**
 * 获取当前管理员信息
 */
export function getCurrentAdmin(): Promise<UserInfo> {
  return get<UserInfo>('/api/admin/info')
}

/**
 * 更新管理员信息
 */
export function updateAdminInfo(data: Partial<UserInfo>): Promise<void> {
  return put<void>('/api/admin/update', data as unknown as Record<string, unknown>)
}

/**
 * 修改管理员密码
 */
export function changePassword(data: Record<string, string>): Promise<void> {
  return put<void>('/api/admin/change-password', data)
}

/**
 * 获取用户列表
 */
export function getUserList(params: UserListParams): Promise<PageResult<UserInfo>> {
  const baseUrl = '/api/admin/users'
  const searchParams = new URLSearchParams()
  searchParams.set('page', params.page.toString())
  searchParams.set('pageSize', params.pageSize.toString())

  if (params.keyword !== undefined && params.keyword !== '') {
    searchParams.set('keyword', params.keyword)
  }
  if (params.status !== undefined) {
    searchParams.set('status', params.status.toString() === 'active' ? '1' : '0')
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
  return get<PageResult<UserInfo>>(
    '/api/admin/admins/list',
    params as unknown as Record<string, unknown>,
  )
}

/**
 * 创建管理员
 */
export function addAdmin(data: Pick<UserForm, 'password' | 'phone'>): Promise<UserInfo> {
  return post<UserInfo>('/api/admin/admins/create', data as unknown as Record<string, unknown>)
}

/**
 * 更新用户状态（封禁/解禁）
 */
export function updateUserStatus(
  userId: number,
  data: { action: number; endTime?: number },
): Promise<void> {
  console.log(userId, data)
  return patch<void>(
    `/api/admin/users/status/${userId}`,
    data as unknown as Record<string, unknown>,
  )
}

/**
 * 删除用户
 * @param userId
 * @returns
 */
export function deleteUser(userId: number): Promise<void> {
  return del<void>(`/api/admin/users/delete/${userId}`)
}

/**
 * 删除管理员
 */
export function deleteAdmin(adminId: number): Promise<void> {
  return del<void>(`/api/admin/admins/${adminId}`)
}

/* =========================================
   用户统计相关类型定义
   ========================================= */

/** 性别分布数据结构 */
export interface GenderDistribution {
  male: number
  female: number
  unknown: number
}

/** 年龄分布数据结构（与后端字段对应） */
export interface AgeDistribution {
  under18: number
  '18-25': number
  '26-35': number
  '36-45': number
  over45: number
}

/** 用户统计核心数据 */
export interface UserStatsData {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
  disabledUsers: number
  genderDistribution: GenderDistribution
  ageDistribution: AgeDistribution
}

/** 用户统计查询参数 */
export interface UserStatisticsParams {
  startTime?: string // 格式: yyyy-mm-dd
  endTime?: string // 格式: yyyy-mm-dd
}

/**
 * 获取用户统计看板数据
 * @param params 可选的时间范围参数
 * @returns Promise 包含用户统计数据
 */
export function getUserStatistics(params?: UserStatisticsParams): Promise<UserStatsData> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: 1000,
          activeUsers: 800,
          newUsersToday: 50,
          newUsersThisMonth: 300,
          disabledUsers: 20,
          genderDistribution: {
            male: 600,
            female: 350,
            unknown: 50,
          },
          ageDistribution: {
            under18: 50,
            '18-25': 300,
            '26-35': 400,
            '36-45': 200,
            over45: 50,
          },
        })
      }, 500)
    })
  }
  return get<UserStatsData>('/api/admin/users/statistics', params as unknown as Record<string, unknown>)
}
