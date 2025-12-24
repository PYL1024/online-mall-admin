<script setup lang="ts">
/**
 * 商品列表页面
 * 功能：商品筛选查询、列表展示、批量操作
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElButton,
  ElTable,
  ElTableColumn,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElImage,
  ElEmpty,
  ElIcon,
} from 'element-plus'
import { Plus, Search, Refresh, Upload, Download } from '@element-plus/icons-vue'
import type { Product, ProductFilter, Category } from '@/api/model/product'
import type { PageParams } from '@/api/model/common'
import { getProductList, getCategoryList, batchUpdateProductStatus, deleteProduct } from '@/api/product'

// ==================== 状态定义 ====================

const router = useRouter()

// 加载状态
const loading = ref(false)

// 分类列表（用于筛选下拉）
const categoryList = ref<Category[]>([])

// 筛选表单
const filterForm = reactive<ProductFilter>({
  categoryId: undefined,
  status: undefined,
  keyword: '',
  priceMin: undefined,
  priceMax: undefined,
})

// 分页参数
const pagination = reactive<PageParams>({
  page: 1,
  pageSize: 10,
})

// 商品列表数据
const productList = ref<Product[]>([])
const total = ref(0)

// 多选
const selectedProducts = ref<Product[]>([])

// 状态选项
const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '已上架', value: 1 },
  { label: '已下架', value: 0 },
]

// ==================== 计算属性 ====================

// 是否有选中商品
const hasSelected = computed(() => selectedProducts.value.length > 0)

// 选中商品数量
const selectedCount = computed(() => selectedProducts.value.length)

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})

// ==================== 数据加载 ====================

/**
 * 加载分类列表
 */
