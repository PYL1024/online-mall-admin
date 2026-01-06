<script setup lang="ts">
/**
 * 商品列表页面
 * 功能：商品列表展示、筛选查询、批量操作
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElImage,
  ElEmpty,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
} from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  View,
  ArrowDown,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import {
  getProductList,
  getCategoryList,
  deleteProduct,
  batchUpdateProductStatus,
} from '@/api/product'
import type { Category, Product, ProductFilter } from '@/api/model/product'

// ==================== Router ====================

const router = useRouter()

// ==================== 状态定义 ====================

// 加载状态
const loading = ref(false)

// 分类列表（用于筛选下拉）
const categoryList = ref<Category[]>([])

// 商品列表
const productList = ref<Product[]>([])

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 筛选表单
const filterForm = reactive<ProductFilter>({
  categoryId: undefined,
  status: undefined,
  keyword: '',
  priceMin: undefined,
  priceMax: undefined,
})

// 已选择的商品
const selectedProducts = ref<Product[]>([])

// 高级筛选展开
const showAdvancedFilter = ref(false)

// ==================== 计算属性 ====================

// 是否有选中商品
const hasSelection = computed(() => selectedProducts.value.length > 0)

// 选中数量
const selectionCount = computed(() => selectedProducts.value.length)

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' as string | number },
  { label: '上架中', value: 1 },
  { label: '已下架', value: 0 },
]

// ==================== 生命周期 ====================

onMounted(() => {
  loadCategories()
  loadProducts()
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
    const result = await getProductList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm,
    })
    productList.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// ==================== 筛选操作 ====================

/**
 * 搜索
 */
function handleSearch() {
  pagination.page = 1
  loadProducts()
}

/**
 * 重置筛选
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

/**
 * 切换高级筛选
 */
