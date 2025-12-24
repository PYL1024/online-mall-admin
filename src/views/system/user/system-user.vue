<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { UserRole, type UserInfo, type UserForm, type SearchForm } from '@/api/model/user'
import * as UserApi from '@/api/user'

// ========== 数据定义 ==========

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  status: undefined,
})

// 表格数据
const loading = ref(false)
const tableData = ref<UserInfo[]>([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<FormInstance>()
const formLoading = ref(false)

// 创建用户表单
const formData = reactive<UserForm>({
  username: '',
  password: '',
  phone: '',
  email: '',
  status: 'active',
  role: null,
})

const roleOptions = [
  { value: UserRole.USER, label: '普通用户' },
  { value: UserRole.ADMIN, label: '普通管理员' },
  { value: UserRole.SUPER_ADMIN, label: '超级管理员' },
]

// 表单规则
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
}

// ========== 方法定义 ==========

// 获取数据
async function fetchData() {
  loading.value = true
  try {
    // 1. 构造查询参数
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status,
    }

    // 2. 调用 API
    const res = await UserApi.getUserList(params)
    console.log('用户列表数据:', res)

    // 3. 赋值数据
    tableData.value = res.list
    pagination.total = res.total
    // window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error(error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.currentPage = 1
  fetchData()
}

// 重置筛选
function handleReset() {
  searchForm.keyword = ''
  searchForm.status = undefined
  handleSearch()
}

// 切换状态（封禁/解禁）
async function handleStatusChange(row: UserInfo) {
  const isBanning = row.status === 'disabled'
  const text = isBanning ? '封禁' : '解禁'

  try {
    let endTime: number | undefined
    if (isBanning) {
      // 如果是封禁，弹出输入框询问封禁时长
      const { value } = await ElMessageBox.prompt('请输入封禁时长（小时）', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[1-9]\d*$/,
        inputErrorMessage: '请输入正整数',
        inputValue: '24',
      })
      endTime = parseInt(value)
    }

    // 1. 调用 API
    await UserApi.updateUserStatus(row.id, {
      action: isBanning ? 1 : 0,
      endTime,
    })

    // 2. 成功提示
    ElMessage.success(`${text}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
      ElMessage.error(`${text}失败，请重试`)
    }
    // 3. 恢复原状
    row.status = isBanning ? 'active' : 'disabled'
  }
}

// 打开新增弹窗
function handleAdd() {
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
  // 重置表单
  formData.username = ''
  formData.password = ''
  formData.phone = ''
  formData.email = ''
  formData.status = 'active'
  formData.role = null
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      await UserApi.addUser(formData)
      ElMessage.success('新增成功')

      dialogVisible.value = false
      fetchData() // 刷新表格数据
    } catch (error) {
      console.error(error)
      // 错误处理：如果是新增失败，可能是用户名重复等原因
      ElMessage.error(`操作失败: ${error}`)
    } finally {
      formLoading.value = false
    }
  })
}

// 删除用户
function handleDelete(row: UserInfo) {
  ElMessageBox.confirm(`确认删除用户 "${row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await UserApi.deleteUser(row.id)
      // await UserApi.deleteUser(row.id)
      await new Promise((resolve) => setTimeout(resolve, 300)) // Mock
      ElMessage.success('删除成功')
      fetchData()
    })
    .catch(() => {})
}

// 分页变化
function handleSizeChange(val: number) {
  pagination.pageSize = val
  pagination.currentPage = 1
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.currentPage = val
  fetchData()
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名/手机号/邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态筛选">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="'active'" />
            <el-option label="禁用" :value="'disabled'" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格栏 -->
    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="100" align="center" />
        <el-table-column prop="phone" label="电话" min-width="80" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="100" align="center">
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'disabled'"
              inline-prompt
              active-text="正常"
              inactive-text="禁用"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="注册时间" width="180" align="center" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="用户类型" prop="role">
          <el-select v-model="formData.role" placeholder="选择用户类型">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="'active'">正常</el-radio>
            <el-radio :value="'disabled'">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  .search-card {
    margin-bottom: 20px;
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    // 针对内部的 form-item 进行微调
    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 16px;

      display: flex;
      align-items: center;
    }

    :deep(.el-form-item:last-child) {
      margin-right: 0;
    }
  }

  .table-toolbar {
    margin-bottom: 20px;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
