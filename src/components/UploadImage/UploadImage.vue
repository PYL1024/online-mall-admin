<script setup lang="ts">
import { ref } from 'vue'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadProps, UploadFile } from 'element-plus'

interface Props {
  modelValue?: string | string[]
  limit?: number
  multiple?: boolean
  fileSize?: number // MB
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  limit: 1,
  multiple: false,
  fileSize: 5,
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

// 上传成功（模拟）
const handleSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  // 实际项目中这里应该处理后端返回的 URL
  // 这里做个 Mock 效果，直接用本地 URL
  ElMessage.success('上传成功')
}

// 状态改变（因为没有真实后端，我们在这里处理）
const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  // 模拟上传成功，直接使用 Object URL
  if (uploadFile.status === 'ready') {
    uploadFile.status = 'success'
    // 实际开发中应该是上传服务器返回 url
    // uploadFile.url = URL.createObjectURL(uploadFile.raw!)
    // 此时 Element Plus 已经生成了 blob url
  }

  if (uploadFile.status === 'success') {
    emitUpdate(uploadFiles)
  }
}

// 上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (
    rawFile.type !== 'image/jpeg' &&
    rawFile.type !== 'image/png' &&
    rawFile.type !== 'image/gif'
  ) {
    ElMessage.error('Avatar picture must be JPG/PNG/GIF format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > props.fileSize) {
    ElMessage.error(`Avatar picture size can not exceed ${props.fileSize}MB!`)
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
