<script setup lang="ts">
/**
 * SKU 规格生成器组件
 * 功能：动态添加/删除操作系统、处理器、内存、存储、显卡规格，自动生成所有规格组合
 * 支持为每个组合设置库存和价格
 */
import { ref, computed, watch } from 'vue'
import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElTag,
  ElMessage,
  ElIcon,
  ElEmpty,
  ElCard,
  ElTooltip,
} from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

// ==================== 类型定义 ====================

interface SkuCombination {
  cpu: string
  ram: string
  storage: string
  gpu: string
  stock: number
  price: number
}

interface SkuSpec {
  cpus: string[]
  rams: string[]
  storages: string[]
  gpus: string[]
  combinations: SkuCombination[]
}

// ==================== Props & Emits ====================

interface Props {
  modelValue?: SkuSpec
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    cpus: [],
    rams: [],
    storages: [],
    gpus: [],
    combinations: [],
  }),
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: SkuSpec): void
  (e: 'change', value: SkuSpec): void
}>()

// ==================== 状态定义 ====================

const cpus = ref<string[]>([])
const rams = ref<string[]>([])
const storages = ref<string[]>([])
const gpus = ref<string[]>([])

const newCpu = ref('')
const newRam = ref('')
const newStorage = ref('')
const newGpu = ref('')

const skuTable = ref<SkuCombination[]>([])

const batchStock = ref<number | undefined>(undefined)
const batchPrice = ref<number | undefined>(undefined)

// ==================== 计算属性 ====================

const canGenerate = computed(() => {
  return cpus.value.length > 0 ||
         rams.value.length > 0 || storages.value.length > 0 || gpus.value.length > 0
})

const expectedCombinations = computed(() => {
  const c = cpus.value.length || 1
  const r = rams.value.length || 1
  const s = storages.value.length || 1
  const g = gpus.value.length || 1
  return c * r * s * g
})

const specSummary = computed(() => {
  const parts = []
  if (cpus.value.length > 0) parts.push(`${cpus.value.length} 种处理器`)
  if (rams.value.length > 0) parts.push(`${rams.value.length} 种内存`)
  if (storages.value.length > 0) parts.push(`${storages.value.length} 种存储`)
  if (gpus.value.length > 0) parts.push(`${gpus.value.length} 种显卡`)
  return parts.join(' × ')
})

// ==================== 监听器 ====================

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      cpus.value = [...(newVal.cpus || [])]
      rams.value = [...(newVal.rams || [])]
      storages.value = [...(newVal.storages || [])]
      gpus.value = [...(newVal.gpus || [])]
      skuTable.value = [...(newVal.combinations || [])]
    }
  },
  { immediate: true, deep: true }
)

// ==================== 通用操作 ====================

function addSpec(list: string[], value: string, name: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    ElMessage.warning(`请输入${name}`)
    return false
  }
  if (list.includes(trimmed)) {
    ElMessage.warning(`该${name}已存在`)
    return false
  }
  if (list.length >= 10) {
    ElMessage.warning(`最多添加 10 种${name}`)
    return false
  }
  list.push(trimmed)
  if (canGenerate.value) {
    generateCombinations()
  }
  return true
}

function removeSpec(list: string[], index: number, field: keyof SkuCombination) {
  const removed = list.splice(index, 1)[0]
  skuTable.value = skuTable.value.filter(item => item[field] !== removed)
  emitUpdate()
}

// ==================== 规格操作 ====================

function addCpu() {
  if (addSpec(cpus.value, newCpu.value, '处理器')) newCpu.value = ''
}
function removeCpu(index: number) {
  removeSpec(cpus.value, index, 'cpu')
}

function addRam() {
  if (addSpec(rams.value, newRam.value, '内存规格')) newRam.value = ''
}
function removeRam(index: number) {
  removeSpec(rams.value, index, 'ram')
}

