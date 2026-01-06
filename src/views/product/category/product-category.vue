<script setup lang="ts">
/**
 * 商品分类管理页面
 * 功能：树形表格展示分类，支持增删改操作
 */
import { ref, onMounted, computed } from 'vue'
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElEmpty,
} from 'element-plus'
import { Plus, Edit, Delete, Refresh, Top, Bottom } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getCategoryTree,
  addCategory,
  updateCategory,
  deleteCategory,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
} from '@/api/product'
import type { Category } from '@/api/model/product'

// ==================== 状态定义 ====================

// 加载状态
const loading = ref(false)

// 分类列表
const categoryList = ref<Category[]>([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const dialogMode = ref<'add' | 'edit'>('add')

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = ref<{
  id?: number | string
  name: string
  subTitle: string
}>({
  name: '',
  subTitle: '',
})

// 表单校验规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度在 2 到 20 个字符', trigger: 'blur' },
  ],
}

// 提交状态
const submitting = ref(false)

// ==================== 计算属性 ====================

// 是否有数据
const hasData = computed(() => categoryList.value.length > 0)

// ==================== 生命周期 ====================

onMounted(() => {
  loadCategories()
})

// ==================== 数据加载 ====================

/**
 * 加载分类列表
 */
async function loadCategories() {
  loading.value = true
  try {
    const list = await getCategoryTree()
    // 解析当前 themeColor 为数字，按数字排序（无效归为末尾）
    const parsed = list.map((item) => {
      const n = parseInt(String(item.themeColor ?? ''), 10)
      const sort = Number.isFinite(n) && n > 0 ? n : Infinity
      return { raw: item, sort }
    })

    parsed.sort((a, b) => a.sort - b.sort)

    // 重新分配连续序号（1..N），并记录需要同步到后端的项
    const toUpdate: { id: number | string; name: string; subTitle: string | null; themeColor: string | null }[] = []
    const normalized: Category[] = []

    parsed.forEach((p, idx) => {
      const desired = idx + 1
      const currentRaw = p.raw
      const currentNum = parseInt(String(currentRaw.themeColor ?? ''), 10) || 0
      // 如果当前不等于期望，则需更新后端
      if (currentNum !== desired) {
        toUpdate.push({
          id: currentRaw.id,
          name: currentRaw.name,
          subTitle: currentRaw.subTitle ?? null,
          themeColor: String(desired),
        })
        // 在本地也写入新的 themeColor
        normalized.push({ ...currentRaw, themeColor: String(desired) })
      } else {
        normalized.push({ ...currentRaw, themeColor: String(currentNum) })
      }
    })

    // 若有需要同步到后端的更改，按顺序逐个更新（可改为批量API）
    if (toUpdate.length > 0) {
      try {
        for (const u of toUpdate) {
          // 使用 updateCategory 同步 themeColor 字段
          // 注意：updateCategory 接口会把 null 替换成空字符串，传入 themeColor 字符串即可
          await updateCategory({ id: u.id, name: u.name, subTitle: u.subTitle, themeColor: u.themeColor })
        }
      } catch (err) {
        console.error('同步排序到后端失败:', err)
        // 继续，将本地视图更新为规范化结果，用户可再次刷新
      }
    }

    categoryList.value = normalized
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取当前最大序号
 */
function getMaxSort(): number {
  if (categoryList.value.length === 0) return 0
  return Math.max(...categoryList.value.map(c => parseInt(c.themeColor || '0') || 0))
}

// ==================== 弹窗操作 ====================

/**
 * 打开新增弹窗
 */
function handleAdd() {
  dialogMode.value = 'add'
  dialogTitle.value = '新增分类'
  formData.value = {
    name: '',
    subTitle: '',
  }
  dialogVisible.value = true
}

/**
 * 打开编辑弹窗
 */
function handleEdit(row: Category) {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑分类'
  formData.value = {
    id: row.id,
    name: row.name,
    subTitle: row.subTitle || '',
  }
  dialogVisible.value = true
}

/**
 * 关闭弹窗
 */
function handleClose() {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// ==================== 表单提交 ====================

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 检查是否有重名
    const isDuplicate = categoryList.value.some(
      (cat) =>
        cat.name === formData.value.name &&
        (dialogMode.value === 'add' || cat.id !== formData.value.id)
    )

    if (isDuplicate) {
      ElMessage.warning('分类名称已存在，请使用其他名称')
      return
    }

    submitting.value = true

    try {
      if (dialogMode.value === 'add') {
        // 新增分类，序号为当前最大序号+1
        const newSort = getMaxSort() + 1
        const request: CategoryCreateRequest = {
          name: formData.value.name,
          subTitle: formData.value.subTitle || null,
          themeColor: String(newSort),
        }
        await addCategory(request)
        ElMessage.success('新增分类成功')
      } else {
        // 更新分类，保持原有序号
        const currentCategory = categoryList.value.find(c => c.id === formData.value.id)
        const request: CategoryUpdateRequest = {
          id: formData.value.id!,
          name: formData.value.name,
          subTitle: formData.value.subTitle || null,
          themeColor: currentCategory?.themeColor || null,
        }
        await updateCategory(request)
        ElMessage.success('更新分类成功')
      }

      handleClose()
      loadCategories()
    } catch (error) {
      console.error('操作失败:', error)
      // 错误消息已在 request.ts 中处理
    } finally {
      submitting.value = false
    }
  })
}

