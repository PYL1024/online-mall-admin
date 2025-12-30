<script setup lang="ts">
/**
 * 轮播图管理页面（Banner Management）
 * 负责人：成员 D
 * 功能：轮播图列表、图片上传、排序、跳转链接配置
 */

import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Timer, Upload, Plus, Link } from '@element-plus/icons-vue'
import { getCarouselList, deleteCarousel, addCarousel, type CarouselItem, type AddCarouselParams } from '@/api'

/* ========================
   一、轮播图数据
======================== */
const bannerList = ref<CarouselItem[]>([])
const loading = ref(true)

/* ========================
   二、新增轮播图表单
======================== */
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addForm = reactive<AddCarouselParams>({
  imgUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: 1
})

const resetAddForm = () => {
  addForm.imgUrl = ''
  addForm.linkUrl = ''
  addForm.sortOrder = 0
  addForm.isActive = 1
}

const openAddDialog = () => {
  resetAddForm()
  addDialogVisible.value = true
}

const handleAddCarousel = async () => {
  if (!addForm.imgUrl) {
    ElMessage.warning('请输入图片URL')
    return
  }
  
  addLoading.value = true
  try {
    await addCarousel({
      imgUrl: addForm.imgUrl,
      linkUrl: addForm.linkUrl || undefined,
      sortOrder: addForm.sortOrder,
      isActive: addForm.isActive
    })
    ElMessage.success('新增轮播图成功')
    addDialogVisible.value = false
    fetchCarouselData()
  } catch (error) {
    console.error('新增轮播图失败:', error)
    ElMessage.error('新增轮播图失败')
  } finally {
    addLoading.value = false
  }
}