function addStorage() {
  if (addSpec(storages.value, newStorage.value, '存储规格')) newStorage.value = ''
}
function removeStorage(index: number) {
  removeSpec(storages.value, index, 'storage')
}

function addGpu() {
  if (addSpec(gpus.value, newGpu.value, '显卡规格')) newGpu.value = ''
}
function removeGpu(index: number) {
  removeSpec(gpus.value, index, 'gpu')
}

// ==================== SKU 组合生成 ====================

function generateCombinations() {
  if (!canGenerate.value) {
    ElMessage.warning('请先添加至少一种规格')
    return
  }

  const existingData = new Map<string, { stock: number; price: number }>()
  skuTable.value.forEach(item => {
    const key = `${item.cpu}_${item.ram}_${item.storage}_${item.gpu}`
    existingData.set(key, { stock: item.stock, price: item.price })
  })

  const newCombinations: SkuCombination[] = []
  const cpuList = cpus.value.length > 0 ? cpus.value : ['']
  const ramList = rams.value.length > 0 ? rams.value : ['']
  const storageList = storages.value.length > 0 ? storages.value : ['']
  const gpuList = gpus.value.length > 0 ? gpus.value : ['']

  for (const cpu of cpuList) {
    for (const ram of ramList) {
      for (const storage of storageList) {
        for (const gpu of gpuList) {
          const key = `${cpu}_${ram}_${storage}_${gpu}`
          const existing = existingData.get(key)
          newCombinations.push({
            cpu,
            ram,
            storage,
            gpu,
            stock: existing?.stock ?? 0,
            price: existing?.price ?? 0,
          })
        }
      }
    }
  }

  skuTable.value = newCombinations
  emitUpdate()
  ElMessage.success(`已生成 ${newCombinations.length} 个规格组合`)
}

function clearCombinations() {
  skuTable.value = []
  emitUpdate()
}

// ==================== 表格操作 ====================

function updateCombination(index: number, field: 'stock' | 'price', value: number) {
  if (skuTable.value[index]) {
    skuTable.value[index][field] = value
    emitUpdate()
  }
}

function removeCombination(index: number) {
  skuTable.value.splice(index, 1)
  emitUpdate()
}

function handleBatchSetStock() {
  if (batchStock.value === undefined) {
    ElMessage.warning('请输入库存数量')
    return
  }
  skuTable.value.forEach(item => { item.stock = batchStock.value! })
  emitUpdate()
  ElMessage.success('批量设置库存成功')
}

function handleBatchSetPrice() {
  if (batchPrice.value === undefined) {
    ElMessage.warning('请输入价格')
    return
  }
  skuTable.value.forEach(item => { item.price = batchPrice.value! })
  emitUpdate()
  ElMessage.success('批量设置价格成功')
}

// ==================== 数据更新 ====================

function emitUpdate() {
  const data: SkuSpec = {
    cpus: [...cpus.value],
    rams: [...rams.value],
    storages: [...storages.value],
    gpus: [...gpus.value],
    combinations: [...skuTable.value],
  }
  emit('update:modelValue', data)
  emit('change', data)
}
</script>

