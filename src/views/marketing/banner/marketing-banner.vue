<script setup lang="ts">
/**
 * 轮播图管理页面（Banner Management）
 * 负责人：成员 D
 * 功能：轮播图列表、图片上传、排序、跳转链接配置
 */

import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCarouselList, deleteCarousel, addCarousel, type CarouselItem, type AddCarouselParams } from '@/api'

/* ========================
   一、响应式数据
======================== */
const bannerList = ref<CarouselItem[]>([])
const loading = ref(false)

// 新增对话框
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addForm = reactive<AddCarouselParams>({
  imgUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: 1
})

/* ========================
   二、获取轮播图列表
======================== */
const fetchCarouselData = async () => {
  loading.value = true
  try {
    const res = await getCarouselList()
    bannerList.value = res
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    ElMessage.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

/* ========================
   三、新增轮播图
======================== */
const openAddDialog = () => {
  addForm.imgUrl = ''
  addForm.linkUrl = ''
  addForm.sortOrder = 0
  addForm.isActive = 1
  addDialogVisible.value = true
}

const handleAddCarousel = async () => {
  if (!addForm.imgUrl) {
    ElMessage.warning('请输入图片URL')
    return
  }
  addLoading.value = true
  try {
    await addCarousel(addForm)
    ElMessage.success('新增成功')
    addDialogVisible.value = false
    fetchCarouselData()
  } catch (error) {
    console.error('新增失败:', error)
    ElMessage.error('新增失败')
  } finally {
    addLoading.value = false
  }
}

/* ========================
   四、状态切换
======================== */
const handleStatusChange = () => {
  // TODO: 对接真实API后，调用更新状态接口
  ElMessage.info('请等待后端提供状态更新API')
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
  <div class="banner-page">
    <el-card shadow="never" class="main-card">
      <div class="card-header">
        <div>
          <h2 class="title">轮播图管理</h2>
          <p class="sub-title">管理首页轮播图，支持图片上传、排序、跳转链接配置</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="openAddDialog">新增轮播图</el-button>
        </div>
      </div>

      <el-table 
        :data="bannerList" 
        style="width: 100%" 
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />

        <el-table-column label="图片预览" width="200">
          <template #default="scope">
            <el-image 
              :src="scope.row.imgUrl" 
              fit="cover"
              style="width: 160px; height: 60px; border-radius: 4px;"
              :preview-src-list="[scope.row.imgUrl]"
              preview-teleported
            />
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
              <span style="color: #909399;">未设置</span>
            </template>
          </template>
        </el-table-column>

        <el-table-column label="启用状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isActive === 1 ? 'success' : 'info'" effect="light">
              {{ scope.row.isActive === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleStatusChange">
              {{ scope.row.isActive === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增轮播图对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增轮播图"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="图片URL" required>
          <el-input 
            v-model="addForm.imgUrl" 
            placeholder="请输入图片URL（必填）"
            clearable
          />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input 
            v-model="addForm.linkUrl" 
            placeholder="请输入跳转链接（选填）"
            clearable
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number 
            v-model="addForm.sortOrder" 
            :min="0" 
            :max="999"
          />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">数字越小排序越靠前</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch 
            v-model="addForm.isActive" 
            :active-value="1" 
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item v-if="addForm.imgUrl" label="图片预览">
          <el-image 
            :src="addForm.imgUrl" 
            fit="contain"
            style="max-width: 300px; max-height: 120px; border-radius: 4px;"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAddCarousel">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.banner-page {
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
</style>
