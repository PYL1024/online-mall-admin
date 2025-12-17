<script setup lang="ts">
/**
 * 富文本编辑器组件
 * 基于 contenteditable 实现简单的富文本编辑功能
 * 支持基本的文本格式化、图片插入、链接插入
 */
import { ref, watch, onMounted, computed } from 'vue'
import {
  ElButton,
  ElButtonGroup,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElIcon,
  ElDivider,
  ElColorPicker,
} from 'element-plus'
import {
  List,
  Link as LinkIcon,
  Picture,
  FullScreen,
  RefreshRight,
} from '@element-plus/icons-vue'

// ==================== Props & Emits ====================

interface Props {
  modelValue: string
  placeholder?: string
  height?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  height: '300px',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

// ==================== 状态定义 ====================

// 编辑器 DOM 引用
const editorRef = ref<HTMLDivElement | null>(null)

// 链接弹窗
const linkDialogVisible = ref(false)
const linkForm = ref({
  text: '',
  url: '',
})

// 图片弹窗
const imageDialogVisible = ref(false)
const imageForm = ref({
  url: '',
  width: '',
})

// 当前选区
const savedSelection = ref<Range | null>(null)

// 是否全屏
const isFullscreen = ref(false)

// 字体颜色
const textColor = ref('#000000')

// 背景颜色
const bgColor = ref('#ffffff')

// ==================== 计算属性 ====================

const editorStyle = computed(() => ({
  height: props.height,
  minHeight: '150px',
}))

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化编辑器内容
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

// ==================== 监听器 ====================

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (editorRef.value && editorRef.value.innerHTML !== newVal) {
      editorRef.value.innerHTML = newVal
    }
  }
)

// ==================== 编辑器操作 ====================

/**
 * 保存当前选区
 */
function saveSelection() {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    savedSelection.value = selection.getRangeAt(0).cloneRange()
  }
}

/**
 * 恢复选区
 */
function restoreSelection() {
  if (savedSelection.value) {
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(savedSelection.value)
    }
  }
}

/**
 * 内容变化处理
 */
function handleInput() {
  if (editorRef.value) {
    const html = editorRef.value.innerHTML
    emit('update:modelValue', html)
    emit('change', html)
  }
}

/**
 * 执行编辑命令
 */
function execCommand(command: string, value?: string) {
  if (props.disabled) return

  editorRef.value?.focus()
  restoreSelection()
  document.execCommand(command, false, value)
  handleInput()
}

/**
 * 加粗
 */
function handleBold() {
  execCommand('bold')
}

/**
 * 斜体
 */
function handleItalic() {
  execCommand('italic')
}

/**
 * 下划线
 */
function handleUnderline() {
  execCommand('underline')
}

/**
 * 删除线
 */
function handleStrikethrough() {
  execCommand('strikethrough')
}

/**
 * 无序列表
 */
function handleUnorderedList() {
  execCommand('insertUnorderedList')
}

/**
 * 有序列表
 */
function handleOrderedList() {
  execCommand('insertOrderedList')
}

/**
 * 左对齐
 */
function handleAlignLeft() {
  execCommand('justifyLeft')
}

/**
 * 居中
 */
function handleAlignCenter() {
  execCommand('justifyCenter')
}

/**
 * 右对齐
 */
function handleAlignRight() {
  execCommand('justifyRight')
}

/**
 * 字体颜色变化
 */
function handleTextColorChange(color: string | null) {
  if (color) {
    execCommand('foreColor', color)
  }
}

/**
 * 背景颜色变化
 */
function handleBgColorChange(color: string | null) {
  if (color) {
    execCommand('hiliteColor', color)
  }
}

/**
 * 清除格式
 */
function handleRemoveFormat() {
  execCommand('removeFormat')
}

// ==================== 链接操作 ====================

/**
 * 打开链接弹窗
 */
function openLinkDialog() {
  if (props.disabled) return

  saveSelection()
  const selection = window.getSelection()
  linkForm.value.text = selection?.toString() || ''
  linkForm.value.url = ''
  linkDialogVisible.value = true
}

/**
 * 插入链接
 */
function insertLink() {
  if (!linkForm.value.url) {
    ElMessage.warning('请输入链接地址')
    return
  }

  restoreSelection()
  editorRef.value?.focus()

  if (linkForm.value.text) {
    const html = `<a href="${linkForm.value.url}" target="_blank">${linkForm.value.text}</a>`
    document.execCommand('insertHTML', false, html)
  } else {
    document.execCommand('createLink', false, linkForm.value.url)
  }

  linkDialogVisible.value = false
  handleInput()
}

// ==================== 图片操作 ====================

/**
 * 打开图片弹窗
 */
function openImageDialog() {
  if (props.disabled) return

  saveSelection()
  imageForm.value.url = ''
  imageForm.value.width = '100%'
  imageDialogVisible.value = true
}

/**
 * 插入图片
 */
function insertImage() {
  if (!imageForm.value.url) {
    ElMessage.warning('请输入图片地址')
    return
  }

  restoreSelection()
  editorRef.value?.focus()

  const width = imageForm.value.width || '100%'
  const html = `<img src="${imageForm.value.url}" style="max-width: ${width};" />`
  document.execCommand('insertHTML', false, html)

  imageDialogVisible.value = false
  handleInput()
}

// ==================== 其他操作 ====================

