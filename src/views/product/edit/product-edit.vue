<script setup lang="ts">
/**
 * 商品编辑/新增页面
 * 功能：商品信息编辑、多图上传、SKU规格生成
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElMessage,
  ElMessageBox,
  ElDivider,
  ElTabs,
  ElTabPane,
  ElAlert,
} from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getCategoryList,
  getProductDetail,
  addProduct,
  updateProduct,
  batchSaveSkus,
} from '@/api/product'
import type { Category, ProductForm, SkuSpec } from '@/api/model/product'
import MultiImageUpload from '@/components/MultiImageUpload/MultiImageUpload.vue'
import SkuGenerator from '@/components/SkuGenerator/SkuGenerator.vue'

// ==================== Router ====================

const route = useRoute()
const router = useRouter()

// ==================== 状态定义 ====================

// 页面模式
const mode = computed(() => {
  if (route.query.mode === 'view') return 'view'
  return route.params.id ? 'edit' : 'add'
})

// 页面标题
const pageTitle = computed(() => {
  switch (mode.value) {
    case 'add':
      return '新增商品'
    case 'edit':
      return '编辑商品'
    case 'view':
      return '商品详情'
    default:
      return '商品编辑'
  }
})

// 是否只读
const isReadonly = computed(() => mode.value === 'view')

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 分类列表
const categoryList = ref<Category[]>([])

// 表单引用
const formRef = ref<FormInstance>()

// 当前 Tab
const activeTab = ref('basic')

// 原有 SKU ID 列表（用于判断删除）
const existingSkuIds = ref<number[]>([])

// 表单数据
const formData = reactive<ProductForm>({
  name: '',
  categoryId: undefined,
  mainImage: '',
  images: [],
  detailImages: [],
  price: undefined,
  originalPrice: undefined,
  stock: undefined,
  status: 1,
  description: '',
  skuSpec: {
    cpus: [],
    rams: [],
    storages: [],
    gpus: [],
    vramCapacities: [],
    combinations: [],
  },
  params: {},
})

// 商品参数配置项
const paramGroups = [
  {
    title: '核心配置',
    fields: [
      { key: 'model', label: '产品型号' },
      { key: 'os', label: '操作系统' },
      { key: 'positioning', label: '产品定位' },
    ],
  },
  {
    title: '处理器 (CPU)',
    fields: [
      { key: 'cpuModel', label: 'CPU型号' },
      { key: 'cpuSeries', label: 'CPU系列' },
      { key: 'maxTurboFreq', label: '最大睿频' },
      { key: 'cpuChip', label: 'CPU芯片' },
    ],
  },
  {
    title: '屏幕显示',
    fields: [
      { key: 'screenSize', label: '屏幕尺寸' },
      { key: 'screenRatio', label: '屏幕比例' },
      { key: 'resolution', label: '屏幕分辨率' },
      { key: 'colorGamut', label: '屏幕色域' },
      { key: 'refreshRate', label: '屏幕刷新率' },
    ],
  },
  {
    title: '内存与存储',
    fields: [
      { key: 'ramCapacity', label: '内存容量' },
      { key: 'ramType', label: '内存类型' },
      { key: 'ssdType', label: '硬盘类型' },
    ],
  },
  {
    title: '图形显卡',
    fields: [
      { key: 'gpuType', label: '显卡类型' },
      { key: 'vramType', label: '显存类型' },
    ],
  },
  {
    title: '多媒体与功能',
    fields: [
      { key: 'camera', label: '摄像头' },
      { key: 'wifi', label: 'WiFi功能' },
      { key: 'bluetooth', label: '蓝牙功能' },
      { key: 'faceId', label: '人脸识别' },
    ],
  },
  {
    title: '接口与外设',
    fields: [
      { key: 'dataInterfaces', label: '数据接口' },
      { key: 'videoInterfaces', label: '视频接口' },
      { key: 'audioInterfaces', label: '音频接口' },
      { key: 'keyboard', label: '键盘类型' },
    ],
  },
  {
    title: '外观与其它',
    fields: [
      { key: 'weight', label: '机身重量' },
      { key: 'thickness', label: '机身厚度' },
      { key: 'software', label: '预装软件' },
    ],
  }
]

// 表单校验规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' },
  ],
  mainImage: [
    { required: true, message: '请上传商品主图', trigger: 'change' },
  ],
}

// ==================== 生命周期 ========================================================

onMounted(async () => {
  await loadCategories()

  // 编辑或查看模式时加载商品详情
  if (route.params.id) {
    await loadProductDetail(Number(route.params.id))
  }
})

// ==================== 数据加载 ====================

/**
 * 加载分类列表
 */
