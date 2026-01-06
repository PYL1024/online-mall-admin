<script setup lang="ts">
/**
 * 单图上传组件
 * 注意：图片不单独上传，使用本地Blob URL预览，保存商品时一起提交
 */
import { ref } from 'vue'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadProps, UploadFile } from 'element-plus'

interface Props {
  modelValue?: string | string[]
  limit?: number
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  limit: 1,
  multiple: false,
})

const emit = defineEmits(['update:modelValue'])

// 图片列表
const fileList = ref<UploadFile[]>([])

// 预览图片
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

// 移除图片
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  emitUpdate(uploadFiles)
}

// 图片预览
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}

/**
 * 将文件转换为 Base64 Data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 状态改变 - 将图片转换为 Base64 Data URL
const handleChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
  if (uploadFile.status === 'ready' && uploadFile.raw) {
    try {
      // 将图片转换为 Base64 Data URL
      const base64Url = await fileToBase64(uploadFile.raw)
      uploadFile.status = 'success'
      uploadFile.url = base64Url

      emitUpdate(uploadFiles)
      ElMessage.success('图片添加成功')
    } catch (error) {
      console.error('图片转换失败:', error)
      ElMessage.error('图片处理失败，请重试')
    }
  }
}

// 上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error('只支持 JPG/PNG/GIF/WebP 格式的图片')
    return false
  }
  return true
}

// 更新父组件
function emitUpdate(files: UploadFile[]) {
  const urls = files.map((f) => f.url || '').filter((u) => u)
  if (props.multiple) {
    emit('update:modelValue', urls)
  } else {
    emit('update:modelValue', urls[0] || '')
  }
}
</script>

<template>
  <div class="upload-image-container">
    <el-upload
      v-model:file-list="fileList"
      action="#"
      list-type="picture-card"
      :auto-upload="false"
      :on-preview="handlePictureCardPreview"
      :on-remove="handleRemove"
      :on-change="handleChange"
      :before-upload="beforeUpload"
      :limit="limit"
      :multiple="multiple"
    >
      <el-icon><Plus /></el-icon>
    </el-upload>

    <el-dialog v-model="dialogVisible">
      <img w-full :src="dialogImageUrl" alt="Preview Image" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.upload-image-container {
  // 自定义样式如果需要
}
</style>
