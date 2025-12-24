<script setup lang="ts">
/**
 * 商品发布/编辑页面
 * 功能：富文本编辑、图片上传、SKU规格生成、商品表单验证
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElCard,
  ElMessage,
  ElMessageBox,
  ElDivider,
  ElSwitch,
  ElCollapse,
  ElCollapseItem,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Category, ProductForm, SkuSpec } from '@/api/model/product'
import { getCategoryList, getProductDetail, addProduct, updateProduct } from '@/api/product'

// 引入自定义组件
import Editor from '@/components/Editor/Editor.vue'
import MultiImageUpload from '@/components/MultiImageUpload/MultiImageUpload.vue'
import SkuGenerator from '@/components/SkuGenerator/SkuGenerator.vue'

// ==================== 路由 ====================

const route = useRoute()
const router = useRouter()

// 判断是编辑还是新增
const productId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEdit = computed(() => !!productId.value)
const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '发布商品'))

// ==================== 状态定义 ====================

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 分类列表
const categoryList = ref<Category[]>([])

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const productForm = reactive<ProductForm>({
  name: '',
  categoryId: undefined,
  mainImage: '',
  images: [],
  price: undefined,
  originalPrice: undefined,
  stock: undefined,
  status: 1,
  description: '',
  skuSpec: {
    colors: [],
    memories: [],
    combinations: [],
  },
})

// 是否启用 SKU 规格
const enableSku = ref(false)

// 折叠面板
const activeCollapse = ref(['basic', 'images', 'detail'])

// ==================== 表单验证规则 ====================

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '商品名称长度为 2-100 个字符', trigger: 'blur' },
  ],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请上传商品主图', trigger: 'change' }],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    {
      type: 'number',
      min: 0.01,
      message: '价格必须大于 0',
      trigger: 'blur',
    },
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    {
      type: 'number',
      min: 0,
      message: '库存不能为负数',
      trigger: 'blur',
    },
  ],
  status: [{ required: true, message: '请选择商品状态', trigger: 'change' }],
  description: [{ required: true, message: '请输入商品详情', trigger: 'blur' }],
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadCategories()
  if (isEdit.value && productId.value) {
    await loadProductDetail(productId.value)
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
    ElMessage.error('加载分类数据失败')
  }
}

/**
 * 加载商品详情（编辑模式）
 */
async function loadProductDetail(id: number) {
  loading.value = true
  try {
    const detail = await getProductDetail(id)
    if (detail) {
      productForm.name = detail.name
      productForm.categoryId = detail.categoryId
      productForm.mainImage = detail.mainImage
      productForm.images = detail.images || []
      productForm.price = detail.price
      productForm.originalPrice = detail.originalPrice
      productForm.stock = detail.stock
      productForm.status = detail.status
      productForm.description = detail.description

      // SKU 数据
      if (detail.skuSpec && detail.skuSpec.combinations.length > 0) {
        enableSku.value = true
        productForm.skuSpec = detail.skuSpec
      }
    } else {
      ElMessage.error('商品不存在')
      router.push('/product/list')
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
 * 主图变化
 */
function handleMainImageChange(urls: string[]) {
  productForm.mainImage = urls[0] || ''
}

/**
 * 商品图片变化
 */
function handleImagesChange(urls: string[]) {
  productForm.images = urls
}

// 主图的数组形式（用于组件）
const mainImageList = computed({
  get: () => (productForm.mainImage ? [productForm.mainImage] : []),
  set: (val) => {
    productForm.mainImage = val[0] || ''
  },
})

// ==================== SKU 处理 ====================

/**
 * SKU 数据变化
 */
function handleSkuChange(skuSpec: SkuSpec) {
  productForm.skuSpec = skuSpec

  // 如果有 SKU 组合，自动计算总库存和最低价
  if (skuSpec.combinations.length > 0) {
    const totalStock = skuSpec.combinations.reduce((sum, item) => sum + item.stock, 0)
    const minPrice = Math.min(...skuSpec.combinations.map((item) => item.price).filter((p) => p > 0))

    // 自动填充（如果用户未手动修改）
    if (productForm.stock === undefined || productForm.stock === 0) {
      productForm.stock = totalStock
    }
    if (productForm.price === undefined || productForm.price === 0) {
      productForm.price = minPrice > 0 ? minPrice : undefined
    }
  }
}

/**
 * 切换 SKU 启用状态
 */
function handleSkuEnableChange(enabled: boolean) {
  if (!enabled) {
    // 关闭 SKU 时清空数据
    productForm.skuSpec = {
      colors: [],
      memories: [],
      combinations: [],
    }
  }
}

// ==================== 表单提交 ====================

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请检查表单填写是否正确')
      return
    }

    // SKU 验证
    if (enableSku.value) {
      const skuSpec = productForm.skuSpec
      if (!skuSpec || skuSpec.combinations.length === 0) {
        ElMessage.warning('请生成 SKU 规格组合')
        return
      }

      // 检查价格和库存是否填写
      const invalidSku = skuSpec.combinations.find((item) => item.price <= 0)
      if (invalidSku) {
        ElMessage.warning('请为所有 SKU 组合设置有效价格')
        return
      }
    }

    submitLoading.value = true
    try {
      const submitData: ProductForm = {
        ...productForm,
        skuSpec: enableSku.value ? productForm.skuSpec : undefined,
      }

      if (isEdit.value && productId.value) {
        submitData.id = productId.value
        await updateProduct(submitData)
        ElMessage.success('商品更新成功')
      } else {
        await addProduct(submitData)
        ElMessage.success('商品发布成功')
      }

      // 返回列表页
      router.push('/product/list')
    } catch (error) {
      console.error('保存商品失败:', error)
      ElMessage.error('保存商品失败，请重试')
    } finally {
      submitLoading.value = false
    }
  })
}