async function loadCategories() {
  try {
    categoryList.value = await getCategoryList()
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

/**
 * 加载商品列表
 */
async function loadProducts() {
  loading.value = true
  try {
    const params = {
      ...pagination,
      ...filterForm,
    }
    const result = await getProductList(params)
    productList.value = result.list
    total.value = result.total
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// ==================== 筛选操作 ====================

/**
 * 搜索商品
 */
function handleSearch() {
  pagination.page = 1
  loadProducts()
}

/**
 * 重置筛选条件
 */
function handleReset() {
  filterForm.categoryId = undefined
  filterForm.status = undefined
  filterForm.keyword = ''
  filterForm.priceMin = undefined
  filterForm.priceMax = undefined
  pagination.page = 1
  loadProducts()
}

// ==================== 分页操作 ====================

/**
 * 页码改变
 */
function handlePageChange(page: number) {
  pagination.page = page
  loadProducts()
}

/**
 * 每页条数改变
 */
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadProducts()
}

// ==================== 商品操作 ====================

/**
 * 新增商品
 */
function handleAdd() {
  router.push('/product/create')
}

/**
 * 编辑商品
 */
function handleEdit(row: Product) {
  router.push(`/product/edit/${row.id}`)
}

/**
 * 删除商品
 */
async function handleDelete(row: Product) {
  try {
    await ElMessageBox.confirm(`确定要删除商品「${row.name}」吗？删除后不可恢复。`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
      ElMessage.error('删除商品失败')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 切换商品状态（上架/下架）
 */
async function handleToggleStatus(row: Product) {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定要${statusText}商品「${row.name}」吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    await batchUpdateProductStatus([row.id], newStatus)
    ElMessage.success(`${statusText}成功`)
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
      ElMessage.error('更新状态失败')
    }
  } finally {
    loading.value = false
  }
}

// ==================== 多选操作 ====================

/**
 * 多选改变
 */
function handleSelectionChange(selection: Product[]) {
  selectedProducts.value = selection
}

/**
 * 批量上架
 */
async function handleBatchOnline() {
  if (!hasSelected.value) {
    ElMessage.warning('请选择要上架的商品')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要批量上架选中的 ${selectedCount.value} 个商品吗？`, '批量上架', {
      confirmButtonText: '确定上架',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    const ids = selectedProducts.value.map((p) => p.id)
    await batchUpdateProductStatus(ids, 1)
    ElMessage.success('批量上架成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量上架失败:', error)
      ElMessage.error('批量上架失败')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 批量下架
 */
async function handleBatchOffline() {
  if (!hasSelected.value) {
    ElMessage.warning('请选择要下架的商品')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要批量下架选中的 ${selectedCount.value} 个商品吗？`, '批量下架', {
      confirmButtonText: '确定下架',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    const ids = selectedProducts.value.map((p) => p.id)
    await batchUpdateProductStatus(ids, 0)
    ElMessage.success('批量下架成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量下架失败:', error)
      ElMessage.error('批量下架失败')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 格式化价格
 */
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}
</script>

<template>
  <div class="product-list-container">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <ElForm :model="filterForm" inline class="filter-form">
        <ElFormItem label="商品分类">
          <ElSelect
            v-model="filterForm.categoryId"
            placeholder="全部分类"
            clearable
            style="width: 160px"
          >
            <ElOption
              v-for="cat in categoryList"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="商品状态">
          <ElSelect
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <ElOption
              v-for="opt in statusOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="商品名称">
          <ElInput
            v-model="filterForm.keyword"
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="价格区间">
          <div class="price-range">
            <ElInputNumber
              v-model="filterForm.priceMin"
              :min="0"
              :precision="2"
              placeholder="最低价"
              controls-position="right"
              style="width: 120px"
            />
            <span class="separator">-</span>
            <ElInputNumber
              v-model="filterForm.priceMax"
              :min="0"
              :precision="2"
              placeholder="最高价"
              controls-position="right"
              style="width: 120px"
            />
          </div>
        </ElFormItem>

        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">
            <ElIcon><Search /></ElIcon>
            查询
          </ElButton>
          <ElButton @click="handleReset">
            <ElIcon><Refresh /></ElIcon>
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left-actions">
        <ElButton type="primary" @click="handleAdd">
          <ElIcon><Plus /></ElIcon>
          发布商品
        </ElButton>
        <ElButton :disabled="!hasSelected" @click="handleBatchOnline">
          <ElIcon><Upload /></ElIcon>
          批量上架
        </ElButton>
        <ElButton :disabled="!hasSelected" @click="handleBatchOffline">
          <ElIcon><Download /></ElIcon>
          批量下架
        </ElButton>
        <span v-if="hasSelected" class="selected-tip">
          已选中 <strong>{{ selectedCount }}</strong> 个商品
        </span>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="productList"
        border
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="50" align="center" />

        <ElTableColumn label="商品图片" width="100" align="center">
          <template #default="{ row }">
            <ElImage
              :src="row.mainImage"
              :preview-src-list="[row.mainImage]"
              fit="cover"
              class="product-image"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn prop="name" label="商品名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="product-name">{{ row.name }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="categoryName" label="分类" width="120" align="center" />

        <ElTableColumn label="价格" width="120" align="right">
          <template #default="{ row }">
            <span class="price">{{ formatPrice(row.price) }}</span>
            <span v-if="row.originalPrice" class="original-price">
              {{ formatPrice(row.originalPrice) }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="stock" label="库存" width="100" align="center">
          <template #default="{ row }">
            <span :class="['stock', { warning: row.stock < 10 }]">{{ row.stock }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已上架' : '已下架' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="updateTime" label="更新时间" width="180" align="center" />

        <ElTableColumn label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </ElButton>
            <ElButton
              :type="row.status === 1 ? 'warning' : 'success'"
              link
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>

        <!-- 空状态 -->
        <template #empty>
          <ElEmpty description="暂无商品数据" />
        </template>
      </ElTable>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <ElPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-list-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 140px);
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .price-range {
    display: flex;
    align-items: center;
    gap: 8px;

    .separator {
      color: #909399;
    }
  }
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .left-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .selected-tip {
      font-size: 13px;
      color: #909399;

      strong {
        color: #409eff;
      }
    }
  }
}

.table-container {
  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 4px;
  }

  .product-name {
    font-weight: 500;
  }

  .price {
    font-weight: 600;
    color: #f56c6c;
  }

  .original-price {
    display: block;
    font-size: 12px;
    color: #909399;
    text-decoration: line-through;
  }

  .stock {
    &.warning {
      color: #e6a23c;
      font-weight: 600;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
