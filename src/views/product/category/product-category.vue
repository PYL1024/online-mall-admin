<script setup lang="ts">
/**
 * 商品分类管理页面
 * 功能：树形表格展示分类、新增/编辑/删除分类、拖拽排序
 */
import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElButton,
  ElTable,
  ElTableColumn,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElIcon,
  ElEmpty,
} from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Category } from '@/api/model/product'
import {
  getCategoryTree,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategorySort,
} from '@/api/product'

// ==================== 状态定义 ====================

// 加载状态
const loading = ref(false)

// 分类树数据
const categoryTree = ref<Category[]>([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const formRef = ref<FormInstance>()

// 表单数据
const categoryForm = reactive<{
  id?: number
  name: string
  parentId: number
  sort: number
}>({
  name: '',
  parentId: 0,
  sort: 0,
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度为 2-20 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
}

// 当前编辑的父分类名称（用于显示）
const parentCategoryName = computed(() => {
  if (categoryForm.parentId === 0) return '无（一级分类）'
  // 递归查找父分类名称
  const findName = (categories: Category[], id: number): string => {
    for (const cat of categories) {
      if (cat.id === id) return cat.name
      if (cat.children) {
        const found = findName(cat.children, id)
        if (found) return found
      }
    }
    return ''
  }
  return findName(categoryTree.value, categoryForm.parentId) || '未知分类'
})

// ==================== 生命周期 ====================

onMounted(() => {
  loadCategories()
})

// ==================== 数据加载 ====================

/**
 * 加载分类树数据
 */
async function loadCategories() {
  loading.value = true
  try {
    categoryTree.value = await getCategoryTree()
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
}

// ==================== 分类操作 ====================

/**
 * 打开新增分类弹窗
 * @param parentId 父分类ID，0表示新增一级分类
 */
function handleAdd(parentId = 0) {
  dialogTitle.value = parentId === 0 ? '新增一级分类' : '新增子分类'
  categoryForm.id = undefined
  categoryForm.name = ''
  categoryForm.parentId = parentId
  categoryForm.sort = 0
  dialogVisible.value = true
}

/**
 * 打开编辑分类弹窗
 */
function handleEdit(row: Category) {
  dialogTitle.value = '编辑分类'
  categoryForm.id = row.id
  categoryForm.name = row.name
  categoryForm.parentId = row.parentId
  categoryForm.sort = row.sort
  dialogVisible.value = true
}

/**
 * 删除分类
 */
async function handleDelete(row: Category) {
  // 检查是否有子分类
  if (row.children && row.children.length > 0) {
    ElMessage.warning('该分类下存在子分类，请先删除子分类')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？删除后不可恢复。`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    await loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除分类失败')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (categoryForm.id) {
        // 编辑
        await updateCategory({
          id: categoryForm.id,
          name: categoryForm.name,
          parentId: categoryForm.parentId,
          sort: categoryForm.sort,
        })
        ElMessage.success('更新成功')
      } else {
        // 新增
        await addCategory({
          name: categoryForm.name,
          parentId: categoryForm.parentId,
          sort: categoryForm.sort,
        })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      await loadCategories()
    } catch (error) {
      console.error('保存分类失败:', error)
      ElMessage.error('保存分类失败')
    } finally {
      loading.value = false
    }
  })
}

/**
 * 关闭弹窗
 */
function handleClose() {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// ==================== 拖拽排序 ====================

/**
 * 上移分类
 */
async function handleMoveUp(row: Category, index: number, siblings: Category[]) {
  if (index === 0) {
    ElMessage.warning('已经是第一个了')
    return
  }

  const prevItem = siblings[index - 1]
  const updates = [
    { id: row.id, sort: prevItem.sort, parentId: row.parentId },
    { id: prevItem.id, sort: row.sort, parentId: prevItem.parentId },
  ]

  try {
    await updateCategorySort(updates)
    ElMessage.success('排序更新成功')
    await loadCategories()
  } catch (error) {
    console.error('排序失败:', error)
    ElMessage.error('排序失败')
  }
}

/**
 * 下移分类
 */
async function handleMoveDown(row: Category, index: number, siblings: Category[]) {
  if (index === siblings.length - 1) {
    ElMessage.warning('已经是最后一个了')
    return
  }

  const nextItem = siblings[index + 1]
  const updates = [
    { id: row.id, sort: nextItem.sort, parentId: row.parentId },
    { id: nextItem.id, sort: row.sort, parentId: nextItem.parentId },
  ]

  try {
    await updateCategorySort(updates)
    ElMessage.success('排序更新成功')
    await loadCategories()
  } catch (error) {
    console.error('排序失败:', error)
    ElMessage.error('排序失败')
  }
}

/**
 * 获取同级分类列表
 */
function getSiblings(row: Category): Category[] {
  if (row.parentId === 0) {
    return categoryTree.value
  }

  // 递归查找父分类的 children
  const findParent = (categories: Category[]): Category[] => {
    for (const cat of categories) {
      if (cat.id === row.parentId) {
        return cat.children || []
      }
      if (cat.children) {
        const found = findParent(cat.children)
        if (found.length > 0) return found
      }
    }
    return []
  }

  return findParent(categoryTree.value)
}

/**
 * 获取当前项在同级中的索引
 */
function getSiblingIndex(row: Category): number {
  const siblings = getSiblings(row)
  return siblings.findIndex((item) => item.id === row.id)
}
</script>

<template>
  <div class="category-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">商品分类管理</h2>
      <ElButton type="primary" @click="handleAdd(0)">
        <ElIcon><Plus /></ElIcon>
        新增一级分类
      </ElButton>
    </div>

    <!-- 提示信息 -->
    <div class="tips-area">
      <p>💡 提示：支持多级分类管理，可通过上移/下移按钮调整分类顺序</p>
    </div>

    <!-- 分类树形表格 -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="categoryTree"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <ElTableColumn prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <span class="category-name">{{ row.name }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="id" label="分类ID" width="100" align="center" />

        <ElTableColumn prop="sort" label="排序" width="100" align="center">
          <template #default="{ row }">
            <span class="sort-value">{{ row.sort }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <ElButton type="primary" link size="small" @click="handleAdd(row.id)">
                <ElIcon><Plus /></ElIcon>
                添加子分类
              </ElButton>
              <ElButton type="primary" link size="small" @click="handleEdit(row)">
                <ElIcon><Edit /></ElIcon>
                编辑
              </ElButton>
              <ElButton
                type="primary"
                link
                size="small"
                @click="handleMoveUp(row, getSiblingIndex(row), getSiblings(row))"
              >
                上移
              </ElButton>
              <ElButton
                type="primary"
                link
                size="small"
                @click="handleMoveDown(row, getSiblingIndex(row), getSiblings(row))"
              >
                下移
              </ElButton>
              <ElButton type="danger" link size="small" @click="handleDelete(row)">
                <ElIcon><Delete /></ElIcon>
                删除
              </ElButton>
            </div>
          </template>
        </ElTableColumn>

        <!-- 空状态 -->
        <template #empty>
          <ElEmpty description="暂无分类数据" />
        </template>
      </ElTable>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <ElForm
        ref="formRef"
        :model="categoryForm"
        :rules="formRules"
        label-width="100px"
        class="category-form"
      >
        <ElFormItem label="父级分类">
          <ElInput :model-value="parentCategoryName" disabled />
        </ElFormItem>

        <ElFormItem label="分类名称" prop="name">
          <ElInput
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            maxlength="20"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="排序" prop="sort">
          <ElInputNumber
            v-model="categoryForm.sort"
            :min="0"
            :max="9999"
            placeholder="数值越小越靠前"
          />
          <span class="form-tip">数值越小，排序越靠前</span>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleClose">取消</ElButton>
          <ElButton type="primary" :loading="loading" @click="handleSubmit">
            {{ categoryForm.id ? '保存修改' : '确认添加' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.category-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.tips-area {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;

  p {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.table-container {
  .category-name {
    font-weight: 500;
  }

  .sort-value {
    color: #909399;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.category-form {
  padding: 10px 20px 0;

  .form-tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table) {
  .el-table__row {
    &:hover {
      .action-buttons {
        opacity: 1;
      }
    }
  }
}
</style>
