```vue
<script setup lang="ts">
/**
 * 商城公告管理页面（炫酷美观版）
 * 负责人：成员 D
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'

interface Notice {
  id: number
  title: string
  content: string
  publishTime: string
  status: boolean
}

const noticeList = ref<Notice[]>([
  {
    id: 1,
    title: '春节期间发货说明',
    content: '春节期间订单将在节后统一发货，请您谅解。',
    publishTime: '2025-01-10',
    status: true
  }
])

const dialogVisible = ref(false)
const isEdit = ref(false)

const noticeForm = reactive<Notice>({
  id: 0,
  title: '',
  content: '',
  publishTime: '',
  status: true
})

const openCreateDialog = () => {
  isEdit.value = false
  Object.assign(noticeForm, {
    id: Date.now(),
    title: '',
    content: '',
    publishTime: new Date().toISOString().slice(0, 10),
    status: true
  })
  dialogVisible.value = true
}

const openEditDialog = (row: Notice) => {
  isEdit.value = true
  Object.assign(noticeForm, row)
  dialogVisible.value = true
}

const handleSubmit = () => {
  if (!noticeForm.title || !noticeForm.content) {
    ElMessage.warning('请填写完整公告信息')
    return
  }
  if (isEdit.value) {
    const i = noticeList.value.findIndex(n => n.id === noticeForm.id)
    noticeList.value[i] = { ...noticeForm }
    ElMessage.success('公告已更新')
  } else {
    noticeList.value.unshift({ ...noticeForm })
    ElMessage.success('公告已发布')
  }
  dialogVisible.value = false
}

const handleDelete = (row: Notice) => {
  ElMessageBox.confirm(`确认删除公告「${row.title}」吗？`, '提示', { type: 'warning' })
    .then(() => {
      noticeList.value = noticeList.value.filter(n => n.id !== row.id)
      ElMessage.success('删除成功')
    })
}

const onlineCount = computed(() => noticeList.value.filter(n => n.status).length)
</script>

<template>
  <div class="notice-page">
    <!-- 顶部渐变 Banner -->
    <div class="banner">
      <div class="banner-left">
        <el-icon size="28"><Bell /></el-icon>
        <div>
          <div class="title">商城公告中心</div>
          <div class="sub">公告发布 · 内容管理 · 状态控制</div>
        </div>
      </div>
      <el-button type="primary" size="large" @click="openCreateDialog">发布公告</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats">
      <el-card shadow="hover">
        <div class="stat-num">{{ noticeList.length }}</div>
        <div class="stat-label">公告总数</div>
      </el-card>
      <el-card shadow="hover">
        <div class="stat-num success">{{ onlineCount }}</div>
        <div class="stat-label">展示中</div>
      </el-card>
    </div>

    <!-- 公告卡片列表 -->
    <div class="notice-list">
      <el-card
        v-for="item in noticeList"
        :key="item.id"
        class="notice-card"
        shadow="hover"
      >
        <div class="card-header">
          <span class="card-title">{{ item.title }}</span>
          <el-tag :type="item.status ? 'success' : 'info'">
            {{ item.status ? '显示中' : '已下线' }}
          </el-tag>
        </div>
        <div class="card-content">{{ item.content }}</div>
        <div class="card-footer">
          <span class="time">{{ item.publishTime }}</span>
          <div class="actions">
            <el-button size="small" text @click="openEditDialog(item)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(item)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="520px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input type="textarea" rows="6" v-model="noticeForm.content" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="noticeForm.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.notice-page {
  padding: 20px;
}

.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff, #f5f7fa);
  color: #303133;
  margin-bottom: 24px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.sub {
  font-size: 13px;
  opacity: 0.9;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-num {
  font-size: 28px;
  font-weight: bold;
}

.stat-num.success {
  color: #67c23a;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.notice-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.notice-card {
  transition: transform 0.2s ease;
}

.notice-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-weight: 600;
}

.card-content {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 12px;
  color: #909399;
}
</style>
```