// ==================== 删除操作 ====================

/**
 * 删除分类
 */
async function handleDelete(row: Category) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类「${row.name}」吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    const deletedSort = parseInt(row.themeColor || '0') || 0

    // 先删除分类
    await deleteCategory(row.id)

    // 更新后续分类的序号（序号大于被删除分类的，都减1）
    const categoriesToUpdate = categoryList.value.filter(c => {
      const sort = parseInt(c.themeColor || '0') || 0
      return sort > deletedSort
    })

    for (const cat of categoriesToUpdate) {
      const currentSort = parseInt(cat.themeColor || '0') || 0
      const request: CategoryUpdateRequest = {
        id: cat.id,
        name: cat.name,
        subTitle: cat.subTitle || null,
        themeColor: String(currentSort - 1),
      }
      await updateCategory(request)
    }

    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// ==================== 排序操作 ====================

/**
 * 上移分类
 */
async function handleMoveUp(index: number) {
  if (index <= 0) return

  const currentItem = categoryList.value[index]
  const prevItem = categoryList.value[index - 1]
  if (!currentItem || !prevItem) return

  loading.value = true
  try {
    // 交换两个分类的序号
    const currentSort = currentItem.themeColor
    const prevSort = prevItem.themeColor

    // 更新当前分类的序号
    await updateCategory({
      id: currentItem.id,
      name: currentItem.name,
      subTitle: currentItem.subTitle || null,
      themeColor: prevSort || null,
    })

    // 更新上一个分类的序号
    await updateCategory({
      id: prevItem.id,
      name: prevItem.name,
      subTitle: prevItem.subTitle || null,
      themeColor: currentSort || null,
    })

    // 重新加载列表
    await loadCategories()
  } catch (error) {
    console.error('上移失败:', error)
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

/**
 * 下移分类
 */
async function handleMoveDown(index: number) {
  if (index >= categoryList.value.length - 1) return

  const currentItem = categoryList.value[index]
  const nextItem = categoryList.value[index + 1]
  if (!currentItem || !nextItem) return

  loading.value = true
  try {
    // 交换两个分类的序号
    const currentSort = currentItem.themeColor
    const nextSort = nextItem.themeColor

    // 更新当前分类的序号
    await updateCategory({
      id: currentItem.id,
      name: currentItem.name,
      subTitle: currentItem.subTitle || null,
      themeColor: nextSort || null,
    })

    // 更新下一个分类的序号
    await updateCategory({
      id: nextItem.id,
      name: nextItem.name,
      subTitle: nextItem.subTitle || null,
      themeColor: currentSort || null,
    })

    // 重新加载列表
    await loadCategories()
  } catch (error) {
    console.error('下移失败:', error)
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="product-category">
    <!-- 页面标题和操作栏 -->
    <ElCard shadow="never" class="header-card">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">分类管理</h2>
          <span class="category-count">共 {{ categoryList.length }} 个分类</span>
        </div>
        <div class="header-right">
          <ElButton :icon="Refresh" @click="loadCategories" :loading="loading">
            刷新
          </ElButton>
          <ElButton type="primary" :icon="Plus" @click="handleAdd">
            新增分类
          </ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 分类表格 -->
    <ElCard shadow="never" class="table-card">
      <ElTable
        :data="categoryList"
        v-loading="loading"
        row-key="id"
        border
        stripe
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        empty-text="暂无分类数据"
      >
        <ElTableColumn prop="id" label="ID" width="80" align="center" />

        <ElTableColumn label="排序" width="120" align="center">
          <template #default="{ row, $index }">
            <div class="sort-buttons">
              <ElButton
                :icon="Top"
                link
                size="small"
                :disabled="$index === 0"
                @click="handleMoveUp($index)"
                title="上移"
              />
              <span class="sort-number">{{ row.themeColor || '-' }}</span>
              <ElButton
                :icon="Bottom"
                link
                size="small"
                :disabled="$index === categoryList.length - 1"
                @click="handleMoveDown($index)"
                title="下移"
              />
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="name" label="分类名称" min-width="150">
          <template #default="{ row }">
            <span class="category-name">{{ row.name }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="subTitle" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="category-subtitle">{{ row.subTitle || '-' }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton
              type="primary"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </ElButton>
            <ElButton
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 空状态 -->
      <ElEmpty v-if="!loading && !hasData" description="暂无分类，点击上方按钮添加">
        <ElButton type="primary" :icon="Plus" @click="handleAdd">
          新增分类
        </ElButton>
      </ElEmpty>
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <ElFormItem label="分类名称" prop="name">
          <ElInput
            v-model="formData.name"
            placeholder="请输入分类名称"
            maxlength="20"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="描述" prop="subTitle">
          <ElInput
            v-model="formData.subTitle"
            type="textarea"
            placeholder="请输入分类描述（可选）"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogMode === 'add' ? '新增' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.product-category {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: baseline;
        gap: 12px;

        .page-title {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0;
        }

        .category-count {
          font-size: 14px;
          color: #909399;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .table-card {
    .category-name {
      font-weight: 500;
      color: #303133;
    }

    .category-subtitle {
      color: #606266;
      font-size: 13px;
    }

    .sort-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .sort-number {
        min-width: 24px;
        text-align: center;
        font-weight: 500;
        color: #606266;
      }

      .el-button {
        padding: 4px;

        &:disabled {
          opacity: 0.3;
        }
      }
    }
  }
}
</style>
