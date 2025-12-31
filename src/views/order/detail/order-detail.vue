<script setup lang="ts">
/**
 * 订单详情页面
 * 负责人：成员 C
 * 功能：订单详情展示
 */
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RefreshRight, ArrowDown } from '@element-plus/icons-vue'
import { getOrderDetail, OrderStatus, updateAdminOrderStatus, AdminOrderAction } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'

type TagType = 'success' | 'info' | 'warning' | 'danger'

const route = useRoute()
const router = useRouter()

const orderSn = computed(() => route.params.id?.toString() || '')
const loading = ref(false)
const actionLoading = ref(false)
const order = ref<Order | null>(null)
const items = ref<OrderItem[]>([])
const shipDialogVisible = ref(false)
const shipForm = reactive({
  shippingMethod: '圆通',
  trackingNumber: '',
})

const shippingOptions = [
  { label: '圆通', value: '圆通', prefix: 'YT' },
  { label: '申通', value: '申通', prefix: 'ST' },
  { label: '中通', value: '中通', prefix: 'ZT' },
  { label: '韵达', value: '韵达', prefix: 'YD' },
  { label: '极兔', value: '极兔', prefix: 'JT' },
  { label: '顺丰', value: '顺丰', prefix: 'SF' },
  { label: '京东', value: '京东', prefix: 'JD' },
  { label: 'EMS', value: 'EMS', prefix: 'EMS' },
]