/**
 * 切换全屏
 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

/**
 * 编辑器获取焦点时保存选区
 */
function handleSelectionChange() {
  saveSelection()
}

/**
 * 编辑器粘贴处理（清理格式）
 */
function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>

<template>
  <div class="editor-container" :class="{ fullscreen: isFullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <ElButtonGroup class="toolbar-group">
        <ElButton :disabled="disabled" @click="handleBold" title="加粗">
          <strong>B</strong>
        </ElButton>
        <ElButton :disabled="disabled" @click="handleItalic" title="斜体">
          <em>I</em>
        </ElButton>
        <ElButton :disabled="disabled" @click="handleUnderline" title="下划线">
          <span style="text-decoration: underline">U</span>
        </ElButton>
        <ElButton :disabled="disabled" @click="handleStrikethrough" title="删除线">
          <span style="text-decoration: line-through">S</span>
        </ElButton>
      </ElButtonGroup>

      <ElDivider direction="vertical" />

      <ElButtonGroup class="toolbar-group">
        <ElButton :disabled="disabled" @click="handleUnorderedList" title="无序列表">
          <ElIcon><List /></ElIcon>
        </ElButton>
        <ElButton :disabled="disabled" @click="handleOrderedList" title="有序列表">
          <span>1.</span>
        </ElButton>
      </ElButtonGroup>

      <ElDivider direction="vertical" />

      <ElButtonGroup class="toolbar-group">
        <ElButton :disabled="disabled" @click="handleAlignLeft" title="左对齐">
          ≡
        </ElButton>
        <ElButton :disabled="disabled" @click="handleAlignCenter" title="居中">
          ≡
        </ElButton>
        <ElButton :disabled="disabled" @click="handleAlignRight" title="右对齐">
          ≡
        </ElButton>
      </ElButtonGroup>

      <ElDivider direction="vertical" />

      <div class="toolbar-item">
        <span class="color-label">字色:</span>
        <ElColorPicker
          v-model="textColor"
          :disabled="disabled"
          size="small"
          @change="handleTextColorChange"
        />
      </div>

      <div class="toolbar-item">
        <span class="color-label">背景:</span>
        <ElColorPicker
          v-model="bgColor"
          :disabled="disabled"
          size="small"
          @change="handleBgColorChange"
        />
      </div>

      <ElDivider direction="vertical" />

      <ElButtonGroup class="toolbar-group">
        <ElButton :disabled="disabled" @click="openLinkDialog" title="插入链接">
          <ElIcon><LinkIcon /></ElIcon>
        </ElButton>
        <ElButton :disabled="disabled" @click="openImageDialog" title="插入图片">
          <ElIcon><Picture /></ElIcon>
        </ElButton>
      </ElButtonGroup>

      <ElDivider direction="vertical" />

      <ElButtonGroup class="toolbar-group">
        <ElButton :disabled="disabled" @click="handleRemoveFormat" title="清除格式">
          <ElIcon><RefreshRight /></ElIcon>
        </ElButton>
        <ElButton @click="toggleFullscreen" title="全屏">
          <ElIcon><FullScreen /></ElIcon>
        </ElButton>
      </ElButtonGroup>
    </div>

    <!-- 编辑区域 -->
    <div
      ref="editorRef"
      class="editor-content"
      :style="editorStyle"
      :contenteditable="!disabled"
      :data-placeholder="placeholder"
      @input="handleInput"
      @mouseup="handleSelectionChange"
      @keyup="handleSelectionChange"
      @paste="handlePaste"
    ></div>

    <!-- 链接弹窗 -->
    <ElDialog v-model="linkDialogVisible" title="插入链接" width="400px">
      <ElForm :model="linkForm" label-width="80px">
        <ElFormItem label="链接文本">
          <ElInput v-model="linkForm.text" placeholder="请输入链接文本" />
        </ElFormItem>
        <ElFormItem label="链接地址">
          <ElInput v-model="linkForm.url" placeholder="请输入链接地址，如 https://..." />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="linkDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="insertLink">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 图片弹窗 -->
    <ElDialog v-model="imageDialogVisible" title="插入图片" width="400px">
      <ElForm :model="imageForm" label-width="80px">
        <ElFormItem label="图片地址">
          <ElInput v-model="imageForm.url" placeholder="请输入图片地址，如 https://..." />
        </ElFormItem>
        <ElFormItem label="图片宽度">
          <ElInput v-model="imageForm.width" placeholder="如 100% 或 300px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="imageDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="insertImage">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #fff;
    border-radius: 0;

    .editor-content {
      height: calc(100vh - 50px) !important;
    }
  }
}

.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;

  .toolbar-group {
    :deep(.el-button) {
      padding: 8px 10px;
    }
  }

  .toolbar-item {
    display: flex;
    align-items: center;
    gap: 4px;

    .color-label {
      font-size: 12px;
      color: #606266;
    }
  }

  :deep(.el-divider--vertical) {
    height: 20px;
    margin: 0 4px;
  }
}

.editor-content {
  padding: 12px 16px;
  overflow-y: auto;
  outline: none;
  line-height: 1.6;
  font-size: 14px;

  &:empty::before {
    content: attr(data-placeholder);
    color: #c0c4cc;
    pointer-events: none;
  }

  &:focus {
    background: #fafafa;
  }

  // 内容样式
  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(a) {
    color: #409eff;
    text-decoration: underline;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
