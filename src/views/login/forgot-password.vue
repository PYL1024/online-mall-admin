<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Lock, Message, ArrowLeft } from '@element-plus/icons-vue'
import * as UserApi from '@/api/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)

const resetForm = reactive({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 发送验证码
async function handleSendCode() {
  if (!resetForm.phone || !/^1[3-9]\d{9}$/.test(resetForm.phone)) {
    ElMessage.warning('请先输入正确的手机号')
    return
  }

  codeLoading.value = true
  try {
    // 模拟发送验证码
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ElMessage.success('验证码已发送（模拟：123456）')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error(error)
  } finally {
    codeLoading.value = false
  }
}

// 提交重置
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await UserApi.resetPassword({
        phone: resetForm.phone,
        code: resetForm.code,
        newPassword: resetForm.newPassword,
      })
      ElMessage.success('密码重置成功，请重新登录')
      router.push('/login')
    } catch (error) {
      console.error(error)
      ElMessage.error('重置失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="title">找回密码</h1>
        <p class="subtitle">Reset your administrator password</p>
      </div>

      <el-form ref="formRef" :model="resetForm" :rules="rules" class="login-form">
        <el-form-item prop="phone">
          <el-input v-model="resetForm.phone" placeholder="请输入手机号" size="large">
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <div class="code-input-wrapper">
            <el-input v-model="resetForm.code" placeholder="验证码" size="large">
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
            <el-button
              :disabled="countdown > 0"
              :loading="codeLoading"
              class="code-btn"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="newPassword">
          <el-input
            v-model="resetForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="resetForm.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleSubmit">
            重置密码
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <el-link :underline="false" @click="router.push('/login')">
            <el-icon><ArrowLeft /></el-icon>
            返回登录
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  .title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 8px;
  }
  .subtitle {
    font-size: 14px;
    color: #909399;
  }
}

.login-form {
  .code-input-wrapper {
    display: flex;
    gap: 12px;
    width: 100%;
    .code-btn {
      width: 120px;
      height: 48px;
    }
  }

  .submit-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    margin-top: 10px;
  }

  .form-footer {
    text-align: center;
    margin-top: 16px;
    .el-link {
      font-size: 14px;
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

:deep(.el-input__wrapper) {
  padding: 8px 12px;
  border-radius: 8px;
}
</style>