const statusMeta: Record<OrderStatus, { text: string; tag: TagType }> = {
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

const statusInfo = computed(() => resolveStatusMeta(order.value?.status))
const statusCode = computed(() => resolveStatusCode(order.value?.status))
const isPendingShipment = computed(() => statusCode.value === OrderStatus.PENDING_SHIPMENT)
const isRefunding = computed(() => statusCode.value === OrderStatus.REFUNDING)

const amountInfo = computed(() => {
  const o = order.value || {}
  return {
    total: o.totalAmount ?? 0,
    discount: o.discountAmount ?? 0,
    shipping: o.shippingFee ?? 0,
    pay: o.payAmount ?? 0,
  }
})

const addressText = computed(() => {
  const o = order.value
  if (!o) return '-'
  const segments = [o.receiverProvince, o.receiverCity, o.receiverDistrict, o.receiverDetail]
  const filled = segments.filter(Boolean).map((v) => String(v))
  return filled.length ? filled.join(' ') : '-'
})

onMounted(() => {
  fetchOrderDetail()
})

async function fetchOrderDetail() {
  if (!orderSn.value) return
  loading.value = true
  try {
    const { data } = await getOrderDetail(orderSn.value)
    order.value = data?.order || null
    items.value = data?.items || []
  } catch (error) {
    console.error('获取订单详情失败', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

function formatDateTime(value?: string | Date | null) {
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

function formatMoney(value?: number | null) {
  const num = Number(value ?? 0)
  return num.toFixed(2)
}

function formatSkuSpecs(specs?: Record<string, unknown>) {
  if (!specs) return '-'
  const entries = Object.entries(specs)
  if (!entries.length) return '-'
  return entries.map(([key, val]) => `${key}: ${val}`).join(' / ')
}

function resolveStatusMeta(status?: string | number | null) {
  if (status === undefined || status === null) return { text: '未知状态', tag: 'info' as TagType }

  const numeric = typeof status === 'string' ? Number(status) : status
  if (!Number.isNaN(numeric) && statusMeta[numeric as OrderStatus]) {
    return statusMeta[numeric as OrderStatus]
  }

  if (typeof status === 'string') {
    const trimmed = status.trim()
    const mapped = statusTextToCode[trimmed]
    if (mapped !== undefined) return statusMeta[mapped]
    return { text: trimmed, tag: 'info' as TagType }
  }

  return { text: '未知状态', tag: 'info' as TagType }
}

function resolveStatusCode(status?: string | number | null): OrderStatus | undefined {
  if (status === undefined || status === null) return undefined
  const numeric = typeof status === 'string' ? Number(status) : status
  if (!Number.isNaN(numeric) && statusMeta[numeric as OrderStatus]) {
    return numeric as OrderStatus
  }
  if (typeof status === 'string') {
    const trimmed = status.trim()
    const mapped = statusTextToCode[trimmed]
    return mapped
  }
  return undefined
}

async function handleShip() {
  if (!order.value?.orderSn) return
  shipForm.shippingMethod = shipForm.shippingMethod || shippingOptions[0].value
  shipForm.trackingNumber = shipForm.trackingNumber.trim()
  if (!shipForm.trackingNumber) {
    ElMessage.warning('请填写快递单号')
    return
  }
  actionLoading.value = true
  try {
    await updateAdminOrderStatus(order.value.orderSn, {
      action: AdminOrderAction.SHIP,
      shippingInfo: {
        shippingMethod: shipForm.shippingMethod,
        trackingNumber: shipForm.trackingNumber,
      },
    })
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrderDetail()
  } catch (error) {
    console.error('发货失败', error)
    ElMessage.error('发货失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleRefundAgree() {
  if (!order.value?.orderSn) return
  actionLoading.value = true
  try {
    await updateAdminOrderStatus(order.value.orderSn, {
      action: AdminOrderAction.REFUND,
    })
    ElMessage.success('已同意退款')
    fetchOrderDetail()
  } catch (error) {
    console.error('同意退款失败', error)
    ElMessage.error('同意退款失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleRefundReject() {
  if (!order.value?.orderSn) return
  actionLoading.value = true
  try {
    await updateAdminOrderStatus(order.value.orderSn, {
      action: AdminOrderAction.REJECT_REFUND,
    })
    ElMessage.success('已拒绝退款')
    fetchOrderDetail()
  } catch (error) {
    console.error('拒绝退款失败', error)
    ElMessage.error('拒绝退款失败')
  } finally {
    actionLoading.value = false
  }
}

function generateTrackingNumber(prefix: string) {
  const digitsLength = 10
  const digits = Array.from({ length: digitsLength }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${digits}`
}

function handleShippingMethodChange(value: string) {
  const option = shippingOptions.find((o) => o.value === value)
  const prefix = option?.prefix || 'KD'
  shipForm.trackingNumber = generateTrackingNumber(prefix)
}

function openShipDialog() {
  const option = shippingOptions.find((o) => o.value === shipForm.shippingMethod) || shippingOptions[0]
  shipForm.shippingMethod = option.value
  shipForm.trackingNumber = generateTrackingNumber(option.prefix)
  shipDialogVisible.value = true
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div>
        <div class="page-title">订单详情</div>
        <div class="page-subtitle">订单号：{{ orderSn }}</div>
      </div>
      <div class="page-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :icon="RefreshRight" @click="fetchOrderDetail">刷新</el-button>
        <el-button
          v-if="isPendingShipment"
          type="success"
          :loading="actionLoading"
          @click="openShipDialog"
        >
          发货
        </el-button>
        <el-dropdown v-if="isRefunding" :disabled="actionLoading">
          <el-button type="warning">
            退款处理
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleRefundAgree">允许退款</el-dropdown-item>
              <el-dropdown-item @click="handleRefundReject">拒绝退款</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-card shadow="never" class="info-card" v-loading="loading">
      <div class="section-header">
        <div class="section-title">基础信息</div>
      </div>
      <el-descriptions :column="3" :label-width="110" border size="small" class="descriptions descriptions--base">
        <el-descriptions-item label="订单号">{{ order?.orderSn ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['status-text', `status-text--${statusInfo.tag}`]">{{ statusInfo.text }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(order?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ order?.paymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(order?.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ formatDateTime(order?.shippingTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(order?.confirmTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(order?.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ order?.userId ?? '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" class="info-grid" v-loading="loading">
      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="info-card">
          <div class="section-header">
            <div class="section-title">收货信息</div>
          </div>
          <el-descriptions :column="1" :label-width="96" border size="small" class="descriptions descriptions--compact">
            <el-descriptions-item label="收货人">{{ order?.receiverName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ order?.receiverPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ addressText }}</el-descriptions-item>
            <el-descriptions-item label="买家留言">{{ order?.buyerRemark || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="info-card">
          <div class="section-header">
            <div class="section-title">配送与售后</div>
          </div>
          <el-descriptions :column="1" :label-width="96" border size="small" class="descriptions descriptions--compact">
            <el-descriptions-item label="配送方式">{{ order?.shippingMethod || '-' }}</el-descriptions-item>
            <el-descriptions-item label="快递单号">{{ order?.trackingNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="取消原因">{{ order?.cancelReason || '无' }}</el-descriptions-item>
            <el-descriptions-item label="退款原因">{{ order?.refundReason || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="info-card" v-loading="loading">
      <div class="section-header">
        <div class="section-title">金额信息</div>
      </div>
      <div class="amount-grid">
        <div class="amount-item">
          <div class="amount-label">商品总额</div>
          <div class="amount-value">¥ {{ formatMoney(amountInfo.total) }}</div>
        </div>
        <div class="amount-item">
          <div class="amount-label">优惠减免</div>
          <div class="amount-value highlight">- ¥ {{ formatMoney(amountInfo.discount) }}</div>
        </div>
        <div class="amount-item">
          <div class="amount-label">运费</div>
          <div class="amount-value">¥ {{ formatMoney(amountInfo.shipping) }}</div>
        </div>
        <div class="amount-item total">
          <div class="amount-label">实付金额</div>
          <div class="amount-value">¥ {{ formatMoney(amountInfo.pay) }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="info-card" v-loading="loading">
      <div class="section-header">
        <div class="section-title">商品明细</div>
        <div class="section-sub">共 {{ items.length }} 件</div>
      </div>
      <el-table :data="items" border stripe empty-text="暂无商品" class="item-table">
        <el-table-column prop="productName" label="商品" min-width="180" show-overflow-tooltip />
        <el-table-column label="规格" min-width="170">
          <template #default="{ row }">{{ formatSkuSpecs(row.skuSpecs) }}</template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="110">
          <template #default="{ row }">¥ {{ formatMoney(row.price) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" align="center" />
        <el-table-column prop="totalPrice" label="小计" width="130">
          <template #default="{ row }">¥ {{ formatMoney(row.totalPrice) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-if="!loading && !order" description="未找到相关订单" class="empty-block" />

    <el-dialog v-model="shipDialogVisible" title="发货" width="420px">
      <el-form label-width="90px">
        <el-form-item label="配送方式">
          <el-select v-model="shipForm.shippingMethod" placeholder="选择快递" @change="handleShippingMethodChange">
            <el-option
              v-for="opt in shippingOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input
            v-model="shipForm.trackingNumber"
            placeholder="系统自动生成"
            readonly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.order-detail-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.info-card {
  border-radius: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-sub {
  color: #909399;
  font-size: 13px;
}

.descriptions {
  --el-border-color: #ebeef5;
}

.descriptions--base :deep(.el-descriptions__content),
.descriptions--compact :deep(.el-descriptions__content) {
  white-space: normal;
  word-break: break-word;
}

.status-text {
  font-weight: 600;
}

.status-text--success {
  color: #67c23a;
}

.status-text--warning {
  color: #e6a23c;
}

.status-text--danger {
  color: #f56c6c;
}

.status-text--info {
  color: #909399;
}

.info-grid {
  width: 100%;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.amount-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbff;
}

.amount-item.total {
  background: linear-gradient(120deg, #f0f5ff, #f9fbff);
  border-color: #d9e4ff;
}

.amount-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 6px;
}

.amount-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.amount-value.highlight {
  color: #e6a23c;
}

.item-table {
  width: 100%;
}

.empty-block {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .amount-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>
