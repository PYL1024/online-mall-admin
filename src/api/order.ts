//后台应该需要实现的API：

// 订单列表页
// 1.查询所有用户的订单
// 2.订单筛选查询（全部/待发货/退款中...）
// 3.处理发货，修改订单状态（待发货/待收货，增加快递单号，发货时间，配送方式，更新时间等信息）
// 4.查询某个用户的所有订单
// 5.查询某个订单的详细信息

// （售后页）
// 1.查询所有状态为售后状态（退款中/退款成功/退款失败）的订单
// 2.售后筛选查询（退款中/退款成功/退款失败）
// 3.处理售后，修改订单状态（退款中/退款成功/退款失败）
// 4.查询某个用户的所有售后订单
// 5.查询某个订单的详细信息

//发货弹窗（快递单号验证）

// 导入现有的模型
import type { BaseResponse, Order, OrderItem } from './model/orderModel'
import { get, patch } from '@/utils/request'
// 管理员订单管理API实现

// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = 0, // 待付款
  PENDING_SHIPMENT = 1, // 待发货
  PENDING_RECEIPT = 2, // 待收货
  COMPLETED = 3, // 已完成
  CANCELLED = 4, // 已取消
  REFUNDING = 5, // 退款中
  REFUNDED = 6, // 退款成功
  REFUND_FAILED = 7, // 退款失败
}

// 管理员订单列表项类型定义
export interface AdminOrderListItem {
  orderSn: string // 订单号
  totalAmount: number // 总金额
  payAmount: number // 实付金额
  status: string // 订单状态（字符串格式）
  createdAt: string // 创建时间
  itemCount: number // 产品种类数量
  userId: number // 用户ID
  receiverName: string // 收货人姓名
  receiverPhone: string // 收货人手机号
}

// 管理员订单列表响应数据类型
export interface AdminOrderListData {
  total: number // 总记录数
  page: number // 当前页码
  pageSize: number // 每页数量
  orders: AdminOrderListItem[] // 订单列表
}

export type AdminOrderListResponse = BaseResponse<AdminOrderListData>

// 管理员订单操作类型枚举
export enum AdminOrderAction {
  SHIP = 1, // 发货 - 订单状态从待发货到已发货
  REFUND = 2, // 退款 - 订单状态从申请退款到已退款
  REJECT_REFUND = 3, // 拒绝退款 - 订单状态从待退款拒绝退款
}

// 发货信息类型定义
export interface ShippingInfo {
  shippingMethod: string // 配送方式
  trackingNumber: string // 快递单号
}

// 管理员更新订单状态请求参数类型定义
export interface UpdateAdminOrderStatusRequest {
  action: AdminOrderAction // 操作类型
  shippingInfo?: ShippingInfo // 发货信息（发货时需要）
  reason?: string // 操作原因
}

// 管理员订单查询参数类型定义
export interface GetAdminOrderListParams {
  page?: number // 页码，默认为1
  pageSize?: number // 每页数量，默认为20
  orderSn?: string // 订单号搜索
  userId?: number // 用户ID筛选
  status?: OrderStatus // 状态筛选 (0待付款，1待发货，2待收货，3已完成，4已取消，5退款中，6退款成功，7退款失败)
  phone?: string // 收货人手机号搜索
}

// 订单详情响应数据类型
export interface OrderDetailData {
  order: Order // 订单详情
  items: OrderItem[] // 订单中的商品列表
}

/**
 * 管理员获取订单列表API
 * 管理员分页查询所有订单
 *
 * @param params - 查询参数
 * @returns 订单列表
 */
export async function getAdminOrderList(
  params?: GetAdminOrderListParams,
): Promise<AdminOrderListResponse> {
  const data = await get<AdminOrderListData>(
    '/api/admin/orders',
    params as unknown as Record<string, unknown>,
  )
  return {
    status: 200,
    message: 'success',
    data,
  }
}

/**
 * 管理员更新订单状态API
 * 管理员更新订单状态（发货、退款等）
 *
 * @param orderSn - 订单号
 * @param params - 更新订单状态的参数
 * @returns 更新结果
 */
export async function updateAdminOrderStatus(
  orderSn: string,
  params: UpdateAdminOrderStatusRequest,
): Promise<BaseResponse<null>> {
  await patch<null>(`/api/admin/orders/${orderSn}/status`, {
    action: params.action,
    shippingInfo: params.shippingInfo,
    reason: params.reason,
  } as unknown as Record<string, unknown>)
  return {
    status: 200,
    message: 'success',
    data: null,
  }
}

/**
 * 获取订单详情API
 * @param orderSn - 订单号
 * @returns 订单详情
 */
export async function getOrderDetail(
  orderSn: number | string,
): Promise<BaseResponse<OrderDetailData>> {
  const data = await get<OrderDetailData>(`/api/admin/orders/${orderSn}`)
  return {
    status: 200,
    message: 'success',
    data,
  }
}

// ==================== 订单统计 API ====================

/**
 * 订单状态分布数据结构
 */
export interface OrderStatusDistribution {
  pending: number // 待付款
  paid: number // 待发货
  shipped: number // 待收货
  completed: number // 已完成
  cancelled: number // 已取消
  refunding: number // 退款中
}

/**
 * 订单趋势数据（近7天）
 */
export interface OrderTrendItem {
  date: string // 日期 YYYY-MM-DD
  orderCount: number // 订单数
  orderAmount: number // 订单金额
}

/**
 * 订单统计数据结构
 */
export interface OrderStatisticsData {
  totalOrders: number // 订单总数
  todayOrders: number // 今日订单
  monthOrders: number // 本月订单
  totalAmount: number // 累计销售额
  todayAmount: number // 今日销售额
  monthAmount: number // 本月销售额
  pendingShipment: number // 待发货订单
  refundingOrders: number // 退款中订单
  statusDistribution: OrderStatusDistribution // 订单状态分布
  weeklyTrend: OrderTrendItem[] // 近7天趋势
}

// 模拟开关
const USE_ORDER_MOCK = true

/**
 * 获取订单统计数据
 * API: GET /api/admin/orders/statistics
 */
export function getOrderStatistics(): Promise<OrderStatisticsData> {
  if (USE_ORDER_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 生成近7天的日期
        const weeklyTrend: OrderTrendItem[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          weeklyTrend.push({
            date: date.toISOString().split('T')[0] ?? '',
            orderCount: Math.floor(Math.random() * 50) + 20,
            orderAmount: Math.floor(Math.random() * 50000) + 10000,
          })
        }

        resolve({
          totalOrders: 12580,
          todayOrders: 86,
          monthOrders: 1560,
          totalAmount: 2568900,
          todayAmount: 35680,
          monthAmount: 458900,
          pendingShipment: 45,
          refundingOrders: 12,
          statusDistribution: {
            pending: 120,
            paid: 45,
            shipped: 230,
            completed: 11800,
            cancelled: 350,
            refunding: 35,
          },
          weeklyTrend,
        })
      }, 500)
    })
  }
  // 真实API调用
  // return get<OrderStatisticsData>('/api/admin/orders/statistics')
  return Promise.reject('API not implemented')
}