<template>
  <div class="sku-generator">
    <!-- 规格配置区域 -->
    <div class="spec-config">
      <!-- 处理器配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">处理器</span>
            <span class="count">已添加 {{ cpus.length }} 个</span>
          </div>
        </template>
        <div class="spec-content">
          <div class="tag-list">
            <ElTag
              v-for="(cpu, index) in cpus"
              :key="cpu"
              type="info"
              closable
              :disabled="disabled"
              @close="removeCpu(index)"
            >{{ cpu }}</ElTag>
            <span v-if="cpus.length === 0" class="empty-tip">暂未添加处理器</span>
          </div>
          <div v-if="!disabled" class="add-input">
            <ElInput v-model="newCpu" placeholder="如：Ultra 9 275HX" size="small" @keyup.enter="addCpu">
              <template #append>
                <ElButton @click="addCpu"><ElIcon><Plus /></ElIcon>添加</ElButton>
              </template>
            </ElInput>
          </div>
        </div>
      </ElCard>

      <!-- 内存配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">内存容量</span>
            <span class="count">已添加 {{ rams.length }} 个</span>
          </div>
        </template>
        <div class="spec-content">
          <div class="tag-list">
            <ElTag
              v-for="(ram, index) in rams"
              :key="ram"
              type="success"
              closable
              :disabled="disabled"
              @close="removeRam(index)"
            >{{ ram }}</ElTag>
            <span v-if="rams.length === 0" class="empty-tip">暂未添加内存规格</span>
          </div>
          <div v-if="!disabled" class="add-input">
            <ElInput v-model="newRam" placeholder="如：16GB、32GB" size="small" @keyup.enter="addRam">
              <template #append>
                <ElButton @click="addRam"><ElIcon><Plus /></ElIcon>添加</ElButton>
              </template>
            </ElInput>
          </div>
        </div>
      </ElCard>

      <!-- 存储配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">存储容量</span>
            <span class="count">已添加 {{ storages.length }} 个</span>
          </div>
        </template>
        <div class="spec-content">
          <div class="tag-list">
            <ElTag
              v-for="(storage, index) in storages"
              :key="storage"
              type="warning"
              closable
              :disabled="disabled"
              @close="removeStorage(index)"
            >{{ storage }}</ElTag>
            <span v-if="storages.length === 0" class="empty-tip">暂未添加存储规格</span>
          </div>
          <div v-if="!disabled" class="add-input">
            <ElInput v-model="newStorage" placeholder="如：512GB SSD、1TB SSD" size="small" @keyup.enter="addStorage">
              <template #append>
                <ElButton @click="addStorage"><ElIcon><Plus /></ElIcon>添加</ElButton>
              </template>
            </ElInput>
          </div>
        </div>
      </ElCard>

      <!-- 显卡配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">显卡规格</span>
            <span class="count">已添加 {{ gpus.length }} 个</span>
          </div>
        </template>
        <div class="spec-content">
          <div class="tag-list">
            <ElTag
              v-for="(gpu, index) in gpus"
              :key="gpu"
              type="danger"
              closable
              :disabled="disabled"
              @close="removeGpu(index)"
            >{{ gpu }}</ElTag>
            <span v-if="gpus.length === 0" class="empty-tip">暂未添加显卡规格</span>
          </div>
          <div v-if="!disabled" class="add-input">
            <ElInput v-model="newGpu" placeholder="如：RTX 5060、RTX 5070" size="small" @keyup.enter="addGpu">
              <template #append>
                <ElButton @click="addGpu"><ElIcon><Plus /></ElIcon>添加</ElButton>
              </template>
            </ElInput>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 生成按钮区域 -->
    <div v-if="!disabled" class="generate-section">
      <div class="generate-info">
        <span v-if="canGenerate">
          将生成 <strong>{{ expectedCombinations }}</strong> 个规格组合
          （{{ specSummary }}）
        </span>
        <span v-else class="tip">请先添加至少一种规格</span>
      </div>
      <div class="generate-actions">
        <ElButton type="primary" :disabled="!canGenerate" @click="generateCombinations">
          <ElIcon><Plus /></ElIcon>生成规格组合
        </ElButton>
        <ElButton v-if="skuTable.length > 0" type="danger" plain @click="clearCombinations">
          <ElIcon><Delete /></ElIcon>清空组合
        </ElButton>
      </div>
    </div>

    <!-- SKU 组合表格 -->
    <div v-if="skuTable.length > 0" class="sku-table-section">
      <div class="table-header">
        <h4>规格组合明细</h4>
        <div v-if="!disabled" class="batch-actions">
          <div class="batch-item">
            <span>批量设置库存:</span>
            <ElInputNumber v-model="batchStock" :min="0" size="small" placeholder="库存" style="width: 100px" />
            <ElButton size="small" @click="handleBatchSetStock">应用</ElButton>
          </div>
          <div class="batch-item">
            <span>批量设置价格:</span>
            <ElInputNumber v-model="batchPrice" :min="0" :precision="2" size="small" placeholder="价格" style="width: 120px" />
            <ElButton size="small" @click="handleBatchSetPrice">应用</ElButton>
          </div>
        </div>
      </div>

      <ElTable :data="skuTable" border stripe>
        <ElTableColumn type="index" label="序号" width="60" align="center" />

        <ElTableColumn v-if="cpus.length > 0" prop="cpu" label="处理器" width="120" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.cpu" type="info">{{ row.cpu }}</ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="rams.length > 0" prop="ram" label="内存" width="100" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.ram" type="success">{{ row.ram }}</ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="storages.length > 0" prop="storage" label="存储" width="120" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.storage" type="warning">{{ row.storage }}</ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="gpus.length > 0" prop="gpu" label="显卡" width="120" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.gpu" type="danger">{{ row.gpu }}</ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="库存" width="150" align="center">
          <template #default="{ row, $index }">
            <ElInputNumber
              v-model="row.stock"
              :min="0"
              :disabled="disabled"
              size="small"
              controls-position="right"
              @change="(val: number | undefined) => updateCombination($index, 'stock', val ?? 0)"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn label="价格 (元)" width="180" align="center">
          <template #default="{ row, $index }">
            <ElInputNumber
              v-model="row.price"
              :min="0"
              :precision="2"
              :disabled="disabled"
              size="small"
              controls-position="right"
              @change="(val: number | undefined) => updateCombination($index, 'price', val ?? 0)"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="!disabled" label="操作" width="80" align="center" fixed="right">
          <template #default="{ $index }">
            <ElTooltip content="删除此组合" placement="top">
              <ElButton type="danger" link size="small" @click="removeCombination($index)">
                <ElIcon><Delete /></ElIcon>
              </ElButton>
            </ElTooltip>
          </template>
        </ElTableColumn>

        <template #empty>
          <ElEmpty description="暂无规格组合" />
        </template>
      </ElTable>

      <div class="table-footer">
        <span>共 <strong>{{ skuTable.length }}</strong> 个规格组合</span>
        <span>总库存: <strong>{{ skuTable.reduce((sum, item) => sum + item.stock, 0) }}</strong></span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <ElEmpty description="暂无规格组合，请先添加规格后生成" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sku-generator {
  width: 100%;
}