async function loadCategories() {
  try {
    categoryList.value = await getCategoryList()
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

/**
 * 加载商品详情
 */
async function loadProductDetail(id: number) {
  loading.value = true
  try {
    const product = await getProductDetail(id)
    if (product) {
      // 填充表单数据
      formData.id = product.id
      formData.name = product.name
      formData.categoryId = product.categoryId

      // Fallback: 如果没有分类ID，尝试通过 tag 匹配
      const tag = route.query.tag as string || product.tag
      if ((!formData.categoryId || formData.categoryId === 0) && tag) {
        const matchedCat = categoryList.value.find(c => c.name === tag)
        if (matchedCat) {
          formData.categoryId = matchedCat.id
        }
      }

      formData.mainImage = product.mainImage
      formData.images = product.images || []
      formData.detailImages = product.detailImages || [] // 加载图文详情图片
      formData.price = product.price
      formData.originalPrice = product.originalPrice
      formData.stock = product.stock
      formData.status = product.status
      formData.description = product.description
      formData.skuSpec = product.skuSpec || {
        cpus: [],
        rams: [],
        storages: [],
        gpus: [],
        vramCapacities: [],
        combinations: [],
      }
      // 保存原有 SKU ID 列表
      existingSkuIds.value = product.skuSpec?.combinations
        ?.filter(c => c.id)
        .map(c => c.id as number) || []
      formData.params = product.params
    } else {
      ElMessage.error('商品不存在')
      router.back()
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
    ElMessage.error('加载商品详情失败')
  } finally {
    loading.value = false
  }
}

// ==================== 图片处理 ====================

/**
 * 主图上传成功
 */
function handleMainImageChange(urls: string[]) {
  formData.mainImage = urls[0] || ''
}

/**
 * 商品图片变化
 */
function handleImagesChange(urls: string[]) {
  formData.images = urls
}

// ==================== SKU 处理 ====================

/**
 * SKU 数据变化
 */
function handleSkuChange(sku: SkuSpec) {
  formData.skuSpec = sku

  // 如果启用了 SKU，可以根据 SKU 更新主价格和库存
  if (sku.combinations.length > 0) {
    // 使用最低价格作为显示价格
    const prices = sku.combinations.map((c) => c.price).filter((p) => p > 0)
    if (prices.length > 0) {
      formData.price = Math.min(...prices)
    }

    // 库存为所有 SKU 库存之和
    formData.stock = sku.combinations.reduce((sum, c) => sum + c.stock, 0)
  }
}

// ==================== 表单操作 ====================

/**
 * 返回列表
 */
function handleBack() {
  router.push('/product/list')
}

/**
 * 保存商品
 */
async function handleSave() {
  if (!formRef.value) return

  // 收集缺少的必填项
  const missingFields: string[] = []

  if (!formData.name?.trim()) {
    missingFields.push('商品名称')
  }
  if (!formData.categoryId) {
    missingFields.push('商品分类')
  }
  if (!formData.mainImage) {
    missingFields.push('商品主图')
  }

  if (missingFields.length > 0) {
    ElMessage.warning(`请填写以下必填信息：${missingFields.join('、')}`)
    // 根据缺少的字段切换到对应的Tab
    if (!formData.mainImage) {
      activeTab.value = 'images'
    } else {
      activeTab.value = 'basic'
    }
    return
  }

  // 表单验证（其他规则如长度限制等）
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      activeTab.value = 'basic'
      return
    }

    submitting.value = true

    try {
      let productId: number

      if (mode.value === 'add') {
        const result = await addProduct(formData)
        productId = result.id
        ElMessage.success('商品添加成功')
      } else {
        await updateProduct(formData)
        productId = formData.id as number
        ElMessage.success('商品更新成功')
      }

      // 保存 SKU 数据（通过真实 API 接口）
      if (formData.skuSpec?.combinations && formData.skuSpec.combinations.length > 0) {
        try {
          await batchSaveSkus(
            productId,
            formData.skuSpec.combinations.map(c => ({
              id: c.id,
              cpu: c.cpu,
              ram: c.ram,
              storage: c.storage,
              gpu: c.gpu,
              stock: c.stock,
              price: c.price,
              os: 'Windows 11 家庭中文版', // 自动填充
              vramCapacity: c.vramCapacity || '',
            })),
            existingSkuIds.value,
          )
          console.log('✅ SKU 数据保存成功')
        } catch (skuError) {
          console.error('❌ SKU 保存失败:', skuError)
          ElMessage.warning('商品保存成功，但部分SKU保存失败')
        }
      } else if (existingSkuIds.value.length > 0) {
        // 如果原来有 SKU 但现在没有了，删除所有原有 SKU
        try {
          await batchSaveSkus(productId, [], existingSkuIds.value)
          console.log('✅ 已清除所有 SKU')
        } catch (skuError) {
          console.error('❌ 清除 SKU 失败:', skuError)
        }
      }

      router.push('/product/list')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

/**
 * 重置表单
 */
async function handleReset() {
  try {
    await ElMessageBox.confirm('确定要重置表单吗？未保存的数据将丢失。', '重置确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    if (route.params.id) {
      // 编辑模式：重新加载数据
      await loadProductDetail(Number(route.params.id))
    } else {
      // 新增模式：清空表单
      formRef.value?.resetFields()
      formData.mainImage = ''
      formData.images = []
      formData.detailImages = []
      formData.description = ''
      formData.skuSpec = {
        cpus: [],
        rams: [],
        storages: [],
        gpus: [],
        vramCapacities: [],
        combinations: [],
      }
    }

    ElMessage.success('表单已重置')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="product-edit" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton :icon="ArrowLeft" @click="handleBack">返回</ElButton>
        <h2 class="page-title">{{ pageTitle }}</h2>
      </div>
      <div v-if="!isReadonly" class="header-right">
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton type="primary" :icon="Check" @click="handleSave" :loading="submitting">
          保存商品
        </ElButton>
      </div>
    </div>

    <!-- 表单内容 -->
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :disabled="isReadonly"
      label-width="120px"
      label-position="right"
    >
      <ElTabs v-model="activeTab" type="border-card">
        <!-- 基础信息 -->
        <ElTabPane label="基础信息" name="basic">
          <ElCard shadow="never" class="form-card">
            <template #header>
              <span class="card-title">基本信息</span>
            </template>

            <ElFormItem label="商品名称" prop="name">
              <ElInput
                v-model="formData.name"
                placeholder="请输入商品名称"
                maxlength="100"
                show-word-limit
                style="max-width: 500px"
              />
            </ElFormItem>

            <ElFormItem label="商品分类" prop="categoryId">
              <ElSelect
                v-model="formData.categoryId"
                placeholder="请选择商品分类"
                style="width: 300px"
              >
                <ElOption
                  v-for="cat in categoryList"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </ElSelect>
            </ElFormItem>

            <ElDivider content-position="left">商品描述</ElDivider>

            <ElFormItem label="商品描述">
              <ElInput
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="请输入商品描述"
                maxlength="500"
                show-word-limit
                style="max-width: 600px"
              />
            </ElFormItem>

            <ElDivider content-position="left">商品状态</ElDivider>

            <ElFormItem label="上架状态">
              <ElRadioGroup v-model="formData.status">
                <ElRadio :value="1">立即上架</ElRadio>
                <ElRadio :value="0">暂不上架</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCard>
        </ElTabPane>

        <!-- 商品图片 -->
        <ElTabPane label="商品图片" name="images">
          <ElCard shadow="never" class="form-card">
            <template #header>
              <span class="card-title">商品主图</span>
            </template>

            <ElFormItem label="主图" prop="mainImage">
              <div class="image-upload-section">
                <MultiImageUpload
                  :model-value="formData.mainImage ? [formData.mainImage] : []"
                  @update:model-value="handleMainImageChange"
                  :max-count="1"
                  :disabled="isReadonly"
                />
                <div class="upload-tip">
                  建议尺寸：800×800px，支持 jpg、png、gif 格式
                </div>
              </div>
            </ElFormItem>
          </ElCard>

          <ElCard shadow="never" class="form-card" style="margin-top: 16px">
            <template #header>
              <span class="card-title">商品图片</span>
            </template>

            <ElFormItem label="轮播图">
              <div class="image-upload-section">
                <MultiImageUpload
                  v-model="formData.images"
                  @update:model-value="handleImagesChange"
                  :max-count="9"
                  :disabled="isReadonly"
                />
                <div class="upload-tip">
                  最多上传 9 张图片，可拖拽排序。建议尺寸：800×800px
                </div>
              </div>
            </ElFormItem>
          </ElCard>
        </ElTabPane>

        <!-- SKU 规格 -->
        <ElTabPane label="SKU规格" name="sku">
          <ElCard shadow="never" class="form-card">
            <template #header>
              <span class="card-title">规格设置</span>
            </template>

            <ElAlert
              type="info"
              title="SKU规格说明"
              description="添加颜色、内存、存储、显卡规格后，系统会自动生成所有规格组合。每个组合可单独设置库存和价格。"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />

            <SkuGenerator
              v-model="formData.skuSpec"
              @change="handleSkuChange"
              :disabled="isReadonly"
            />
          </ElCard>
        </ElTabPane>

        <!-- 参数信息 -->
        <ElTabPane label="参数信息" name="params">
          <div v-for="group in paramGroups" :key="group.title">
            <ElCard shadow="never" class="form-card" style="margin-bottom: 16px">
              <template #header>
                <span class="card-title">{{ group.title }}</span>
              </template>
              <div class="params-grid">
                <ElFormItem
                  v-for="field in group.fields"
                  :key="field.key"
                  :label="field.label"
                  style="margin-bottom: 18px"
                >
                  <ElInput
                    v-model="(formData.params as any)[field.key]"
                    :placeholder="'请输入' + field.label"
                    :disabled="isReadonly"
                    clearable
                  />
                </ElFormItem>
              </div>
            </ElCard>
          </div>
        </ElTabPane>

        <!-- 商品详情 -->
        <ElTabPane label="商品详情" name="detail">
          <ElCard shadow="never" class="form-card">
            <template #header>
              <span class="card-title">图文详情</span>
            </template>

            <ElFormItem label="详情图片">
              <div class="image-upload-section">
                <MultiImageUpload
                  :model-value="formData.detailImages || []"
                  @update:model-value="(val: string[]) => formData.detailImages = val"
                  :max-count="20"
                  :disabled="isReadonly"
                />
                <div class="upload-tip">
                  上传商品详情图片，最多 20 张，可拖拽排序。建议宽度：750px
                </div>
              </div>
            </ElFormItem>
          </ElCard>
        </ElTabPane>
      </ElTabs>
    </ElForm>

    <!-- 底部操作栏（固定） -->
    <div v-if="!isReadonly" class="footer-actions">
      <ElButton @click="handleBack">取消</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton type="primary" :icon="Check" @click="handleSave" :loading="submitting">
        保存商品
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-edit {
  padding: 20px;
  padding-bottom: 80px; // 为底部操作栏留空间

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .page-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      gap: 10px;
    }
  }

  .form-card {
    .card-title {
      font-weight: 600;
      color: #303133;
    }

    .params-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 0 30px;
    }

    .form-tip {
      margin-left: 8px;
      color: #909399;
      font-size: 13px;
    }

    .image-upload-section {
      .upload-tip {
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
      }
    }

    .editor-section {
      width: 100%;
    }
  }

  .footer-actions {
    position: fixed;
    bottom: 0;
    left: 200px; // 侧边栏宽度
    right: 0;
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    z-index: 100;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  }
}

// Element Plus Tabs 样式调整
:deep(.el-tabs--border-card) {
  background: #fff;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  > .el-tabs__header {
    background: #f5f7fa;
    border-bottom: none;

    .el-tabs__item {
      &.is-active {
        background: #fff;
        border-bottom-color: #fff;
      }
    }
  }

  > .el-tabs__content {
    padding: 20px;
  }
}
</style>
