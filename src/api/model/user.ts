/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: UserStatus
  role: UserRole
  createdAt: string
  updatedAt: string
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

/**
 * 用户角色
 */
export enum UserRole {
  /** 管理员 */
  ADMIN = 'admin',
  /** 普通用户 */
  USER = 'user',
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
