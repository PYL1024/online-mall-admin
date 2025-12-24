<script setup lang="ts">
/**
 * 订单列表页面
 * 负责人：成员 C
 * 功能：多 Tab 切换、状态渲染、发货处理
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import type { AdminOrderListItem, GetAdminOrderListParams } from '@/api/order'
import { getAdminOrderList } from '@/api/order'

type OrderListFilters = GetAdminOrderListParams & {
  page: number
  pageSize: number
}

const router = useRouter()
const loading = ref(false)
const orders = ref<AdminOrderListItem[]>([])
const total = ref(0)

/*后续写正式代码时删掉mock代码 begin*/
const useMockData = true
const mockOrders: AdminOrderListItem[] = [
  {
    orderSn: 'MOCK2025001',
    totalAmount: 199.9,
    payAmount: 189.9,
    status: 1,
    statusText: '待发货',
    createdAt: '2025-12-20T10:15:00',
    itemCount: 2,
    userId: 10001,
    username: 'mock_user',
    receiverName: '张三',
    receiverPhone: '13800000001',
  },
  {
    orderSn: 'MOCK2025002',
    totalAmount: 459,
    payAmount: 449,
    status: 3,
    statusText: '已完成',
    createdAt: '2025-12-19T16:30:00',
    itemCount: 1,
    userId: 10002,
    username: 'alice',
    receiverName: '李四',
    receiverPhone: '13900000002',
  },
]

/*后续写正式代码时删掉mock代码 end*/

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
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '退款中', value: 4 },
  { label: '退款成功', value: 5 },
  { label: '退款失败', value: 6 },
  { label: '已取消', value: 9 },
]

const statusTagTypeMap: Record<number, 'info' | 'success' | 'warning' | 'danger'> = {
  0: 'warning',
  1: 'warning',
  2: 'info',
  3: 'success',
  4: 'danger',
  5: 'success',
  6: 'danger',
  9: 'info',
}

const statusFallbackText: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '退款中',
  5: '退款成功',
  6: '退款失败',
  9: '已取消',
}

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {

/*后续写正式代码时删掉mock代码 begin*/
    if (useMockData) {
      orders.value = mockOrders
      total.value = mockOrders.length
      loading.value = false
      return
    }
/*后续写正式代码时删掉mock代码 end*/


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
  } catch (error) {
    console.error('加载订单列表失败:', error)
    ElMessage.error('加载订单列表失败')
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
  filters.status = undefined
  filters.phone = ''
  filters.page = 1
  filters.pageSize = 10
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
  if (row.statusText) return row.statusText
  if (row.status !== undefined && statusFallbackText[row.status]) {
    return statusFallbackText[row.status]
  }
  return '未知状态'
}

function getStatusTagType(row: AdminOrderListItem) {
  if (row.status !== undefined && statusTagTypeMap[row.status]) {
    return statusTagTypeMap[row.status]
  }
  return 'info'
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
          <p class="sub-title">支持筛选、分页查看全部订单</p>
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
          <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 160px">
            <el-option
              v-for="option in statusOptions"
              :key="String(option.value ?? 'all')"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
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

        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="cell-main">{{ row.username || '未知用户' }}</div>
            <div class="cell-sub">ID: {{ row.userId ?? '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="收货人" min-width="180">
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

        <el-table-column prop="itemCount" label="商品数" width="100" align="center" />

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
  padding: 12px;
  background: #f6f7fb;
  border-radius: 8px;
  margin-bottom: 16px;
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
