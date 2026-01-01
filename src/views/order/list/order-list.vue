<script setup lang="ts">
/**
 * 订单列表页面
 * 负责人：成员 C
 * 功能：多 Tab 切换、状态渲染、发货处理
 */
import { onMounted, reactive, ref, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { getAdminOrderList, OrderStatus } from '@/api/order'
import type { AdminOrderListItem, GetAdminOrderListParams } from '@/api/order'

type OrderListFilters = GetAdminOrderListParams & {
  page: number
  pageSize: number
}

const router = useRouter()
const loading = ref(false)
const orders = ref<AdminOrderListItem[]>([])
const total = ref(0)

const FILTER_STORAGE_KEY = 'admin-order-list-filters'

const filters = reactive<OrderListFilters>({
  page: 1,
  pageSize: 20,
  orderSn: '',
  userId: undefined,
  status: undefined,
  phone: '',
})

const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '待付款', value: OrderStatus.PENDING_PAYMENT },
  { label: '待发货', value: OrderStatus.PENDING_SHIPMENT },
  { label: '待收货', value: OrderStatus.PENDING_RECEIPT },
  { label: '已完成', value: OrderStatus.COMPLETED },
  { label: '已取消', value: OrderStatus.CANCELLED },
  { label: '退款中', value: OrderStatus.REFUNDING },
  { label: '退款成功', value: OrderStatus.REFUNDED },
  { label: '退款失败', value: OrderStatus.REFUND_FAILED },
]

type StatusTag = 'info' | 'success' | 'warning' | 'danger'

const statusMeta: Record<OrderStatus, { text: string; tag: StatusTag }> = {
  [OrderStatus.PENDING_PAYMENT]: { text: '待付款', tag: 'warning' },
  [OrderStatus.PENDING_SHIPMENT]: { text: '待发货', tag: 'warning' },
  [OrderStatus.PENDING_RECEIPT]: { text: '待收货', tag: 'info' },
  [OrderStatus.COMPLETED]: { text: '已完成', tag: 'success' },
  [OrderStatus.CANCELLED]: { text: '已取消', tag: 'info' },
  [OrderStatus.REFUNDING]: { text: '退款中', tag: 'warning' },
  [OrderStatus.REFUNDED]: { text: '退款成功', tag: 'success' },
  [OrderStatus.REFUND_FAILED]: { text: '退款失败', tag: 'danger' },
}

const statusTextToCode: Record<string, OrderStatus> = {
  待付款: OrderStatus.PENDING_PAYMENT,
  待发货: OrderStatus.PENDING_SHIPMENT,
  待收货: OrderStatus.PENDING_RECEIPT,
  已完成: OrderStatus.COMPLETED,
  已取消: OrderStatus.CANCELLED,
  退款中: OrderStatus.REFUNDING,
  退款成功: OrderStatus.REFUNDED,
  退款失败: OrderStatus.REFUND_FAILED,
  PENDING_PAYMENT: OrderStatus.PENDING_PAYMENT,
  PENDING_SHIPMENT: OrderStatus.PENDING_SHIPMENT,
  PENDING_RECEIPT: OrderStatus.PENDING_RECEIPT,
  COMPLETED: OrderStatus.COMPLETED,
  CANCELLED: OrderStatus.CANCELLED,
  REFUNDING: OrderStatus.REFUNDING,
  REFUNDED: OrderStatus.REFUNDED,
  REFUND_FAILED: OrderStatus.REFUND_FAILED,
}

onMounted(() => {
  restoreFilters()
  loadOrders()
})

onBeforeRouteLeave(() => {
  persistFilters()
})

onBeforeUnmount(() => {
  persistFilters()
})

async function loadOrders() {
  loading.value = true
  try {
    const params: GetAdminOrderListParams = {
      page: filters.page,
      pageSize: filters.pageSize,
      orderSn: filters.orderSn?.trim() || undefined,
      userId: filters.userId,
      status: filters.status,
      phone: filters.phone?.trim() || undefined,
    }

    const res = await getAdminOrderList(params)
    orders.value = res.data?.orders || []
    total.value = res.data?.total || 0
    filters.page = res.data?.page || filters.page
    filters.pageSize = res.data?.pageSize || filters.pageSize
    persistFilters()
  } catch (error) {
    console.error('加载订单列表失败:', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

function persistFilters() {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ ...filters }))
  } catch (error) {
    console.warn('保存订单筛选条件失败', error)
  }
}

