<script setup lang="ts">
/**
 * 多图上传组件
 * 支持批量上传、拖拽排序、图片预览和删除
 */
import { ref, computed, watch } from 'vue'
import {
  ElUpload,
  ElButton,
  ElDialog,
  ElImage,
  ElMessage,
  ElIcon,
} from 'element-plus'
import { Plus, Delete, ZoomIn, Rank } from '@element-plus/icons-vue'
import type { UploadFile, UploadProps } from 'element-plus'

// ==================== Props & Emits ====================

interface Props {
  modelValue: string[] // 图片URL数组
  maxCount?: number // 最大上传数量
  fileSize?: number // 单个文件大小限制（MB）
  accept?: string // 接受的文件类型
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 5,
  fileSize: 5,
  accept: 'image/jpeg,image/png,image/gif,image/webp',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}>()

// ==================== 状态定义 ====================

// 内部文件列表
const fileList = ref<UploadFile[]>([])

// 预览弹窗
const previewVisible = ref(false)
const previewUrl = ref('')
const previewIndex = ref(0)

// 拖拽状态
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// ==================== 计算属性 ====================

// 是否还能上传
const canUpload = computed(() => {
  return !props.disabled && fileList.value.length < props.maxCount
})

// 上传提示文字
const uploadTip = computed(() => {
  return `最多上传 ${props.maxCount} 张图片，单张不超过 ${props.fileSize}MB`
})

// 预览列表（用于大图预览）
const previewList = computed(() => {
  return fileList.value.map(f => f.url || '').filter(Boolean)
})

// ==================== 监听器 ====================

// 初始化文件列表（从外部值）
watch(
  () => props.modelValue,
  (newVal) => {
    // 避免重复更新
    const currentUrls = fileList.value.map(f => f.url).filter(Boolean)
    const isSame = newVal.length === currentUrls.length &&
                   newVal.every((url, i) => url === currentUrls[i])

    if (!isSame) {
      fileList.value = newVal.map((url, index) => ({
        uid: Date.now() + index,
        name: `image-${index}`,
        url,
        status: 'success',
      })) as UploadFile[]
    }
  },
  { immediate: true }
)

// ==================== 上传处理 ====================

/**
 * 上传前校验
 */
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 检查文件类型
  const acceptTypes = props.accept.split(',').map(t => t.trim())
  if (!acceptTypes.includes(rawFile.type)) {
    ElMessage.error(`只支持 ${acceptTypes.join('、')} 格式的图片`)
    return false
  }

  // 检查文件大小
  if (rawFile.size / 1024 / 1024 > props.fileSize) {
    ElMessage.error(`图片大小不能超过 ${props.fileSize}MB`)
    return false
  }

  // 检查数量限制
  if (fileList.value.length >= props.maxCount) {
    ElMessage.error(`最多只能上传 ${props.maxCount} 张图片`)
    return false
  }

  return true
}

/**
 * 文件状态改变（处理上传结果）
 * 注意：因为使用 auto-upload=false，这里手动处理
 */
const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.status === 'ready') {
    // 模拟上传成功，创建本地 URL
    // 实际项目中应该调用 API 上传到服务器
    uploadFile.status = 'success'
    uploadFile.url = URL.createObjectURL(uploadFile.raw!)

    // 模拟异步上传完成
    setTimeout(() => {
      emitUpdate()
      ElMessage.success('图片上传成功')
    }, 300)
  }
}

/**
 * 触发更新
 */
function emitUpdate() {
  const urls = fileList.value
    .filter(f => f.status === 'success' && f.url)
    .map(f => f.url!)

  emit('update:modelValue', urls)
  emit('change', urls)
}

// ==================== 图片操作 ====================

/**
 * 预览图片
 */
function handlePreview(file: UploadFile, index: number) {
  previewUrl.value = file.url || ''
  previewIndex.value = index
  previewVisible.value = true
}

/**
 * 删除图片
 */
function handleRemove(index: number) {
  fileList.value.splice(index, 1)
  emitUpdate()
}

/**
 * 上一张
 */
function handlePrevPreview() {
  if (previewIndex.value > 0) {
    previewIndex.value--
    previewUrl.value = previewList.value[previewIndex.value] || ''
  }
}

/**
 * 下一张
 */
function handleNextPreview() {
  if (previewIndex.value < previewList.value.length - 1) {
    previewIndex.value++
    previewUrl.value = previewList.value[previewIndex.value] || ''
  }
}

