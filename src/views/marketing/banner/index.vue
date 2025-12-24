<script setup lang="ts">
/**
 * 轮播图管理页面（Banner Management）
 * 负责人：成员 D
 * 功能：轮播图列表、图片上传、排序、跳转链接配置
 */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/* ========================
   一、轮播图数据（模拟）
======================== */
interface BannerItem {
  id: number
  title: string
  imageUrl: string
  link: string
  order: number
  status: boolean
}

const bannerList = ref<BannerItem[]>([
  {
    id: 1,
    title: '联想新品上市',
    imageUrl: 'https://via.placeholder.com/300x120?text=Banner+1',
    link: 'https://www.lenovo.com',
    order: 1,
    status: true
  },
  {
    id: 2,
    title: '拯救者系列促销',
    imageUrl: 'https://via.placeholder.com/300x120?text=Banner+2',
    link: 'https://www.lenovo.com',
    order: 2,
    status: true
  }
])

/* ========================
   二、上传成功回调（模拟）
======================== */
const handleUploadSuccess = () => {
  ElMessage.success('图片上传成功（模拟）')
}

/* ========================
   三、状态切换
======================== */
const handleStatusChange = () => {
  ElMessage.success('状态已更新（模拟）')
}
</script>

<template>
  <div class="banner-container">
    <!-- 顶部品牌标签 -->
    <div class="page-header">
      <span class="lenovo-tag">Lenovo Banner Management</span>
    </div>

    <!-- 上传区域 -->
    <el-card shadow="never" class="upload-card">
      <template #header>
        <span>新增轮播图</span>
      </template>

      <el-upload
        class="upload"
        action="#"
        :show-file-list="false"
        :on-success="handleUploadSuccess"
      >
        <el-button type="primary">上传轮播图</el-button>
      </el-upload>
    </el-card>

    <!-- 轮播图列表 -->
    <el-card shadow="never">
      <template #header>
        <span>轮播图列表</span>
      </template>

      <el-table :data="bannerList" style="width: 100%">
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column prop="title" label="标题" />

        <el-table-column label="图片预览" width="180">
          <template #default="scope">
            <img :src="scope.row.imageUrl" class="banner-img" />
          </template>
        </el-table-column>

        <el-table-column prop="link" label="跳转链接" />

        <el-table-column label="启用状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              @change="handleStatusChange"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.banner-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.lenovo-tag {
  display: inline-block;
  padding: 6px 14px;
  background: #e2231a;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
  letter-spacing: 1px;
}

.upload-card {
  margin-bottom: 24px;
}

.banner-img {
  width: 160px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
</style>