.spec-config {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.spec-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
    background: #f5f7fa;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
      font-size: 14px;
      color: #303133;
    }

    .count {
      font-size: 12px;
      color: #909399;
    }
  }

  .spec-content {
    padding: 8px 0;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 32px;
    margin-bottom: 12px;

    .empty-tip {
      font-size: 13px;
      color: #c0c4cc;
    }
  }

  .add-input {
    :deep(.el-input-group__append) {
      padding: 0;
      .el-button {
        border: none;
        margin: 0;
      }
    }
  }
}

.generate-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 20px;

  .generate-info {
    font-size: 14px;
    color: #606266;

    strong {
      color: #67c23a;
      font-size: 16px;
    }

    .tip {
      color: #909399;
    }
  }

  .generate-actions {
    display: flex;
    gap: 12px;
  }
}

.sku-table-section {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 12px;

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .batch-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .batch-item {
        display: flex;
        align-items: center;
        gap: 8px;

        span {
          font-size: 13px;
          color: #606266;
        }
      }
    }
  }

  .table-footer {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    margin-top: 12px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;

    span {
      font-size: 13px;
      color: #606266;

      strong {
        color: #409eff;
      }
    }
  }
}

.empty-state {
  padding: 40px 0;
  background: #fafafa;
  border-radius: 8px;
}
</style>