/* ========================
   三、获取轮播图数据
======================== */
const fetchCarouselData = async () => {
  loading.value = true
  try {
    const data = await getCarouselList()
    console.log('轮播图数据:', data) // 调试：查看返回数据
    bannerList.value = data
    if (data.length === 0) {
      ElMessage.warning('暂无轮播图数据')
    } else {
      ElMessage.success(`成功加载 ${data.length} 条轮播图`)
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
    ElMessage.error('获取轮播图失败')
  } finally {
    loading.value = false
  }
}

/* ========================
   四、状态切换
======================== */
const handleStatusChange = () => {
  ElMessage.success('状态已更新（模拟）')
}

/* ========================
   五、删除轮播图
======================== */
const handleDelete = async (row: CarouselItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这个轮播图吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCarousel(row.id)
    ElMessage.success('删除成功')
    fetchCarouselData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

/* ========================
   六、生命周期
======================== */
onMounted(() => {
  fetchCarouselData()
})
</script>


<template>
  <div class="banner-container">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="title-group">
        <div class="title-decorator"></div>
        <div>
          <h2 class="main-title">
            <span class="title-icon">🖼️</span>
            轮播图管理
          </h2>
          <span class="sub-title">营销推广 · 首页轮播配置</span>
        </div>
      </div>
      <div class="header-extras">
        <div class="date-badge">
          <el-icon><Timer /></el-icon>
          <span>{{ new Date().toLocaleDateString() }}</span>
        </div>
        <div class="count-badge">
          <el-icon><Picture /></el-icon>
          <span>轮播图: {{ bannerList.length }}</span>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <div class="upload-card">
      <div class="card-header">
        <h3>
          <el-icon><Upload /></el-icon>
          新增轮播图
        </h3>
        <span class="card-badge">上传配置</span>
      </div>
      <div class="upload-content">
        <div class="add-btn-wrapper" @click="openAddDialog">
          <div class="add-btn-inner">
            <el-icon class="add-icon"><Plus /></el-icon>
            <div class="add-text">
              <span class="primary-text">点击新增轮播图</span>
              <span class="secondary-text">填写图片URL和跳转链接</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增轮播图对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增轮播图"
      width="560px"
      :close-on-click-modal="false"
      class="add-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-title">
            <el-icon class="dialog-icon"><Plus /></el-icon>
            <span>新增轮播图</span>
          </div>
          <span class="dialog-subtitle">添加首页轮播展示图片</span>
        </div>
      </template>
      <el-form :model="addForm" label-width="100px" class="add-form">
        <el-form-item label="图片URL" required>
          <el-input 
            v-model="addForm.imgUrl" 
            placeholder="请输入图片URL（必填）"
            clearable
          >
            <template #prefix>
              <el-icon><Picture /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input 
            v-model="addForm.linkUrl" 
            placeholder="请输入跳转链接（选填）"
            clearable
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number 
            v-model="addForm.sortOrder" 
            :min="0" 
            :max="999"
            placeholder="数字越小越靠前"
            class="sort-input"
          />
          <span class="form-tip">数字越小排序越靠前</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch 
            v-model="addForm.isActive" 
            :active-value="1" 
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            active-color="#667eea"
          />
        </el-form-item>
        <el-form-item v-if="addForm.imgUrl" label="图片预览">
          <div class="preview-img-wrapper">
            <img :src="addForm.imgUrl" class="preview-img" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="handleAddCarousel" class="confirm-btn">
            <el-icon v-if="!addLoading"><Plus /></el-icon>
            确认新增
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 轮播图列表 -->
    <div class="list-card">
      <div class="card-header">
        <h3>
          <el-icon><Picture /></el-icon>
          轮播图列表
        </h3>
        <span class="card-badge">实时数据</span>
      </div>
      <div class="table-wrapper">
        <el-table 
          :data="bannerList" 
          style="width: 100%" 
          v-loading="loading"
          :header-cell-style="{ background: 'linear-gradient(135deg, #667eea15, #764ba215)', color: '#303133', fontWeight: 600 }"
        >
          <el-table-column prop="sortOrder" label="排序" width="80" align="center">
            <template #default="scope">
              <span class="sort-badge">{{ scope.row.sortOrder }}</span>
            </template>
          </el-table-column>

          <el-table-column label="图片预览" width="220">
            <template #default="scope">
              <div class="img-preview-wrapper">
                <img :src="scope.row.imgUrl" class="banner-img" />
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="linkUrl" label="跳转链接" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <template v-if="scope.row.linkUrl">
                <el-link type="primary" :href="scope.row.linkUrl" target="_blank" :underline="false">
                  {{ scope.row.linkUrl }}
                </el-link>
              </template>
              <template v-else>
                <span class="empty-link">未设置</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="启用状态" width="120" align="center">
            <template #default="scope">
              <el-switch
                :model-value="scope.row.isActive === 1"
                @change="handleStatusChange"
                active-color="#667eea"
                inactive-color="#dcdfe6"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button 
                size="small" 
                type="danger" 
                plain
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner-container {
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

/* 卡片通用样式 */
.upload-card, .list-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  animation: fadeInUp 0.6s ease-out backwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

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

.upload-card {
  animation-delay: 0.1s;
}

.list-card {
  animation-delay: 0.2s;
}

/* 新增按钮区域 */
.upload-content {
  .add-btn-wrapper {
    width: 100%;
    height: 160px;
    border: 2px dashed #667eea50;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea08, #764ba208);
    transition: all 0.3s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea15, #764ba215);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
    }
  }

  .add-btn-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .add-icon {
      font-size: 48px;
      color: #667eea;
      animation: bounce 2s ease-in-out infinite;
    }

    .add-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .primary-text {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .secondary-text {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

/* 预览图片 */
.preview-img-wrapper {
  padding: 8px;
  background: linear-gradient(135deg, #667eea10, #764ba210);
  border-radius: 12px;
  display: inline-block;

  .preview-img {
    max-width: 300px;
    max-height: 120px;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

/* 表格样式 */
.table-wrapper {
  :deep(.el-table) {
    border-radius: 12px;
    overflow: hidden;

    .el-table__header-wrapper {
      border-radius: 12px 12px 0 0;
    }

    .el-table__row {
      transition: all 0.3s;

      &:hover {
        background: linear-gradient(135deg, #667eea08, #764ba208) !important;
      }
    }
  }
}

.sort-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.img-preview-wrapper {
  padding: 8px;
  background: linear-gradient(135deg, #667eea10, #764ba210);
  border-radius: 12px;
  display: inline-block;

  .banner-img {
    width: 180px;
    height: 68px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
  }
}

.empty-link {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}

/* 对话框样式 */
:deep(.add-dialog) {
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

.add-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 0 0 1px #667eea inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #667eea inset, 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.el-input__prefix) {
    color: #667eea;
  }

  .sort-input {
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      background: linear-gradient(135deg, #667eea15, #764ba215);
      border-color: #667eea30;
      color: #667eea;

      &:hover {
        color: #764ba2;
      }
    }
  }

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

/* 响应式 */
@media (max-width: 768px) {
  .banner-container {
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

  .upload-card, .list-card {
    padding: 16px;
  }

  .img-preview-wrapper .banner-img {
    width: 120px;
    height: 45px;
  }
}
</style>
