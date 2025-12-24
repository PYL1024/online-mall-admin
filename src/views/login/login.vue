<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// 引入 ElIcon 组件
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElIcon } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
})

const rules: FormRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 50, message: '账号长度为 3-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 个字符', trigger: 'blur' },
  ],
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login(loginForm)
      ElMessage.success('登录成功')
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } catch (error) {
      console.error('登录失败:', error)
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
        <img src="@/assets/logo.svg" alt="Logo" class="logo" />
        <h1 class="title">电商管理平台</h1>
        <p class="subtitle">Enterprise E-commerce Admin System</p>
      </div>

      <ElForm
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <ElFormItem prop="account">
          <ElInput v-model="loginForm.account" placeholder="请输入手机号或邮箱" size="large">
            <!-- 使用 prefix 插槽替代 prefix-icon 属性 -->
            <template #prefix>
              <ElIcon :size="20" class="input-icon">
                <User />
              </ElIcon>
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem prop="password">
          <ElInput
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <!-- 使用 prefix 插槽替代 prefix-icon 属性 -->
            <template #prefix>
              <ElIcon :size="20" class="input-icon">
                <Lock />
              </ElIcon>
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem>
          <ElButton
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </ElButton>
        </ElFormItem>

        <div class="form-options">
          <el-link type="primary" :underline="false" @click="router.push('/forgot-password')">
            忘记密码？
          </el-link>
        </div>
      </ElForm>

      <div class="login-footer">
        <p>演示账号：admin / 123456</p>
      </div>
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

  .logo {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 8px;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    padding: 8px 12px;
    border-radius: 8px;
  }

  // 1. 自定义图标样式（左侧图标）
  // 这里的样式直接控制我们插槽里写的 <ElIcon>
  .input-icon {
    color: #909399; // 图标灰色
    margin-right: 4px; // 稍微跟文字拉开点距离
  }

  // 2. 必须保留的防御性 CSS（右侧密码眼睛图标）
  // 因为 "显示密码" 的小眼睛是 Element Plus 内部生成的，无法通过插槽提取出来
  // 所以这里必须保留一个针对 suffix 的限制，防止那个小眼睛因为全局样式变大
  :deep(.el-input__suffix-inner > .el-icon) {
    font-size: 18px !important;
    width: 18px !important;
    height: 18px !important;
    margin-top: 0 !important;
  }

  // 双重保险：防止 svg 继承了全局的 100%
  :deep(.el-input__suffix-inner svg) {
    width: 1em;
    height: 1em;
  }

  .form-options {
    display: flex;
    justify-content: flex-end;
    margin-top: -10px;
    margin-bottom: 20px;
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: 2px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;

  p {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }
}
</style>
