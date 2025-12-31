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
import type { BaseResponse, Order, OrderItem } from './model/orderModel';
// 管理员订单管理API实现

// 订单状态枚举
export enum OrderStatus {
  PENDING_PAYMENT = 0,    // 待付款
  PENDING_SHIPMENT = 1,   // 待发货
  PENDING_RECEIPT = 2,    // 待收货
  COMPLETED = 3,          // 已完成
  CANCELLED = 4,          // 已取消
  REFUNDING = 5,          // 退款中
  REFUNDED = 6,           // 退款成功
  REFUND_FAILED = 7       // 退款失败
}

// 管理员订单列表项类型定义
export interface AdminOrderListItem {
  orderSn: string;           // 订单号
  totalAmount: number;       // 总金额
  payAmount: number;         // 实付金额
  status: string;            // 订单状态（字符串格式）
  createdAt: string;         // 创建时间
  itemCount: number;         // 产品种类数量
  userId: number;            // 用户ID
  receiverName: string;      // 收货人姓名
  receiverPhone: string;     // 收货人手机号
}

// 管理员订单列表响应数据类型
export interface AdminOrderListData {
  total: number;             // 总记录数
  page: number;              // 当前页码
  pageSize: number;          // 每页数量
  orders: AdminOrderListItem[]; // 订单列表
}

export interface AdminOrderListResponse extends BaseResponse<AdminOrderListData> {}

// 管理员订单操作类型枚举
export enum AdminOrderAction {
  SHIP = 1,              // 发货 - 订单状态从待发货到已发货
  REFUND = 2,            // 退款 - 订单状态从申请退款到已退款
  REJECT_REFUND = 3      // 拒绝退款 - 订单状态从待退款拒绝退款
}

// 发货信息类型定义
export interface ShippingInfo {
  shippingMethod: string;     // 配送方式
  trackingNumber: string;     // 快递单号
}

// 管理员更新订单状态请求参数类型定义
export interface UpdateAdminOrderStatusRequest {
  action: AdminOrderAction;   // 操作类型
  shippingInfo?: ShippingInfo; // 发货信息（发货时需要）
  reason?: string;            // 操作原因
}

// 管理员订单查询参数类型定义
export interface GetAdminOrderListParams {
  page?: number;              // 页码，默认为1
  pageSize?: number;          // 每页数量，默认为20
  orderSn?: string;           // 订单号搜索
  userId?: number;            // 用户ID筛选
  status?: OrderStatus;       // 状态筛选 (0待付款，1待发货，2待收货，3已完成，4已取消，5退款中，6退款成功，7退款失败)
  phone?: string;             // 收货人手机号搜索
}



// 订单详情响应数据类型
export interface OrderDetailData {
  order: Order;           // 订单详情
  items: OrderItem[];     // 订单中的商品列表
}





/**
 * 管理员获取订单列表API
 * 管理员分页查询所有订单
 * 
 * @param params - 查询参数
 * @returns 订单列表
 */
export async function getAdminOrderList(params?: GetAdminOrderListParams): Promise<AdminOrderListResponse> {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.orderSn) queryParams.append('orderSn', params.orderSn);
  if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString());
  if (params?.status !== undefined) queryParams.append('status', params.status.toString());
  if (params?.phone) queryParams.append('phone', params.phone);

  const queryString = queryParams.toString();
  const url = `/api/admin/orders${queryString ? '?' + queryString : ''}`;
  //const token= localStorage.getItem('token');
  const token='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOSIsInJvbGUiOjIsImlhdCI6MTc2NTkzNDIzNSwiZXhwIjo0NzE3OTM0MjM1fQ.8k2ps1_BU2-Zpjr8XsR-zs9z6hPA-8fv6S5-sN3FLqRBFFkBif4EuUt1tnWL6lDA08nLIswecX10yyH7MOkd_Q';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch {
      // 如果无法解析错误响应，则使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }

  const result: AdminOrderListResponse = await response.json();
  return result;
}

/**
 * 管理员更新订单状态API
 * 管理员更新订单状态（发货、退款等）
 * 
 * @param orderSn - 订单号
 * @param params - 更新订单状态的参数
 * @returns 更新结果
 */
export async function updateAdminOrderStatus(orderSn: string, params: UpdateAdminOrderStatusRequest): Promise<BaseResponse<null>> {
   //const token= localStorage.getItem('token');
  const token='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOSIsInJvbGUiOjIsImlhdCI6MTc2NTkzNDIzNSwiZXhwIjo0NzE3OTM0MjM1fQ.8k2ps1_BU2-Zpjr8XsR-zs9z6hPA-8fv6S5-sN3FLqRBFFkBif4EuUt1tnWL6lDA08nLIswecX10yyH7MOkd_Q';
  const response = await fetch(`/api/admin/orders/${orderSn}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      action: params.action,
      shippingInfo: params.shippingInfo,
      reason: params.reason
    })
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch {
      // 如果无法解析错误响应，则使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }

  const result: BaseResponse<null> = await response.json();
  return result;
}

/**
 * 获取订单详情API
 * @param orderSn - 订单号
 * @returns 订单详情
 */
export async function getOrderDetail(orderSn: number | string): Promise<BaseResponse<OrderDetailData>> {
  //const token= localStorage.getItem('token');
  const token='eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOSIsInJvbGUiOjIsImlhdCI6MTc2NTkzNDIzNSwiZXhwIjo0NzE3OTM0MjM1fQ.8k2ps1_BU2-Zpjr8XsR-zs9z6hPA-8fv6S5-sN3FLqRBFFkBif4EuUt1tnWL6lDA08nLIswecX10yyH7MOkd_Q';
  const response = await fetch(`/api/admin/orders/${orderSn}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  
    }
  });

  if (!response.ok) {
    // 根据不同的HTTP状态码抛出相应的错误
    const errorResponse = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorObj = JSON.parse(errorResponse);
      errorMessage = errorObj.message || errorMessage;
    } catch {
      // 如果无法解析错误响应，则使用默认错误消息
    }

    throw new Error(errorMessage);
  }

  const result: BaseResponse<OrderDetailData> = await response.json();
  return result;
}
