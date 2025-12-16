<script setup lang="ts">
import { computed } from 'vue'
import sidebar from './Sidebar.vue'
import navbar from './Navbar.vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

const isCollapse = computed(() => appStore.sidebarCollapsed)
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <sidebar />

    <!-- 主内容区 -->
    <div class="main-container" :class="{ 'is-collapse': isCollapse }">
      <!-- 顶部导航 -->
      <navbar />

      <!-- 页面内容 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.admin-layout {
  display: flex;
  width: 100%;
  height: 100vh;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: $sidebar-width;
  transition: margin-left $transition-duration;
  overflow: hidden;

  &.is-collapse {
    margin-left: $sidebar-collapsed-width;
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: $bg-base;
}

// 修复侧边栏固定定位
:deep(.sidebar) {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1001;
}
</style>