/**
 * 取消编辑
 */
function handleCancel() {
  ElMessageBox.confirm('确定要放弃编辑吗？未保存的内容将丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning',
  })
    .then(() => {
      router.push('/product/list')
    })
    .catch(() => {
      // 继续编辑
    })
}

/**
 * 重置表单
 */
function handleReset() {
  formRef.value?.resetFields()
  productForm.images = []
  productForm.skuSpec = {
    colors: [],
    memories: [],
    combinations: [],
  }
  enableSku.value = false
}
</script>

<template>
  <div class="product-edit-container" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <div class="header-actions">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '发布商品' }}
        </ElButton>
      </div>
    </div>

    <!-- 商品表单 -->
    <ElForm
      ref="formRef"
      :model="productForm"
      :rules="formRules"
      label-width="120px"
      class="product-form"
    >
      <ElCollapse v-model="activeCollapse">
        <!-- 基本信息 -->
        <ElCollapseItem title="基本信息" name="basic">
          <ElCard shadow="never" class="form-card">
            <ElFormItem label="商品名称" prop="name">
              <ElInput
                v-model="productForm.name"
                placeholder="请输入商品名称"
                maxlength="100"
                show-word-limit
              />
            </ElFormItem>

            <ElFormItem label="商品分类" prop="categoryId">
              <ElSelect
                v-model="productForm.categoryId"
                placeholder="请选择商品分类"
                style="width: 100%"
              >
                <ElOption
                  v-for="cat in categoryList"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="商品价格" prop="price">
              <ElInputNumber
                v-model="productForm.price"
                :min="0"
                :precision="2"
                placeholder="请输入价格"
                style="width: 200px"
              />
              <span class="form-tip">元</span>
            </ElFormItem>

            <ElFormItem label="原价（划线价）">
              <ElInputNumber
                v-model="productForm.originalPrice"
                :min="0"
                :precision="2"
                placeholder="可选"
                style="width: 200px"
              />
              <span class="form-tip">元（可选，用于展示优惠）</span>
            </ElFormItem>

            <ElFormItem label="库存数量" prop="stock">
              <ElInputNumber
                v-model="productForm.stock"
                :min="0"
                placeholder="请输入库存"
                style="width: 200px"
              />
              <span class="form-tip">件</span>
            </ElFormItem>

            <ElFormItem label="商品状态" prop="status">
              <ElRadioGroup v-model="productForm.status">
                <ElRadio :value="1">立即上架</ElRadio>
                <ElRadio :value="0">暂不上架</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCard>
        </ElCollapseItem>

        <!-- 商品图片 -->
        <ElCollapseItem title="商品图片" name="images">
          <ElCard shadow="never" class="form-card">
            <ElFormItem label="商品主图" prop="mainImage" required>
              <MultiImageUpload
                v-model="mainImageList"
                :max-count="1"
                @change="handleMainImageChange"
              />
              <div class="form-tip">主图将作为商品列表展示图，建议尺寸 800x800</div>
            </ElFormItem>

            <ElDivider />

            <ElFormItem label="商品图片">
              <MultiImageUpload
                v-model="productForm.images"
                :max-count="9"
                @change="handleImagesChange"
              />
              <div class="form-tip">商品详情页轮播图，支持拖拽排序，建议上传 3-9 张</div>
            </ElFormItem>
          </ElCard>
        </ElCollapseItem>

        <!-- 商品详情 -->
        <ElCollapseItem title="商品详情" name="detail">
          <ElCard shadow="never" class="form-card">
            <ElFormItem label="商品详情" prop="description">
              <Editor
                v-model="productForm.description"
                placeholder="请输入商品详细描述..."
                height="400px"
              />
            </ElFormItem>
          </ElCard>
        </ElCollapseItem>

        <!-- SKU 规格 -->
        <ElCollapseItem title="SKU 规格设置" name="sku">
          <ElCard shadow="never" class="form-card">
            <ElFormItem label="启用规格">
              <ElSwitch
                v-model="enableSku"
                active-text="启用多规格"
                inactive-text="单规格"
                @change="handleSkuEnableChange"
              />
              <span class="form-tip">启用后可设置颜色、内存等多规格组合</span>
            </ElFormItem>

            <template v-if="enableSku">
              <ElDivider />
              <ElFormItem label="规格配置" class="sku-form-item">
                <SkuGenerator v-model="productForm.skuSpec" @change="handleSkuChange" />
              </ElFormItem>
            </template>
          </ElCard>
        </ElCollapseItem>
      </ElCollapse>
    </ElForm>

    <!-- 底部操作栏 -->
    <div class="footer-actions">
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '发布商品' }}
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-edit-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.product-form {
  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item__header) {
    font-size: 15px;
    font-weight: 600;
    background: #fff;
    padding: 0 20px;
    height: 50px;
    border-radius: 8px 8px 0 0;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }

  :deep(.el-collapse-item) {
    margin-bottom: 16px;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }
}

.form-card {
  border: none;
  border-radius: 0 0 8px 8px;

  :deep(.el-card__body) {
    padding: 24px 20px;
  }
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.sku-form-item {
  :deep(.el-form-item__content) {
    display: block;
  }
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>