function restoreFilters() {
  const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
  if (!raw) return
  try {
    const saved = JSON.parse(raw) as Partial<OrderListFilters>
    filters.page = saved.page ?? filters.page
    filters.pageSize = saved.pageSize ?? filters.pageSize
    filters.orderSn = saved.orderSn ?? filters.orderSn
    filters.userId = saved.userId ?? filters.userId
    filters.phone = saved.phone ?? filters.phone
    if (saved.status !== undefined) {
      const statusNumber = typeof saved.status === 'string' ? Number(saved.status) : saved.status
      filters.status = (Number.isNaN(statusNumber) ? undefined : (statusNumber as OrderStatus)) ?? filters.status
    }
  } catch (error) {
    console.warn('恢复订单筛选条件失败', error)
  }
}

function handleSearch() {
  filters.page = 1
  loadOrders()
}

function handleReset() {
  filters.orderSn = ''
  filters.userId = undefined
  filters.status = undefined
  filters.phone = ''
  filters.page = 1
  filters.pageSize = 20
  loadOrders()
}

function handlePageChange(page: number) {
  filters.page = page
  loadOrders()
}

function handleSizeChange(size: number) {
  filters.pageSize = size
  filters.page = 1
  loadOrders()
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function getStatusText(row: AdminOrderListItem) {
  const statusText = (row as AdminOrderListItem & { statusText?: string }).statusText
  if (statusText) return statusText
  return resolveStatusMeta(row.status).text
}

function getStatusTagType(row: AdminOrderListItem) {
  return resolveStatusMeta(row.status).tag
}

function resolveStatusMeta(status?: string | number) {
  if (status === undefined || status === null) return { text: '未知状态', tag: 'info' as StatusTag }

  const numericStatus = typeof status === 'string' ? Number(status) : status
  if (!Number.isNaN(numericStatus) && statusMeta[numericStatus as OrderStatus]) {
    return statusMeta[numericStatus as OrderStatus]
  }

  if (typeof status === 'string') {
    const trimmed = status.trim()
    const mappedCode = statusTextToCode[trimmed]
    if (mappedCode !== undefined) {
      return statusMeta[mappedCode]
    }
    return { text: trimmed, tag: 'info' as StatusTag }
  }

  return { text: '未知状态', tag: 'info' as StatusTag }
}

function handleViewDetail(orderSn: string) {
  router.push(`/order/detail/${orderSn}`)
}
</script>

<template>
  <div class="order-list-page">
    <el-card shadow="never" class="order-card">
      <div class="card-header">
        <div>
          <h2 class="title">订单列表</h2>
          <p class="sub-title">支持筛选、分页查看全部订单(如需单独查看售后，请查看售后订单列表)</p>
        </div>
        <div class="header-actions">
          <el-button :icon="RefreshRight" @click="loadOrders">刷新</el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filters" label-width="80px" class="filter-form">
        <el-form-item label="订单号">
          <el-input
            v-model="filters.orderSn"
            placeholder="输入订单号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input
            v-model.number="filters.userId"
            placeholder="输入用户ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="收货人手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 140px">
            <el-option
              v-for="option in statusOptions"
              :key="String(option.value ?? 'all')"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>

      </el-form>

      <el-table
        v-loading="loading"
        :data="orders"
        border
        stripe
        class="order-table"
        header-row-class-name="order-table__header"
      >
        <el-table-column prop="orderSn" label="订单号" min-width="160" show-overflow-tooltip />

        <el-table-column label="用户ID" min-width="180" align="center">
          <template #default="{ row }">
            <div class="cell-main">{{ row.userId ?? '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="收货人" min-width="160">
          <template #default="{ row }">
            <div class="cell-main">{{ row.receiverName || '-' }}</div>
            <div class="cell-sub">{{ row.receiverPhone || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="金额" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">实付 ¥{{ Number(row.payAmount ?? 0).toFixed(2) }}</div>
            <div class="cell-sub">总额 ¥{{ Number(row.totalAmount ?? 0).toFixed(2) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="商品数" min-width="100" align="center">
          <template #default="{ row }">
            <div class="cell-main">{{row.itemCount ?? '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row)" effect="light">{{ getStatusText(row) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="下单时间" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">{{ formatDateTime(row.createdAt) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row.orderSn)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.order-list-page {
  padding: 20px;
}

.order-card {
  border-radius: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.sub-title {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-form {
  padding: 10px 12px;
  background: #f6f7fb;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-table {
  width: 100%;
}

.order-table__header {
  background: #f5f7fa;
}

.cell-main {
  color: #303133;
}

.cell-sub {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
