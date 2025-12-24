<script setup lang="ts">
/**
 * SKU 规格生成器组件
 * 功能：动态添加/删除颜色和内存规格，自动生成所有规格组合
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

/**
 * SKU组合项
 */
interface SkuCombination {
  color: string
  memory: string
  stock: number
  price: number
}

/**
 * SKU规格数据结构
 */
interface SkuSpec {
  colors: string[]
  memories: string[]
  combinations: SkuCombination[]
}

// ==================== Props & Emits ====================

interface Props {
  modelValue?: SkuSpec
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    colors: [],
    memories: [],
    combinations: [],
  }),
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: SkuSpec): void
  (e: 'change', value: SkuSpec): void
}>()

// ==================== 状态定义 ====================

// 颜色列表
const colors = ref<string[]>([])

// 内存列表
const memories = ref<string[]>([])

// 新增输入框
const newColor = ref('')
const newMemory = ref('')

// SKU组合表格数据
const skuTable = ref<SkuCombination[]>([])

// ==================== 计算属性 ====================

/**
 * 是否有规格可生成
 */
const canGenerate = computed(() => {
  return colors.value.length > 0 && memories.value.length > 0
})

/**
 * 预计生成组合数量
 */
const expectedCombinations = computed(() => {
  return colors.value.length * memories.value.length
})

// ==================== 监听器 ====================

// 初始化数据（从外部值）
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      colors.value = [...(newVal.colors || [])]
      memories.value = [...(newVal.memories || [])]
      skuTable.value = [...(newVal.combinations || [])]
    }
  },
  { immediate: true, deep: true }
)

// ==================== 颜色操作 ====================

/**
 * 添加颜色
 */
function addColor() {
  const color = newColor.value.trim()

  if (!color) {
    ElMessage.warning('请输入颜色名称')
    return
  }

  if (colors.value.includes(color)) {
    ElMessage.warning('该颜色已存在')
    return
  }

  if (colors.value.length >= 10) {
    ElMessage.warning('最多添加 10 种颜色')
    return
  }

  colors.value.push(color)
  newColor.value = ''

  // 自动重新生成组合
  if (canGenerate.value) {
    generateCombinations()
  }
}

/**
 * 删除颜色
 */
function removeColor(index: number) {
  const removed = colors.value.splice(index, 1)[0]

  // 同时删除相关的 SKU 组合
  skuTable.value = skuTable.value.filter(item => item.color !== removed)

  emitUpdate()
}

// ==================== 内存操作 ====================

/**
 * 添加内存
 */
function addMemory() {
  const memory = newMemory.value.trim()

  if (!memory) {
    ElMessage.warning('请输入内存规格')
    return
  }

  if (memories.value.includes(memory)) {
    ElMessage.warning('该内存规格已存在')
    return
  }

  if (memories.value.length >= 10) {
    ElMessage.warning('最多添加 10 种内存规格')
    return
  }

  memories.value.push(memory)
  newMemory.value = ''

  // 自动重新生成组合
  if (canGenerate.value) {
    generateCombinations()
  }
}

/**
 * 删除内存
 */
function removeMemory(index: number) {
  const removed = memories.value.splice(index, 1)[0]

  // 同时删除相关的 SKU 组合
  skuTable.value = skuTable.value.filter(item => item.memory !== removed)

  emitUpdate()
}

// ==================== SKU 组合生成 ====================

/**
 * 生成所有规格组合（笛卡尔积算法）
 *
 * 算法思路：
 * 1. 遍历所有颜色
 * 2. 对每个颜色遍历所有内存
 * 3. 生成 color × memory 的笛卡尔积
 * 4. 保留已有组合的库存和价格数据
 */
