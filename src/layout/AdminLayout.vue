<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './SideBar.vue' // 修正引用路径
import Navbar from './NavBar.vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const isCollapse = computed(() => appStore.sidebarCollapsed)
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 (Fixed定位) -->
    <Sidebar />

    <!-- 主容器 -->
    <div class="main-container" :class="{ 'is-collapse': isCollapse }">
      <!-- 顶部导航 (Sticky吸顶) -->
      <div class="navbar-wrapper">
        <Navbar />
      </div>

      <!-- 页面内容 (去除 overflow，由 body 负责滚动) -->
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
  min-height: 100vh; // 关键1：改为最小高度，允许内容撑开高度
  background-color: $bg-base;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: $sidebar-width;
  transition: margin-left $transition-duration;

  &.is-collapse {
    margin-left: $sidebar-collapsed-width;
  }
}

.navbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 999;
  background: #fff; // 确保背景不透明
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); // 加上阴影更有层次感
}

.main-content {
  flex: 1;
  padding: 16px;
}

// 侧边栏固定定位样式
:deep(.sidebar) {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0; // 确保占满高度
  z-index: 1001;
}
</style>
