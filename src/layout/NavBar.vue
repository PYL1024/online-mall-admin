<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElIcon,
  ElAvatar,
} from 'element-plus'
import { Fold, Expand, ArrowDown, SwitchButton, User } from '@element-plus/icons-vue'
import { useAppStore, useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 侧边栏是否折叠
const isCollapse = computed(() => appStore.sidebarCollapsed)
// 用户信息
const username = computed(() => userStore.username || '管理员')
const avatar = computed(() => userStore.avatar)

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  return matched.map((item) => ({
    path: item.path,
    title: item.meta?.title as string,
  }))
})

// 切换侧边栏
function toggleSidebar() {
  appStore.toggleSidebar()
}

// 退出登录
async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

// 跳转个人中心
function handleToProfile() {
  router.push('/system/profile')
}
</script>

<template>
  <div class="navbar">
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <div class="navbar-left">
      <div class="hamburger" @click="toggleSidebar">
        <ElIcon :size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </ElIcon>
      </div>

      <ElBreadcrumb separator="/" class="breadcrumb">
        <ElBreadcrumbItem v-for="item in breadcrumbs" :key="item.path">
          {{ item.title }}
        </ElBreadcrumbItem>
      </ElBreadcrumb>
    </div>

    <!-- 右侧：用户信息 -->
    <div class="navbar-right">
      <ElDropdown trigger="click">
        <div class="user-info">
          <ElAvatar :size="32" :src="avatar">
            <ElIcon :size="20"><User /></ElIcon>
          </ElAvatar>
          <span class="username">{{ username }}</span>
          <ElIcon :size="12"><ArrowDown /></ElIcon>
        </div>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem @click="handleToProfile">
              <ElIcon><User /></ElIcon>
              <span>个人中心</span>
            </ElDropdownItem>
            <ElDropdownItem divided @click="handleLogout">
              <ElIcon><SwitchButton /></ElIcon>
              <span>退出登录</span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $navbar-height;
  padding: 0 20px;
  background-color: $navbar-bg;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.navbar-left {
  display: flex;
  align-items: center;
}

.hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: $border-radius-base;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.breadcrumb {
  margin-left: 16px;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: $border-radius-base;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .username {
    font-size: 14px;
    color: $text-primary;
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
