<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Phone, Message, Calendar } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import * as UserApi from '@/api/user'
import { UserRole, type UserInfo } from '@/api/model/user'

const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('info')

// 个人信息表单
const infoFormRef = ref<FormInstance>()
const infoForm = reactive({
  username: '',
  phone: '',
  email: '',
  gender: '',
  birthday: '',
  avatar: '',
  role: 1 as UserInfo['role'],
})

const infoRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
}

// 修改密码表单
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 初始化数据
async function initData() {
  loading.value = true
  try {
    const info = await userStore.fetchUserInfo()
    if (info) {
      infoForm.username = info.username
      infoForm.phone = info.phone
      infoForm.email = info.email
      infoForm.gender = info.gender
      infoForm.birthday = info.birthday || ''
      infoForm.avatar = info.avatar
      infoForm.role = info.role
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取个人信息失败')
  } finally {
    loading.value = false
  }
}

// 提交个人信息更新
async function handleInfoSubmit() {
  if (!infoFormRef.value) return
  await infoFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await UserApi.updateAdminInfo(infoForm)
      ElMessage.success('个人信息更新成功')
      await userStore.fetchUserInfo() // 刷新 store 中的信息
    } catch (error) {
      console.error(error)
      ElMessage.error('更新失败')
    } finally {
      loading.value = false
    }
  })
}

// 提交密码修改
async function handlePwdSubmit() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await UserApi.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
      })
      ElMessage.success('密码修改成功，请重新登录')
      userStore.logout()
    } catch (error) {
      console.error(error)
      ElMessage.error('修改失败')
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 左侧：基本信息卡片 -->
      <el-col :span="8">
        <el-card class="profile-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>个人资料</span>
            </div>
          </template>
          <div class="user-info-summary">
            <div class="avatar-wrapper">
              <el-avatar :size="100" :src="infoForm.avatar" />
            </div>
            <h3 class="username">{{ infoForm.username }}</h3>
            <p class="role-tag">
              <el-tag :type="infoForm.role === UserRole.SUPER_ADMIN ? 'danger' : 'warning'">{{
                infoForm.role === UserRole.SUPER_ADMIN ? '超级管理员' : '管理员'
              }}</el-tag>
            </p>
          </div>
          <div class="user-details">
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span class="label">用户名</span>
              <span class="value">{{ infoForm.username }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Phone /></el-icon>
              <span class="label">手机号</span>
              <span class="value">{{ infoForm.phone }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Message /></el-icon>
              <span class="label">邮箱</span>
              <span class="value">{{ infoForm.email || '未设置' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Calendar /></el-icon>
              <span class="label">注册时间</span>
              <span class="value">{{ userStore.userInfo?.createdTime || '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：操作选项卡 -->
      <el-col :span="16">
        <el-card class="action-card" shadow="never">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="info">
              <el-form
                ref="infoFormRef"
                :model="infoForm"
                :rules="infoRules"
                label-width="100px"
                style="max-width: 500px; margin-top: 20px"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="infoForm.username" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="infoForm.phone" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="infoForm.email" />
                </el-form-item>
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="infoForm.gender">
                    <el-radio value="男">男</el-radio>
                    <el-radio value="女">女</el-radio>
                    <el-radio value="未知">未知</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="生日" prop="birthday">
                  <el-date-picker
                    v-model="infoForm.birthday"
                    type="date"
                    placeholder="选择日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="loading" @click="handleInfoSubmit">
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="pwdFormRef"
                :model="pwdForm"
                :rules="pwdRules"
                label-width="100px"
                style="max-width: 500px; margin-top: 20px"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="loading" @click="handlePwdSubmit">
                    确认修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.profile-container {
  padding: 20px;

  .profile-card {
    .user-info-summary {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      margin-bottom: 20px;

      .avatar-wrapper {
        margin-bottom: 15px;
      }

      .username {
        margin: 10px 0;
        font-size: 20px;
        color: var(--el-text-color-primary);
      }

      .role-tag {
        margin: 0;
      }
    }

    .user-details {
      .detail-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        font-size: 14px;
        border-bottom: 1px solid var(--el-border-color-extra-light);

        &:last-child {
          border-bottom: none;
        }

        .el-icon {
          margin-right: 10px;
          color: var(--el-text-color-secondary);
        }

        .label {
          width: 80px;
          color: var(--el-text-color-regular);
        }

        .value {
          flex: 1;
          text-align: right;
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }
  }

  .action-card {
    min-height: 500px;
  }
}
</style>
