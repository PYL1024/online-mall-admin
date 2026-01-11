<script setup lang="ts">
/**
 * 商城公告管理页面
 * 负责人：成员 D
 * 功能：公告发布、内容管理、状态控制
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getNoticeList, 
  addNotice, 
  updateNotice, 
  deleteNotice,
  type Notice,
  type NoticeParams
} from '@/api'

const noticeList = ref<Notice[]>([])
const loading = ref(true)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)

const noticeForm = reactive<NoticeParams>({
  id: undefined,
  title: '',
  content: '',
  type: 1,
  sortOrder: 0,
  isActive: 1
})

const resetForm = () => {
  noticeForm.id = undefined
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.type = 1
  noticeForm.sortOrder = 0
  noticeForm.isActive = 1
}

const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: Notice) => {
  isEdit.value = true
  noticeForm.id = row.id
  noticeForm.title = row.title
  noticeForm.content = row.content
  noticeForm.type = row.type
  noticeForm.sortOrder = row.sortOrder
  noticeForm.isActive = row.isActive
  dialogVisible.value = true
}

/* ========================
   获取公告列表
======================== */
const fetchNoticeList = async () => {
  loading.value = true
  try {
    const res = await getNoticeList({ page: 1, pageSize: 100 })
    noticeList.value = res.list
    total.value = res.total
    if (res.list.length === 0) {
      ElMessage.warning('暂无公告数据')
    } else {
      ElMessage.success(`成功加载 ${res.list.length} 条公告`)
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

/* ========================
   新增/编辑公告
======================== */
const handleSubmit = async () => {
  if (!noticeForm.title || !noticeForm.content) {
    ElMessage.warning('请填写完整公告信息')
    return
  }
  
  submitLoading.value = true
  try {
    if (isEdit.value && noticeForm.id) {
      await updateNotice(noticeForm.id, noticeForm)
      ElMessage.success('公告已更新')
    } else {
      await addNotice(noticeForm)
      ElMessage.success('公告已发布')
    }
    dialogVisible.value = false
    fetchNoticeList()
  } catch (error) {
    console.error('保存公告失败:', error)
    ElMessage.error('保存公告失败')
  } finally {
    submitLoading.value = false
  }
}

/* ========================
   删除公告
======================== */
const handleDelete = async (row: Notice) => {
  try {
    await ElMessageBox.confirm(`确认删除公告「${row.title}」吗？`, '提示', { 
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteNotice(row.id)
    ElMessage.success('删除成功')
    fetchNoticeList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除公告失败:', error)
      ElMessage.error('删除公告失败')
    }
  }
}

/* ========================
   状态切换
======================== */
const handleStatusChange = (row: Notice) => {
  const newStatus = row.isActive === 1 ? 0 : 1
  ElMessage.success(newStatus === 1 ? '公告已上线' : '公告已下线')
  // TODO: 调用 updateNoticeStatus API
}

const onlineCount = computed(() => noticeList.value.filter(n => n.isActive === 1).length)
const offlineCount = computed(() => noticeList.value.filter(n => n.isActive === 0).length)

/* ========================
   生命周期
======================== */
onMounted(() => {
  fetchNoticeList()
})
</script>

<template>
  <div class="notice-page">
    <el-card shadow="never" class="main-card">
      <div class="card-header">
        <div>
          <h2 class="title">公告管理</h2>
          <p class="sub-title">发布和管理商城公告，支持多种公告类型</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">发布公告</el-button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">公告总数</span>
          <span class="stat-value">{{ noticeList.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">展示中</span>
          <span class="stat-value success">{{ onlineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已下线</span>
          <span class="stat-value">{{ offlineCount }}</span>
        </div>
      </div>

      <el-table :data="noticeList" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />

        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : row.type === 2 ? 'warning' : 'info'" size="small" effect="light">
              {{ row.type === 1 ? '系统公告' : row.type === 2 ? '活动公告' : '维护公告' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'" size="small" effect="light">
              {{ row.isActive === 1 ? '展示中' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="发布时间" width="170" align="center" />

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.isActive === 1 ? 'warning' : 'success'" 
              size="small" 
              @click="handleStatusChange(row)"
            >
              {{ row.isActive === 1 ? '下线' : '上线' }}
            </el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="noticeList.length === 0 && !loading" description="暂无公告">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">发布第一条公告</el-button>
      </el-empty>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input 
            v-model="noticeForm.title" 
            placeholder="请输入公告标题" 
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="noticeForm.type" placeholder="请选择公告类型" style="width: 100%;">
            <el-option :value="1" label="系统公告" />
            <el-option :value="2" label="活动公告" />
            <el-option :value="3" label="维护公告" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input 
            type="textarea" 
            :rows="5" 
            v-model="noticeForm.content" 
            placeholder="请输入公告内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch 
            v-model="noticeForm.isActive" 
            :active-value="1"
            :inactive-value="0"
            active-text="展示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '发布公告' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.notice-page {
  padding: 20px;
}

.main-card {
  border-radius: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.sub-title {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-row {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f6f7fb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-label {
    font-size: 13px;
    color: #909399;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #303133;

    &.success {
      color: #67c23a;
    }
  }
}
</style>
