<script setup lang="ts">
/**
 * 优惠券管理页面
 * 负责人：成员 D
 * 功能：优惠券列表、创建编辑、逻辑校验
 */
import { ref, reactive } from 'vue'
import { Plus, Delete, Edit, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

// --- 1. TS 类型定义 ---
interface Coupon {
  id: number
  name: string
  type: 1 | 2 // 1: 满减, 2: 折扣
  value: number
  minSpend: number
  startTime: string
  endTime: string
}

// 表单数据接口（DateRange 单独处理用于组件绑定）
interface CouponFormData {
  id: number | null
  name: string
  type: 1 | 2
  value: number
  minSpend: number
  dateRange: [string, string] | [] // [开始时间, 结束时间]
}

// --- 2. 数据状态 ---
// TODO: 等待后端提供优惠券管理API后对接
// 预计接口：
// GET /api/admin/coupons - 获取优惠券列表
// POST /api/admin/coupons - 创建优惠券
// PUT /api/admin/coupons/{id} - 更新优惠券
// DELETE /api/admin/coupons/{id} - 删除优惠券

// --- 3. 状态管理 ---
const couponList = ref<Coupon[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 表单初始状态
const initialFormState: CouponFormData = {
  id: null,
  name: '',
  type: 1,
  value: 0,
  minSpend: 0,
  dateRange: []
}

const formData = reactive<CouponFormData>({ ...initialFormState })

// --- 4. 校验规则 ---
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入面额/折扣', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择有效时间范围', trigger: 'change' }]
})

// --- 5. 业务逻辑方法 ---

// 打开新增弹窗
const handleCreate = () => {
  isEdit.value = false
  Object.assign(formData, initialFormState) // 重置表单
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: Coupon) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    type: row.type,
    value: row.value,
    minSpend: row.minSpend,
    dateRange: [row.startTime, row.endTime]
  })
  dialogVisible.value = true
}

// 提交表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate((valid) => {
    if (valid) {
      // 构造符合后端接口的数据结构
      const payload: Coupon = {
        id: formData.id || Date.now(), // 如果是新增，生成临时ID
        name: formData.name,
        type: formData.type,
        value: formData.value,
        minSpend: formData.minSpend,
        startTime: formData.dateRange[0] || '',
        endTime: formData.dateRange[1] || ''
      }

      if (isEdit.value) {
        // 更新逻辑
        const index = couponList.value.findIndex(item => item.id === payload.id)
        if (index !== -1) couponList.value[index] = payload
        ElMessage.success('优惠券更新成功')
      } else {
        // 新增逻辑
        couponList.value.unshift(payload)
        ElMessage.success('优惠券创建成功')
      }

      dialogVisible.value = false
    }
  })
}

// 删除逻辑
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这张优惠券吗？此操作不可恢复。', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    couponList.value = couponList.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  })
}

// 弹窗关闭重置校验
const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
}

// --- 6. 工具函数 ---
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0] // 仅展示年月日
}

const isExpired = (endTime: string) => {
  return new Date(endTime).getTime() < new Date().getTime()
}
</script>

<template>
  <div class="coupon-page">
    <el-card shadow="never" class="main-card">
      <div class="card-header">
        <div>
          <h2 class="title">优惠券管理</h2>
          <p class="sub-title">创建、发放与监控营销优惠券，支持满减/折扣场景</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="handleCreate">新建优惠券</el-button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">总优惠券</span>
          <span class="stat-value">{{ couponList.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">进行中</span>
          <span class="stat-value success">{{ couponList.filter(c => !isExpired(c.endTime)).length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">满减券</span>
          <span class="stat-value">{{ couponList.filter(c => c.type === 1).length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">折扣券</span>
          <span class="stat-value">{{ couponList.filter(c => c.type === 2).length }}</span>
        </div>
      </div>

      <el-table :data="couponList" stripe border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="180">
          <template #default="{ row }">
            <div>
              <span style="font-weight: 500;">{{ row.name }}</span>
              <el-tag
                :type="row.type === 1 ? 'danger' : 'success'"
                effect="light"
                size="small"
                style="margin-left: 8px;"
              >
                {{ row.type === 1 ? '满减券' : '折扣券' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="面额/折扣" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.type === 1" style="color: #f56c6c; font-weight: 600;">¥{{ row.value }}</span>
            <span v-else style="color: #67c23a; font-weight: 600;">{{ row.value }}折</span>
          </template>
        </el-table-column>

        <el-table-column label="使用门槛" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.minSpend > 0">满 {{ row.minSpend }} 元</span>
            <el-tag v-else type="success" effect="plain" size="small">无门槛</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="有效期" width="220" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="isExpired(row.endTime) ? 'info' : 'success'" effect="light" size="small">
              {{ isExpired(row.endTime) ? '已过期' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗表单 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑优惠券' : '新建优惠券'"
      width="520px"
      @close="resetForm"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="例如：双11满减券"
            clearable
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="优惠类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :label="1">满减券 (减金额)</el-radio>
            <el-radio :label="2">折扣券 (打折)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="formData.type === 1 ? '减免金额' : '折扣力度'" prop="value">
          <el-input-number
            v-model="formData.value"
            :min="0"
            :max="formData.type === 2 ? 9.9 : 10000"
            :precision="formData.type === 2 ? 1 : 0"
            :step="formData.type === 2 ? 0.1 : 10"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399;">{{ formData.type === 1 ? '元' : '折' }}</span>
        </el-form-item>

        <el-form-item label="使用门槛" prop="minSpend">
          <el-input-number
            v-model="formData.minSpend"
            :min="0"
            :step="100"
            controls-position="right"
          />
          <span style="margin-left: 10px; color: #909399;">元 (0表示无门槛)</span>
        </el-form-item>

        <el-form-item label="有效期范围" prop="dateRange">
          <el-date-picker
            v-model="formData.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled-date="(time: Date) => time.getTime() < Date.now() - 86400000"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm(formRef)">
          <el-icon class="el-icon--left"><Check /></el-icon>
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.coupon-page {
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

.stats-row {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f6f7fb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-label {
    font-size: 13px;
    color: #909399;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #303133;

    &.success {
      color: #67c23a;
    }
  }
}
</style>
