<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  UserRole,
  type UserInfo,
  type UserForm,
  type SearchForm,
  UserStatus,
} from '@/api/model/user'
import * as UserApi from '@/api/user'

// ========== 数据定义 ==========

// 搜索表单
const searchForm = reactive<SearchForm>({
  username: '',
  phone: '',
  email: '',
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
  status: 1,
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
    // 将分页信息和搜索表单的信息合并传给 API
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      username: searchForm.username || undefined, // 如果是空字符串转为 undefined，避免干扰
      phone: searchForm.phone || undefined,
      status: searchForm.status,
    }

    // 2. 调用 API (你的 getUserList 函数内部已经处理了 USE_MOCK 判断)
    const res = await UserApi.getUserList(params)

    // 3. 赋值数据
    // res.list 是当前页的数据
    tableData.value = res.list
    // res.total 是总条数（你的 Mock 里写死是 100）
    pagination.total = res.total
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.email = ''
  searchForm.status = undefined
  handleSearch()
}

// 切换状态（封禁/解禁）
async function handleStatusChange(row: UserInfo) {
  // 因为 v-model 已经改变了值，所以这里判断的是"改变后"的状态
  // row.status === 1 表示刚才的操作是"开启"
  const text = row.status === 1 ? '启用' : '禁用'

  try {
    // 1. 调用真实的 API 函数
    // 传入当前行的 ID 和 已经被 v-model 改变后的新 status
    await UserApi.updateUserStatus(row.id, row.status)

    // 2. 成功提示
    ElMessage.success(`${text}成功`)
  } catch (error) {
    console.error('更新状态失败:', error)

    // 3. 关键：如果 API 失败了，要把开关的状态“拨回去”
    // 因为 v-model 已经把它变了，失败时我们需要恢复原状，否则 UI 和数据库就不一致了
    row.status = row.status === 1 ? 0 : 1

    ElMessage.error(`${text}失败，请重试`)
  } finally {
    // row.loading = false
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
  formData.status = 1
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
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态筛选">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="UserStatus.ACTIVE" />
            <el-option label="禁用" :value="UserStatus.DISABLED" />
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
        <el-table-column prop="phone" label="电话" min-width="100" align="center" />
        <el-table-column prop="role" label="用户类型" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="
                row.role === UserRole.SUPER_ADMIN
                  ? 'danger'
                  : row.role === UserRole.ADMIN
                    ? 'warning'
                    : 'success'
              "
            >
              {{
                row.role === UserRole.SUPER_ADMIN
                  ? '超级管理员'
                  : row.role === UserRole.ADMIN
                    ? '普通管理员'
                    : '普通用户'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="正常"
              inactive-text="禁用"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180" align="center" />
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
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
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
