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
  startTime?: string  // 格式: yyyy-mm-dd
  endTime?: string    // 格式: yyyy-mm-dd
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
  return get<UserStatsData>('/admin/users/statistics', params as unknown as Record<string, unknown>)
}