function generateCombinations() {
  if (!canGenerate.value) {
    ElMessage.warning('请先添加颜色和内存规格')
    return
  }

  // 保存现有组合数据，用于保留已填写的库存和价格
  const existingData = new Map<string, { stock: number; price: number }>()
  skuTable.value.forEach(item => {
    const key = `${item.color}_${item.memory}`
    existingData.set(key, { stock: item.stock, price: item.price })
  })

  // 生成新的组合（笛卡尔积）
  const newCombinations: SkuCombination[] = []

  // 双重循环生成所有组合
  for (const color of colors.value) {
    for (const memory of memories.value) {
      const key = `${color}_${memory}`

      // 优先使用已有数据，否则使用默认值
      const existing = existingData.get(key)

      newCombinations.push({
        color,
        memory,
        stock: existing?.stock ?? 0,
        price: existing?.price ?? 0,
      })
    }
  }

  skuTable.value = newCombinations

  emitUpdate()
  ElMessage.success(`已生成 ${newCombinations.length} 个规格组合`)
}

/**
 * 清空所有组合
 */
function clearCombinations() {
  skuTable.value = []
  emitUpdate()
}

// ==================== 表格操作 ====================

/**
 * 更新组合数据
 */
function updateCombination(index: number, field: 'stock' | 'price', value: number) {
  if (skuTable.value[index]) {
    skuTable.value[index][field] = value
    emitUpdate()
  }
}

/**
 * 删除单个组合
 */
function removeCombination(index: number) {
  skuTable.value.splice(index, 1)
  emitUpdate()
}

/**
 * 批量设置库存
 */
function batchSetStock(stock: number) {
  skuTable.value.forEach(item => {
    item.stock = stock
  })
  emitUpdate()
  ElMessage.success('批量设置库存成功')
}

/**
 * 批量设置价格
 */
function batchSetPrice(price: number) {
  skuTable.value.forEach(item => {
    item.price = price
  })
  emitUpdate()
  ElMessage.success('批量设置价格成功')
}

// ==================== 数据更新 ====================

/**
 * 触发数据更新
 */
function emitUpdate() {
  const data: SkuSpec = {
    colors: [...colors.value],
    memories: [...memories.value],
    combinations: [...skuTable.value],
  }

  emit('update:modelValue', data)
  emit('change', data)
}

// ==================== 批量设置状态 ====================

const batchStock = ref<number | undefined>(undefined)
const batchPrice = ref<number | undefined>(undefined)

function handleBatchSetStock() {
  if (batchStock.value === undefined) {
    ElMessage.warning('请输入库存数量')
    return
  }
  batchSetStock(batchStock.value)
}

function handleBatchSetPrice() {
  if (batchPrice.value === undefined) {
    ElMessage.warning('请输入价格')
    return
  }
  batchSetPrice(batchPrice.value)
}
</script>

