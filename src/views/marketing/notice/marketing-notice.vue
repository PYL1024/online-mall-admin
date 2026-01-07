```vue
<script setup lang="ts">
/**
 * 商城公告管理页面
 * 负责人：成员 D
 * 功能：公告发布、内容管理、状态控制
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Timer, Plus, Edit, Delete, Check } from '@element-plus/icons-vue'
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
  <div class="notice-container">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="title-group">
        <div class="title-decorator"></div>
        <div>
          <h2 class="main-title">
            <span class="title-icon">📢</span>
            公告管理
          </h2>
          <span class="sub-title">营销推广 · 商城公告发布与管理</span>
        </div>
      </div>
      <div class="header-extras">
        <div class="date-badge">
          <el-icon><Timer /></el-icon>
          <span>{{ new Date().toLocaleDateString() }}</span>
        </div>
        <div class="count-badge">
          <el-icon><Bell /></el-icon>
          <span>公告: {{ noticeList.length }}</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <span class="stat-emoji">📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">公告总数</div>
          <div class="stat-value">{{ noticeList.length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
          <span class="stat-emoji">✅</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">展示中</div>
          <div class="stat-value success">{{ onlineCount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #a8a8a8, #6b6b6b);">
          <span class="stat-emoji">⏸️</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">已下线</div>
          <div class="stat-value">{{ offlineCount }}</div>
        </div>
      </div>
      <div class="stat-card add-card" @click="openCreateDialog">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
          <el-icon :size="28"><Plus /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">快速发布</div>
          <div class="stat-value add-text">新建公告</div>
        </div>
      </div>
    </div>

    <!-- 公告列表 -->
    <div class="list-card">
      <div class="card-header">
        <h3>
          <el-icon><Bell /></el-icon>
          公告列表
        </h3>
        <span class="card-badge">实时数据</span>
      </div>
      
      <div class="notice-grid">
        <div 
          v-for="(item, index) in noticeList" 
          :key="item.id" 
          class="notice-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="notice-header">
            <div class="notice-title">{{ item.title }}</div>
            <el-tag 
              :type="item.isActive === 1 ? 'success' : 'info'" 
              effect="light"
              size="small"
              class="status-tag"
            >
              <span v-if="item.isActive === 1" class="pulse-dot"></span>
              {{ item.isActive === 1 ? '展示中' : '已下线' }}
            </el-tag>
          </div>
          <div class="notice-content">{{ item.content }}</div>
          <div class="notice-footer">
            <div class="publish-time">
              <el-icon><Timer /></el-icon>
              <span>{{ item.createTime }}</span>
            </div>
            <div class="notice-actions">
              <el-button 
                size="small" 
                :type="item.isActive === 1 ? 'warning' : 'success'"
                plain
                @click="handleStatusChange(item)"
              >
                {{ item.isActive === 1 ? '下线' : '上线' }}
              </el-button>
              <el-button size="small" type="primary" plain @click="openEditDialog(item)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="noticeList.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无公告</div>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          发布第一条公告
        </el-button>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      width="560px"
      :close-on-click-modal="false"
      class="notice-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-title">
            <el-icon class="dialog-icon"><Bell /></el-icon>
            <span>{{ isEdit ? '编辑公告' : '发布公告' }}</span>
          </div>
          <span class="dialog-subtitle">{{ isEdit ? '修改公告内容' : '发布新的商城公告' }}</span>
        </div>
      </template>
      
      <el-form :model="noticeForm" label-width="80px" class="notice-form">
        <el-form-item label="标题" required>
          <el-input 
            v-model="noticeForm.title" 
            placeholder="请输入公告标题" 
            maxlength="50"
            show-word-limit
            clearable
          >
            <template #prefix>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>
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
            :rows="6" 
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
            active-color="#667eea"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit" class="confirm-btn">
            <el-icon v-if="!submitLoading"><Check /></el-icon>
            {{ isEdit ? '保存修改' : '发布公告' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.notice-container {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 0 0 50% 50% / 0 0 80px 80px;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* 头部区域 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.6s ease-out;

  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;

    .title-decorator {
      width: 4px;
      height: 48px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 2px;
      animation: stretch 1s ease-in-out infinite alternate;
    }

    .main-title {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;

      .title-icon {
        font-size: 32px;
        animation: bounce 2s ease-in-out infinite;
      }
    }

    .sub-title {
      font-size: 14px;
      color: #909399;
      margin-left: 4px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  }

  .header-extras {
    display: flex;
    gap: 12px;
    align-items: center;

    .date-badge, .count-badge {
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
      cursor: default;

      &:hover {
        transform: translateY(-2px);
      }

      .el-icon {
        font-size: 16px;
      }
    }

    .date-badge {
      background: linear-gradient(135deg, #667eea15, #764ba215);
      color: #667eea;
      border: 1px solid #667eea30;
    }

    .count-badge {
      background: linear-gradient(135deg, #67c23a15, #85ce6115);
      color: #67c23a;
      border: 1px solid #67c23a30;
    }
  }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;

  .stat-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.6s ease-out backwards;

    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.4s; }

    &:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

      .stat-icon-wrapper {
        transform: rotate(360deg) scale(1.1);
      }
    }

    &.add-card {
      cursor: pointer;
      border: 2px dashed transparent;

      &:hover {
        border-color: #667eea50;
      }

      .add-text {
        color: #667eea;
        font-size: 16px !important;
      }
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      color: #fff;

      .stat-emoji {
        font-size: 26px;
      }
    }

    .stat-info {
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;

        &.success {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }
  }
}

/* 列表卡片 */
.list-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 0.6s ease-out backwards;
  animation-delay: 0.3s;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f2f5;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #667eea;
      }
    }

    .card-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea15, #764ba215);
      color: #667eea;
      font-weight: 600;
      border: 1px solid #667eea30;
    }
  }
}

/* 公告网格 */
.notice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.notice-card {
  background: linear-gradient(135deg, #667eea08, #764ba208);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #667eea20;
  transition: all 0.3s;
  animation: fadeInUp 0.5s ease-out backwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    border-color: #667eea40;
  }

  .notice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .notice-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      flex: 1;
      margin-right: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px;
      font-weight: 500;

      .pulse-dot {
        width: 6px;
        height: 6px;
        background: #67c23a;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }

  .notice-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notice-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .publish-time {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #909399;

      .el-icon {
        font-size: 14px;
      }
    }

    .notice-actions {
      display: flex;
      gap: 8px;

      .el-button {
        padding: 6px 10px;
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
    color: #909399;
    margin-bottom: 24px;
  }
}

/* 对话框样式 */
:deep(.notice-dialog) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    
    .el-dialog__close {
      color: #fff;
      font-size: 20px;
      
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .el-dialog__body {
    padding: 24px 28px;
    background: #fff;
  }

  .el-dialog__footer {
    padding: 16px 28px 24px;
    background: #fff;
    border-top: 1px solid #f0f2f5;
  }
}

.dialog-header {
  padding: 20px 28px;
  
  .dialog-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;

    .dialog-icon {
      font-size: 24px;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px;
      border-radius: 8px;
    }
  }

  .dialog-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    margin-left: 44px;
  }
}

.notice-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 0 0 1px #667eea inset;
    }

    &:focus,
    &.is-focus {
      box-shadow: 0 0 0 1px #667eea inset, 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.el-input__prefix) {
    color: #667eea;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .cancel-btn {
    border-radius: 10px;
    padding: 10px 24px;
    font-weight: 500;
    border: 1px solid #dcdfe6;
    transition: all 0.3s;

    &:hover {
      border-color: #667eea;
      color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }
  }

  .confirm-btn {
    border-radius: 10px;
    padding: 10px 24px;
    font-weight: 500;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
  }
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes stretch {
  from {
    transform: scaleY(1);
  }
  to {
    transform: scaleY(1.1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .notice-container {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
    padding: 20px !important;

    .title-group {
      .main-title {
        font-size: 24px;
      }

      .title-decorator {
        height: 40px;
      }
    }

    .header-extras {
      width: 100%;
      justify-content: space-between;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .notice-grid {
    grid-template-columns: 1fr;
  }

  .notice-card .notice-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;

    .notice-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
```
