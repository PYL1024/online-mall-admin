<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Edit, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { UserInfo } from '@/api/model/user'
import * as UserApi from '@/api/user'

// ========== 数据定义 ==========

// 搜索表单
const searchForm = reactive({
  username: '',
  phone: '',
  status: '',
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

// 编辑表单
const formData = reactive({
  id: 0,
  username: '',
  nickname: '',
  password: '', // 仅新增时用
  email: '',
  phone: '',
  role: 'user',
  status: 1,
})

// 表单规则
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// ========== 方法定义 ==========

// 获取数据
async function fetchData() {
  loading.value = true
  try {
    // 模拟延迟
    // const res = await UserApi.getUserList({
    //   page: pagination.currentPage,
    //   pageSize: pagination.pageSize,
    //   ...searchForm,
    // })
    // tableData.value = res.list
    // pagination.total = res.total

    // Mock 数据
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockList: UserInfo[] = Array.from({ length: 10 }).map((_, index) => ({
      id: index + 1 + (pagination.currentPage - 1) * 10,
      username: `user_${index + 1}`,
      nickname: `测试用户${index + 1}`,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: `user${index + 1}@example.com`,
      phone: `1380013800${index}`,
      status: index % 3 === 0 ? 0 : 1, // 模拟部分禁用
      role: index === 0 ? 'admin' : 'user',
      createdAt: '2023-01-01 12:00:00',
      updatedAt: '2023-01-02 12:00:00',
    }))

    // 简单的前端筛选模拟
    let filtered = mockList
    if (searchForm.username) {
      filtered = filtered.filter((u) => u.username.includes(searchForm.username))
    }

    tableData.value = filtered
    pagination.total = 100 // 假装有100条
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

// 重置
function handleReset() {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.status = ''
  handleSearch()
}

// 切换状态（封禁/解禁）
async function handleStatusChange(row: any) {
  const text = row.status === 1 ? '启用' : '禁用'
  try {
    // await UserApi.updateUserStatus(row.id, row.status)
    await new Promise((resolve) => setTimeout(resolve, 300)) // Mock
    ElMessage.success(`${text}成功`)
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1 // 恢复原状
    ElMessage.error(`${text}失败`)
  }
}

// 打开新增弹窗
function handleAdd() {
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
  // 重置表单
  formData.id = 0
  formData.username = ''
  formData.nickname = ''
  formData.password = ''
  formData.email = ''
  formData.phone = ''
  formData.role = 'user'
  formData.status = 1
}

// 打开编辑弹窗
function handleEdit(row: UserInfo) {
  dialogTitle.value = '编辑用户'
  dialogVisible.value = true
  // 填充表单
  Object.assign(formData, row)
  formData.password = '' // 编辑时不显示密码
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      // 模拟提交
      await new Promise((resolve) => setTimeout(resolve, 500))
      ElMessage.success(formData.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error('操作失败')
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="150" align="center">
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
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" />
        </el-form-item>
        <el-form-item v-if="!formData.id" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
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
  .search-card {
    margin-bottom: 20px;
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
