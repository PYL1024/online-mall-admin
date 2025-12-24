<script setup lang="ts">
/**
 * 优惠券管理页面
 * 负责人：成员 D
 * 功能：优惠券列表、创建编辑、逻辑校验
 */
import { ref, reactive, computed } from 'vue'
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

// --- 2. 模拟数据 (Mock Data) ---
const mockData: Coupon[] = [
  { id: 1, name: '新用户注册立减', type: 1, value: 50, minSpend: 0, startTime: '2023-10-01 00:00:00', endTime: '2025-12-31 23:59:59' },
  { id: 2, name: '电脑品类95折', type: 2, value: 9.5, minSpend: 5000, startTime: '2023-11-01 00:00:00', endTime: '2023-11-15 23:59:59' },
]

// --- 3. 状态管理 ---
const couponList = ref<Coupon[]>([...mockData])
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
        startTime: formData.dateRange[0],
        endTime: formData.dateRange[1]
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
  <div class="coupon-container">
    <!-- 顶部操作区 -->
    <div class="header-section">
      <div class="title-group">
        <div class="title-decorator"></div>
        <div>
          <h2 class="main-title">
            <span class="title-icon">🎟️</span>
            优惠券管理
          </h2>
          <p class="sub-title">创建、发放与监控营销优惠券 · 支持满减/折扣场景</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="large" @click="handleCreate" class="create-btn">
          <el-icon class="el-icon--left"><Plus /></el-icon>
          新建优惠券
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <span class="stat-emoji">📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">总优惠券</div>
          <div class="stat-value">{{ couponList.length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
          <span class="stat-emoji">✨</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">进行中</div>
          <div class="stat-value">{{ couponList.filter(c => !isExpired(c.endTime)).length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
          <span class="stat-emoji">💰</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">满减券</div>
          <div class="stat-value">{{ couponList.filter(c => c.type === 1).length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
          <span class="stat-emoji">🎯</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">折扣券</div>
          <div class="stat-value">{{ couponList.filter(c => c.type === 2).length }}</div>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">优惠券列表</span>
          <span class="header-count">共 {{ couponList.length }} 条</span>
        </div>
      </template>
      <el-table :data="couponList" stripe style="width: 100%" class="modern-table">
        <el-table-column prop="name" label="名称" min-width="180">
          <template #default="{ row }">
            <div class="name-cell">
              <span class="coupon-name">{{ row.name }}</span>
              <el-tag 
                :type="row.type === 1 ? 'danger' : 'success'" 
                effect="light" 
                size="small"
                class="type-tag"
              >
                {{ row.type === 1 ? '满减券' : '折扣券' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="面额 / 折扣" width="150" align="center">
          <template #default="{ row }">
            <div class="value-cell">
              <span v-if="row.type === 1" class="price-badge">
                <span class="price-symbol">¥</span>
                <span class="price-number">{{ row.value }}</span>
              </span>
              <span v-else class="discount-badge">
                <span class="discount-number">{{ row.value }}</span>
                <span class="discount-text">折</span>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用门槛" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.minSpend > 0" class="threshold-text">
              满 <strong>{{ row.minSpend }}</strong> 元
            </span>
            <el-tag v-else type="success" effect="plain" size="small">无门槛</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="有效期" width="280" align="center">
          <template #default="{ row }">
            <div class="time-range">
              <span class="time-start">{{ formatDate(row.startTime) }}</span>
              <span class="separator">→</span>
              <span class="time-end">{{ formatDate(row.endTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              v-if="isExpired(row.endTime)" 
              type="info" 
              size="small"
              effect="plain"
            >
              已过期
            </el-tag>
            <el-tag 
              v-else 
              type="success" 
              size="small"
              class="status-active"
            >
              <span class="pulse-dot"></span>
              进行中
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 弹窗表单 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '✏️ 编辑优惠券' : '✨ 新建优惠券'"
      width="580px"
      @close="resetForm"
      class="modern-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" class="modern-form">
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
          <el-radio-group v-model="formData.type" class="type-radio-group">
            <el-radio-button :label="1">
              <span class="radio-icon">💰</span>
              满减券 (减金额)
            </el-radio-button>
            <el-radio-button :label="2">
              <span class="radio-icon">🎯</span>
              折扣券 (打折)
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="formData.type === 1 ? '减免金额' : '折扣力度'" prop="value">
          <div class="input-with-unit">
            <el-input-number 
              v-model="formData.value" 
              :min="0" 
              :max="formData.type === 2 ? 9.9 : 10000"
              :precision="formData.type === 2 ? 1 : 0"
              :step="formData.type === 2 ? 0.1 : 10"
              controls-position="right"
              class="value-input"
            />
            <span class="unit-badge">{{ formData.type === 1 ? '元' : '折' }}</span>
          </div>
          <div class="form-hint">
            {{ formData.type === 1 ? '用户可减免的金额数' : '例如：8.5折，用户支付85%' }}
          </div>
        </el-form-item>

        <el-form-item label="使用门槛" prop="minSpend">
          <div class="input-with-unit">
            <el-input-number 
              v-model="formData.minSpend" 
              :min="0" 
              :step="100" 
              controls-position="right"
              class="value-input"
            />
            <span class="unit-badge">元</span>
          </div>
          <div class="form-hint">设置为0表示无消费门槛限制</div>
        </el-form-item>

        <el-form-item label="有效期范围" prop="dateRange">
          <el-date-picker
            v-model="formData.dateRange"
            type="datetimerange"
            range-separator="→"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled-date="(time) => time.getTime() < Date.now() - 86400000"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitForm(formRef)" size="large" class="submit-btn">
            <el-icon class="el-icon--left"><Check /></el-icon>
            确认提交
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.coupon-container {
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
    height: 280px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 0 0 50% 50% / 0 0 60px 60px;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 28px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    animation: slideDown 0.6s ease-out;

    .title-group {
      display: flex;
      align-items: center;
      gap: 16px;

      .title-decorator {
        width: 4px;
        height: 56px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 2px;
        animation: stretch 1.5s ease-in-out infinite alternate;
      }

      .main-title {
        font-size: 26px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
        gap: 10px;

        .title-icon {
          font-size: 28px;
          animation: bounce 2s ease-in-out infinite;
        }
      }

      .sub-title {
        font-size: 14px;
        color: #909399;
        margin: 0;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
    }

    .header-actions {
      .create-btn {
        padding: 12px 28px;
        font-size: 15px;
        font-weight: 600;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
        }
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .stat-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      animation: fadeInUp 0.6s ease-out backwards;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.3), transparent);
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

        &::before {
          opacity: 1;
        }

        .stat-icon-wrapper {
          transform: rotate(360deg) scale(1.1);
        }
      }

      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }

      .stat-icon-wrapper {
        width: 60px;
        height: 60px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);

        .stat-emoji {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }
  }

  .table-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    animation: fadeInUp 0.8s ease-out backwards;

    :deep(.el-card__header) {
      border-bottom: 2px solid #f0f2f5;
      padding: 20px 24px;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .header-count {
        font-size: 13px;
        color: #909399;
        background: #f5f7fa;
        padding: 4px 12px;
        border-radius: 12px;
      }
    }

    .modern-table {
      :deep(.el-table__header) {
        th {
          background: #f8f9fa !important;
          color: #606266;
          font-weight: 600;
          font-size: 14px;
        }
      }

      :deep(.el-table__row) {
        transition: all 0.3s;

        &:hover {
          background: #f5f7fa !important;
          transform: scale(1.005);
        }
      }
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 10px;

      .coupon-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }

      .type-tag {
        border-radius: 6px;
        font-weight: 500;
      }
    }

    .value-cell {
      .price-badge {
        display: inline-flex;
        align-items: baseline;
        padding: 6px 14px;
        background: linear-gradient(135deg, #ff6b6b15, #ee5a6f15);
        border-radius: 10px;
        border: 2px solid #ff6b6b30;

        .price-symbol {
          font-size: 16px;
          color: #ff6b6b;
          font-weight: 700;
          margin-right: 2px;
        }

        .price-number {
          font-size: 20px;
          color: #ff6b6b;
          font-weight: 700;
        }
      }

      .discount-badge {
        display: inline-flex;
        align-items: baseline;
        padding: 6px 14px;
        background: linear-gradient(135deg, #67c23a15, #85ce6115);
        border-radius: 10px;
        border: 2px solid #67c23a30;

        .discount-number {
          font-size: 20px;
          color: #67c23a;
          font-weight: 700;
        }

        .discount-text {
          font-size: 14px;
          color: #67c23a;
          font-weight: 600;
          margin-left: 2px;
        }
      }
    }

    .threshold-text {
      color: #606266;
      font-size: 13px;

      strong {
        color: #409eff;
        font-weight: 600;
      }
    }

    .time-range {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: #606266;

      .time-start,
      .time-end {
        padding: 4px 10px;
        background: #f5f7fa;
        border-radius: 6px;
        font-weight: 500;
      }

      .separator {
        color: #c0c4cc;
        font-weight: bold;
      }
    }

    .status-active {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 600;

      .pulse-dot {
        width: 6px;
        height: 6px;
        background: #67c23a;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;

      .el-button {
        font-weight: 500;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-1px);
        }
      }
    }
  }
}

// 弹窗内的样式
.input-with-unit {
  display: flex;
  align-items: center;
  
  .unit {
    margin-left: 10px;
    color: #909399;
    font-size: 13px;
  }
}
</style>