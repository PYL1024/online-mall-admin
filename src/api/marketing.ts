/**
 * 营销管理 API
 * 包含：优惠券、轮播图等营销相关接口
 */

import { get, post, del } from '@/utils/request'

// ==================== 轮播图 API ====================

/**
 * 轮播图接口响应类型
 */
export interface CarouselItem {
  id: number
  imgUrl: string
  linkUrl: string
  sortOrder: number
  isActive: number
}

/**
 * 新增轮播图参数类型
 */
export interface AddCarouselParams {
  imgUrl: string
  linkUrl?: string
  sortOrder?: number
  isActive?: number
}

/**
 * 获取轮播图列表
 * API: GET /api/product/carousel
 */
export async function getCarouselList(): Promise<CarouselItem[]> {
  return get<CarouselItem[]>('/api/product/carousel')
}

/**
 * 新增轮播图
 * API: POST /api/product/carousel
 */
export async function addCarousel(data: AddCarouselParams): Promise<void> {
  return post<void>('/api/product/carousel', data as unknown as Record<string, unknown>)
}

/**
 * 删除轮播图
 * API: DELETE /api/product/carousel/{id}
 */
export async function deleteCarousel(id: number): Promise<void> {
  return del<void>(`/api/product/carousel/${id}`)
}

// ==================== 优惠券 API ====================

/**
 * 优惠券类型
 * type: 1-满减券, 2-折扣券
 */
export interface Coupon {
  id: number
  name: string
  type: 1 | 2          // 1-满减券, 2-折扣券
  value: number        // 满减金额或折扣比例
  minSpend: number     // 最低消费门槛
  startTime: string    // 生效时间
  endTime: string      // 失效时间
  totalCount: number   // 发放总量
  usedCount: number    // 已使用数量
  status: number       // 状态：1-启用，0-禁用
  createTime: string   // 创建时间
}

/**
 * 优惠券列表查询参数
 */
export interface CouponListParams {
  page?: number
  pageSize?: number
  name?: string        // 按名称搜索
  type?: 1 | 2         // 按类型筛选
  status?: number      // 按状态筛选
}

/**
 * 优惠券列表响应
 */
export interface CouponListResult {
  list: Coupon[]
  total: number
  page: number
  pageSize: number
}

/**
 * 新增/编辑优惠券参数
 */
export interface CouponParams {
  id?: number          // 编辑时需要传入
  name: string
  type: 1 | 2
  value: number
  minSpend: number
  startTime: string
  endTime: string
  totalCount?: number  // 发放总量
  status?: number      // 状态：1-启用，0-禁用
}

/**
 * 获取优惠券列表
 * API: GET /api/marketing/coupon
 */
export async function getCouponList(params?: CouponListParams): Promise<CouponListResult> {
  return get<CouponListResult>('/api/marketing/coupon', params as unknown as Record<string, unknown>)
}

/**
 * 获取优惠券详情
 * API: GET /api/marketing/coupon/{id}
 */
export async function getCouponDetail(id: number): Promise<Coupon> {
  return get<Coupon>(`/api/marketing/coupon/${id}`)
}

/**
 * 新增优惠券
 * API: POST /api/marketing/coupon
 */
export async function addCoupon(data: CouponParams): Promise<{ id: number }> {
  return post<{ id: number }>('/api/marketing/coupon', data as unknown as Record<string, unknown>)
}

/**
 * 更新优惠券
 * API: PUT /api/marketing/coupon/{id}
 * 注意：如果后端使用 PUT 方法，需要在 request.ts 中导入 put
 */
export async function updateCoupon(id: number, data: CouponParams): Promise<void> {
  return post<void>(`/api/marketing/coupon/${id}`, data as unknown as Record<string, unknown>)
}

/**
 * 删除优惠券
 * API: DELETE /api/marketing/coupon/{id}
 */
export async function deleteCoupon(id: number): Promise<void> {
  return del<void>(`/api/marketing/coupon/${id}`)
}

/**
 * 批量删除优惠券
 * API: DELETE /api/marketing/coupon/batch
 */
export async function batchDeleteCoupon(ids: number[]): Promise<void> {
  return post<void>('/api/marketing/coupon/batch-delete', { ids })
}

/**
 * 更新优惠券状态（启用/禁用）
 * API: PATCH /api/marketing/coupon/{id}/status
 */
export async function updateCouponStatus(id: number, status: number): Promise<void> {
  return post<void>(`/api/marketing/coupon/${id}/status`, { status })
}