<template>
  <div class="sku-generator">
    <!-- 规格配置区域 -->
    <div class="spec-config">
      <!-- 颜色配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">颜色规格</span>
            <span class="count">已添加 {{ colors.length }} 个</span>
          </div>
        </template>

        <div class="spec-content">
          <!-- 已添加的颜色标签 -->
          <div class="tag-list">
            <ElTag
              v-for="(color, index) in colors"
              :key="color"
              closable
              :disable-transitions="false"
              :disabled="disabled"
              @close="removeColor(index)"
            >
              {{ color }}
            </ElTag>
            <span v-if="colors.length === 0" class="empty-tip">暂未添加颜色</span>
          </div>

          <!-- 添加颜色输入框 -->
          <div v-if="!disabled" class="add-input">
            <ElInput
              v-model="newColor"
              placeholder="输入颜色名称，如：红色、蓝色"
              size="small"
              @keyup.enter="addColor"
            >
              <template #append>
                <ElButton @click="addColor">
                  <ElIcon><Plus /></ElIcon>
                  添加
                </ElButton>
              </template>
            </ElInput>
          </div>
        </div>
      </ElCard>

      <!-- 内存配置 -->
      <ElCard class="spec-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">内存规格</span>
            <span class="count">已添加 {{ memories.length }} 个</span>
          </div>
        </template>

        <div class="spec-content">
          <!-- 已添加的内存标签 -->
          <div class="tag-list">
            <ElTag
              v-for="(memory, index) in memories"
              :key="memory"
              type="success"
              closable
              :disable-transitions="false"
              :disabled="disabled"
              @close="removeMemory(index)"
            >
              {{ memory }}
            </ElTag>
            <span v-if="memories.length === 0" class="empty-tip">暂未添加内存规格</span>
          </div>

          <!-- 添加内存输入框 -->
          <div v-if="!disabled" class="add-input">
            <ElInput
              v-model="newMemory"
              placeholder="输入内存规格，如：8GB、16GB"
              size="small"
              @keyup.enter="addMemory"
            >
              <template #append>
                <ElButton @click="addMemory">
                  <ElIcon><Plus /></ElIcon>
                  添加
                </ElButton>
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
          （{{ colors.length }} 种颜色 × {{ memories.length }} 种内存）
        </span>
        <span v-else class="tip">请先添加颜色和内存规格</span>
      </div>

      <div class="generate-actions">
        <ElButton
          type="primary"
          :disabled="!canGenerate"
          @click="generateCombinations"
        >
          <ElIcon><Plus /></ElIcon>
          生成规格组合
        </ElButton>
        <ElButton
          v-if="skuTable.length > 0"
          type="danger"
          plain
          @click="clearCombinations"
        >
          <ElIcon><Delete /></ElIcon>
          清空组合
        </ElButton>
      </div>
    </div>

    <!-- SKU 组合表格 -->
    <div v-if="skuTable.length > 0" class="sku-table-section">
      <div class="table-header">
        <h4>规格组合明细</h4>

        <!-- 批量设置 -->
        <div v-if="!disabled" class="batch-actions">
          <div class="batch-item">
            <span>批量设置库存:</span>
            <ElInputNumber
              v-model="batchStock"
              :min="0"
              size="small"
              placeholder="库存"
              style="width: 100px"
            />
            <ElButton size="small" @click="handleBatchSetStock">应用</ElButton>
          </div>

          <div class="batch-item">
            <span>批量设置价格:</span>
            <ElInputNumber
              v-model="batchPrice"
              :min="0"
              :precision="2"
              size="small"
              placeholder="价格"
              style="width: 120px"
            />
            <ElButton size="small" @click="handleBatchSetPrice">应用</ElButton>
          </div>
        </div>
      </div>

      <ElTable :data="skuTable" border stripe>
        <ElTableColumn type="index" label="序号" width="60" align="center" />

        <ElTableColumn prop="color" label="颜色" width="120" align="center">
          <template #default="{ row }">
            <ElTag>{{ row.color }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="memory" label="内存" width="120" align="center">
          <template #default="{ row }">
            <ElTag type="success">{{ row.memory }}</ElTag>
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

        <ElTableColumn label="规格编码" min-width="150">
          <template #default="{ row }">
            <span class="sku-code">{{ row.color }}_{{ row.memory }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="!disabled" label="操作" width="80" align="center" fixed="right">
          <template #default="{ $index }">
            <ElTooltip content="删除此组合" placement="top">
              <ElButton
                type="danger"
                link
                size="small"
                @click="removeCombination($index)"
              >
                <ElIcon><Delete /></ElIcon>
              </ElButton>
            </ElTooltip>
          </template>
        </ElTableColumn>

        <!-- 空状态 -->
        <template #empty>
          <ElEmpty description="暂无规格组合" />
        </template>
      </ElTable>

      <!-- 统计信息 -->
      <div class="table-footer">
        <span>共 <strong>{{ skuTable.length }}</strong> 个规格组合</span>
        <span>
          总库存: <strong>{{ skuTable.reduce((sum, item) => sum + item.stock, 0) }}</strong>
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <ElEmpty description="暂无规格组合，请先添加颜色和内存规格后生成" />
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

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .batch-actions {
      display: flex;
      gap: 16px;

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

  .sku-code {
    font-family: monospace;
    font-size: 12px;
    color: #909399;
    background: #f5f7fa;
    padding: 4px 8px;
    border-radius: 4px;
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
