/**
 * 通用 API 响应类型（兼容 status / code）
 */
export interface ApiResponse<T = unknown> {
  status?: number
  code?: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number
  pageSize: number
}

/**
 * 分页响应数据
 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
