/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  username: string
  phone: string
  email: string | null
  avatar: string
  status: UserStatus
  role?: UserRole | null
  birthday?: string | null
  createdTime: string
  updatedTime: string
}

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'disabled'

export enum UserRole {
  /** 普通用户 */
  USER = 0,
  /** 普通管理员 */
  ADMIN = 1,
  /** 超级管理员 */
  SUPER_ADMIN = 2,
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  account: string
  password: string
}

/**
 * 登录响应数据
 */
export interface LoginResult {
  token: string
  userInfo: UserInfo
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus
  role?: UserRole
}

/**
 * 创建用户表单
 */
export interface UserForm {
  username: string
  password: string
  phone: string
  email: string
  status: UserStatus
  role: UserRole | null
}

/**
 * 搜索表单
 */

export interface SearchForm {
  keyword: string
  status?: UserStatus
}