function toggleAdvancedFilter() {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

// ==================== 分页操作 ====================

/**
 * 页码变化
 */
function handlePageChange(page: number) {
  pagination.page = page
  loadProducts()
}

/**
 * 每页数量变化
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
  router.push('/product/edit')
}

/**
 * 编辑商品
 */
function handleEdit(row: Product) {
  router.push({
    path: `/product/edit/${row.id}`,
    query: { tag: row.tag }
  })
}

/**
 * 查看商品详情
 */
function handleView(row: Product) {
  router.push(`/product/edit/${row.id}?mode=view`)
}

/**
 * 删除商品
 */
async function handleDelete(row: Product) {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品「${row.name}」吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// ==================== 批量操作 ====================

/**
 * 表格选择变化
 */
function handleSelectionChange(selection: Product[]) {
  selectedProducts.value = selection
}

/**
 * 批量上架
 */
async function batchOnline() {
  if (!hasSelection.value) {
    ElMessage.warning('请先选择商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要上架选中的 ${selectionCount.value} 个商品吗？`,
      '批量上架',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    loading.value = true
    const ids = selectedProducts.value.map((p) => p.id)
    await batchUpdateProductStatus(ids, 1)
    ElMessage.success('批量上架成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量上架失败:', error)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 批量下架
 */
async function batchOffline() {
  if (!hasSelection.value) {
    ElMessage.warning('请先选择商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要下架选中的 ${selectionCount.value} 个商品吗？`,
      '批量下架',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    const ids = selectedProducts.value.map((p) => p.id)
    await batchUpdateProductStatus(ids, 0)
    ElMessage.success('批量下架成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量下架失败:', error)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除
 */
async function batchDelete() {
  if (!hasSelection.value) {
    ElMessage.warning('请先选择商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectionCount.value} 个商品吗？此操作不可恢复！`,
      '批量删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    )

    loading.value = true
    for (const product of selectedProducts.value) {
      await deleteProduct(product.id)
    }
    ElMessage.success('批量删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// ==================== 格式化函数 ====================

/**
 * 格式化价格
 */
function formatPrice(price: number) {
  return `¥${price.toFixed(2)}`
}

/**
 * 获取状态标签类型
 */
function getStatusType(status: 0 | 1) {
  return status === 1 ? 'success' : 'info'
}

/**
 * 获取状态文本
 */
function getStatusText(status: 0 | 1) {
  return status === 1 ? '上架中' : '已下架'
}
</script>

<template>
  <div class="product-list">
    <!-- 筛选区域 -->
    <ElCard shadow="never" class="filter-card">
      <ElForm :model="filterForm" inline class="filter-form">
        <!-- 基础筛选 -->
        <div class="filter-row">
          <ElFormItem label="商品名称">
            <ElInput
              v-model="filterForm.keyword"
              placeholder="请输入商品名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>

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

          <ElFormItem>
            <ElButton type="primary" :icon="Search" @click="handleSearch">
              搜索
            </ElButton>
            <ElButton :icon="Refresh" @click="handleReset">重置</ElButton>
            <ElButton link type="primary" @click="toggleAdvancedFilter">
              {{ showAdvancedFilter ? '收起' : '高级筛选' }}
            </ElButton>
          </ElFormItem>
        </div>

        <!-- 高级筛选 -->
        <div v-if="showAdvancedFilter" class="filter-row advanced">
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
              <span class="range-separator">~</span>
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
        </div>
      </ElForm>
    </ElCard>

    <!-- 操作栏 -->
    <ElCard shadow="never" class="action-card">
      <div class="action-bar">
        <div class="action-left">
          <ElButton type="primary" :icon="Plus" @click="handleAdd">
            新增商品
          </ElButton>

          <ElDropdown v-if="hasSelection" trigger="click">
            <ElButton>
              批量操作 ({{ selectionCount }})
              <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem @click="batchOnline">
                  <ElIcon><Upload /></ElIcon>
                  批量上架
                </ElDropdownItem>
                <ElDropdownItem @click="batchOffline">
                  <ElIcon><Download /></ElIcon>
                  批量下架
                </ElDropdownItem>
                <ElDropdownItem divided @click="batchDelete">
                  <ElIcon color="#f56c6c"><Delete /></ElIcon>
                  <span style="color: #f56c6c">批量删除</span>
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>

        <div class="action-right">
          <span class="total-info">共 {{ pagination.total }} 件商品</span>
        </div>
      </div>
    </ElCard>

    <!-- 商品表格 -->
    <ElCard shadow="never" class="table-card">
      <ElTable
        :data="productList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        row-key="id"
        border
        stripe
      >
        <ElTableColumn type="selection" width="50" align="center" />

        <ElTableColumn label="商品信息" min-width="300">
          <template #default="{ row }">
            <div class="product-info">
              <ElImage
                :src="row.mainImage"
                fit="cover"
                class="product-image"
                :preview-src-list="[row.mainImage, ...row.images]"
                preview-teleported
              />
              <div class="product-detail">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-id">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="categoryName" label="分类" width="160" align="center">
          <template #default="{ row }">
            <div>
              <ElTag size="small" type="info" style="margin-bottom: 4px">{{ row.categoryName || '-' }}</ElTag>
              <div style="font-size: 11px; color: #909399">ID: {{ row.categoryId }}</div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="价格" width="150" align="right">
          <template #default="{ row }">
            <div class="price-cell">
              <span class="current-price">{{ formatPrice(row.price) }}</span>
              <span v-if="row.originalPrice" class="original-price">
                {{ formatPrice(row.originalPrice) }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="stock" label="库存" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.stock < 10 }">{{ row.stock }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="updateTime" label="更新时间" width="170" align="center" />

        <ElTableColumn label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link :icon="View" @click="handleView(row)">
              查看
            </ElButton>
            <ElButton type="primary" link :icon="Edit" @click="handleEdit(row)">
              编辑
            </ElButton>
            <ElButton type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 空状态 -->
      <ElEmpty v-if="!loading && productList.length === 0" description="暂无商品数据">
        <ElButton type="primary" :icon="Plus" @click="handleAdd">
          新增商品
        </ElButton>
      </ElEmpty>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.product-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      .filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;

        &.advanced {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #ebeef5;
        }

        .price-range {
          display: flex;
          align-items: center;
          gap: 8px;

          .range-separator {
            color: #909399;
          }
        }
      }
    }
  }

  .action-card {
    margin-bottom: 16px;

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .action-left {
        display: flex;
        gap: 12px;
      }

      .action-right {
        .total-info {
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }

  .table-card {
    .product-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .product-image {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        flex-shrink: 0;
        cursor: pointer;
      }

      .product-detail {
        flex: 1;
        min-width: 0;

        .product-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-id {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .price-cell {
      .current-price {
        font-weight: 600;
        color: #f56c6c;
        font-size: 15px;
      }

      .original-price {
        display: block;
        font-size: 12px;
        color: #c0c4cc;
        text-decoration: line-through;
        margin-top: 2px;
      }
    }

    .low-stock {
      color: #f56c6c;
      font-weight: 500;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
