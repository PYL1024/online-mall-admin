/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  username: string
  avatar: string
  phone: string
  email: string
  gender: string
  status: UserStatus
  role: UserRole
  createdAt: string //yyyy-MM-dd HH:mm:ss
  updatedAt: string //yyyy-MM-dd HH:mm:ss
}

/**
 * 用户状态
 */
export enum UserStatus {
  /** 正常 */
  ACTIVE = 1,
  /** 禁用 */
  DISABLED = 0,
}

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
  username: string
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
  username?: string
  phone?: string
  status?: UserStatus
}

/**
 * 创建用户表单
 */
export interface UserForm {
  username: string
  password: string
  phone: string
  email: string
  status: number
  role: UserRole | null
}

/**
 * 搜索表单
 */

export interface SearchForm {
  username: string
  phone: string
  email: string
  status?: UserStatus
}
