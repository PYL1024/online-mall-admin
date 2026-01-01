<script setup lang="ts">
import { onMounted, reactive, ref, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { getAdminOrderList, OrderStatus } from '@/api/order'
import type { AdminOrderListItem, GetAdminOrderListParams } from '@/api/order'

type AftersaleFilters = GetAdminOrderListParams & {
  page: number
  pageSize: number
}

const router = useRouter()
const loading = ref(false)
const orders = ref<AdminOrderListItem[]>([])
const total = ref(0)
const FILTER_STORAGE_KEY = 'admin-aftersale-filters'

const filters = reactive<AftersaleFilters>({
  page: 1,
  pageSize: 20,
  orderSn: '',
  userId: undefined,
  phone: '',
  status: OrderStatus.REFUNDING,
})

const statusOptions = [
  { label: '退款中', value: OrderStatus.REFUNDING },
  { label: '退款成功', value: OrderStatus.REFUNDED },
  { label: '退款失败', value: OrderStatus.REFUND_FAILED },
]

type StatusTag = 'info' | 'success' | 'warning' | 'danger'

const statusMeta: Partial<Record<OrderStatus, { text: string; tag: StatusTag }>> = {
  [OrderStatus.REFUNDING]: { text: '退款中', tag: 'warning' },
  [OrderStatus.REFUNDED]: { text: '退款成功', tag: 'success' },
  [OrderStatus.REFUND_FAILED]: { text: '退款失败', tag: 'danger' },
}

const statusTextToCode: Record<string, OrderStatus> = {
  退款中: OrderStatus.REFUNDING,
  退款成功: OrderStatus.REFUNDED,
  退款失败: OrderStatus.REFUND_FAILED,
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
      phone: filters.phone?.trim() || undefined,
      status: filters.status,
    }

    const res = await getAdminOrderList(params)
    orders.value = res.data?.orders || []
    total.value = res.data?.total || 0
    filters.page = res.data?.page ?? filters.page
    filters.pageSize = res.data?.pageSize ?? filters.pageSize
  } catch (error) {
    console.error('加载售后订单失败:', error)
    ElMessage.error('加载售后订单失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  loadOrders()
}

function handleReset() {
  filters.orderSn = ''
  filters.userId = undefined
  filters.phone = ''
  filters.status = OrderStatus.REFUNDING
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

function formatDateTime(value?: string | number | Date | null) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function resolveStatusCode(status?: string | number | null): OrderStatus | undefined {
  if (status === undefined || status === null) return undefined
  const numeric = typeof status === 'string' ? Number(status) : status
  if (!Number.isNaN(numeric) && statusMeta[numeric as OrderStatus]) {
    return numeric as OrderStatus
  }
  if (typeof status === 'string') {
    const mapped = statusTextToCode[status.trim()]
    return mapped
  }
  return undefined
}

function getStatusMeta(status?: string | number) {
  const code = resolveStatusCode(status)
  if (code !== undefined && statusMeta[code]) return statusMeta[code]
  return { text: '未知状态', tag: 'info' as StatusTag }
}

function persistFilters() {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ ...filters }))
  } catch (error) {
    console.warn('保存售后筛选条件失败', error)
  }
}

function restoreFilters() {
  const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
  if (!raw) return
  try {
    const saved = JSON.parse(raw) as Partial<AftersaleFilters>
    filters.page = saved.page ?? filters.page
    filters.pageSize = saved.pageSize ?? filters.pageSize
    filters.orderSn = saved.orderSn ?? filters.orderSn
    filters.userId = saved.userId ?? filters.userId
    filters.phone = saved.phone ?? filters.phone
    if (saved.status !== undefined) {
      const statusNumber = typeof saved.status === 'string' ? Number(saved.status) : saved.status
      filters.status = (Number.isNaN(statusNumber) ? filters.status : (statusNumber as OrderStatus)) ?? filters.status
    }
  } catch (error) {
    console.warn('恢复售后筛选条件失败', error)
  }
}

function handleViewDetail(orderSn: string) {
  router.push(`/order/detail/${orderSn}`)
}
</script>

<template>
  <div class="aftersale-page">
    <el-card shadow="never" class="order-card">
      <div class="card-header">
        <div>
          <h2 class="title">售后订单</h2>
          <p class="sub-title">仅显示退款相关订单（退款中/成功/失败）</p>
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
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input
            v-model.number="filters.userId"
            placeholder="输入用户ID"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="收货人手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="退款中" style="width: 140px">
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

        <el-table-column label="用户ID" min-width="120" align="center">
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

        <el-table-column label="金额" min-width="160">
          <template #default="{ row }">
            <div class="cell-main">实付 ¥{{ Number(row.payAmount ?? 0).toFixed(2) }}</div>
            <div class="cell-sub">总额 ¥{{ Number(row.totalAmount ?? 0).toFixed(2) }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="itemCount" label="商品数" width="90" align="center" />

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.status).tag" effect="light">
              {{ getStatusMeta(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="下单时间" min-width="170">
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
.aftersale-page {
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
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