// ==================== 拖拽排序 ====================

/**
 * 拖拽开始
 */
function handleDragStart(index: number) {
  dragIndex.value = index
}

/**
 * 拖拽经过
 */
function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

/**
 * 拖拽离开
 */
function handleDragLeave() {
  dragOverIndex.value = null
}

/**
 * 拖拽放置
 */
function handleDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }

  // 交换位置
  const dragItem = fileList.value[dragIndex.value]
  if (!dragItem) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }

  fileList.value.splice(dragIndex.value, 1)
  fileList.value.splice(index, 0, dragItem)

  dragIndex.value = null
  dragOverIndex.value = null

  emitUpdate()
  ElMessage.success('排序已更新')
}

/**
 * 拖拽结束
 */
function handleDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="multi-image-upload">
    <!-- 图片列表 -->
    <div class="image-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid"
        class="image-item"
        :class="{
          dragging: dragIndex === index,
          'drag-over': dragOverIndex === index,
        }"
        draggable="true"
        @dragstart="handleDragStart(index)"
        @dragover="(e) => handleDragOver(e, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(index)"
        @dragend="handleDragEnd"
      >
        <ElImage :src="file.url" fit="cover" class="image-preview" />

        <!-- 遮罩层操作按钮 -->
        <div class="image-actions">
          <ElIcon class="action-icon" @click="handlePreview(file, index)">
            <ZoomIn />
          </ElIcon>
          <ElIcon v-if="!disabled" class="action-icon" @click="handleRemove(index)">
            <Delete />
          </ElIcon>
        </div>

        <!-- 拖拽提示 -->
        <div class="drag-handle" v-if="!disabled">
          <ElIcon><Rank /></ElIcon>
        </div>

        <!-- 序号 -->
        <div class="image-index">{{ index + 1 }}</div>
      </div>

      <!-- 上传按钮 -->
      <div v-if="canUpload" class="upload-trigger">
        <ElUpload
          :file-list="fileList"
          :accept="accept"
          :auto-upload="false"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :on-change="handleChange"
          multiple
          :limit="maxCount"
        >
          <div class="upload-box">
            <ElIcon class="upload-icon"><Plus /></ElIcon>
            <span class="upload-text">上传图片</span>
          </div>
        </ElUpload>
      </div>
    </div>

    <!-- 提示文字 -->
    <div class="upload-tip">{{ uploadTip }}</div>

    <!-- 大图预览弹窗 -->
    <ElDialog
      v-model="previewVisible"
      title="图片预览"
      width="800px"
      class="preview-dialog"
    >
      <div class="preview-container">
        <ElImage :src="previewUrl" fit="contain" class="preview-image" />

        <!-- 切换按钮 -->
        <div class="preview-nav">
          <ElButton
            circle
            :disabled="previewIndex === 0"
            @click="handlePrevPreview"
          >
            ‹
          </ElButton>
          <span class="preview-indicator">
            {{ previewIndex + 1 }} / {{ previewList.length }}
          </span>
          <ElButton
            circle
            :disabled="previewIndex === previewList.length - 1"
            @click="handleNextPreview"
          >
            ›
          </ElButton>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.multi-image-upload {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  cursor: move;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;

    .image-actions {
      opacity: 1;
    }

    .drag-handle {
      opacity: 1;
    }
  }

  &.dragging {
    opacity: 0.5;
    border: 2px dashed #409eff;
  }

  &.drag-over {
    border: 2px dashed #67c23a;
    transform: scale(1.02);
  }

  .image-preview {
    width: 100%;
    height: 100%;
  }

  .image-actions {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    opacity: 0;
    transition: opacity 0.3s;

    .action-icon {
      font-size: 20px;
      color: #fff;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .drag-handle {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .image-index {
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.upload-trigger {
  width: 120px;
  height: 120px;

  :deep(.el-upload) {
    width: 100%;
    height: 100%;
  }

  .upload-box {
    width: 100%;
    height: 100%;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      background: #f5f7fa;

      .upload-icon {
        color: #409eff;
      }
    }

    .upload-icon {
      font-size: 28px;
      color: #909399;
      margin-bottom: 8px;
    }

    .upload-text {
      font-size: 12px;
      color: #909399;
    }
  }
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.preview-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.preview-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;

  .preview-image {
    max-width: 100%;
    max-height: 500px;
  }

  .preview-nav {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 16px;

    .preview-indicator {
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
