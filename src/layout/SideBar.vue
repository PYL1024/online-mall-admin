<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMenu, ElMenuItem, ElSubMenu, ElIcon, ElScrollbar } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { asyncRoutes } from '@/router/routes'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 侧边栏是否折叠
const isCollapse = computed(() => appStore.sidebarCollapsed)

// 动态获取图标组件
function getIcon(iconName: string | undefined) {
  if (!iconName) return null
  // 确保图标存在，否则返回 null 避免报错
  const icon = (Icons as Record<string, unknown>)[iconName]
  return icon || null
}

// 过滤出需要在菜单中显示的路由
const menuRoutes = computed(() => {
  const layoutRoute = asyncRoutes.find((r) => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) return []
  return layoutRoute.children.filter((route) => !route.meta?.hidden)
})

// 当前激活的菜单 (修复路径匹配逻辑)
const activeMenu = computed(() => {
  return route.path
})

// 路径拼接辅助函数，防止出现 double slash (//)
const resolvePath = (basePath: string, routePath: string) => {
  // 如果是绝对路径直接返回
  if (routePath.startsWith('/')) return routePath
  // 拼接路径
  const separator = basePath.endsWith('/') ? '' : '/'
  return `${basePath}${separator}${routePath}`
}

// 菜单点击处理
function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="sidebar" :class="{ 'is-collapse': isCollapse }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <img src="@/assets/logo.svg" alt="Logo" class="logo-img" />
      <span v-show="!isCollapse" class="logo-text">Lenovo Admin</span>
    </div>

    <!-- 菜单区域 -->
    <ElScrollbar class="sidebar-menu-wrapper">
      <ElMenu
        :default-active="activeMenu"
        :collapse="isCollapse"
        unique-opened
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
        class="el-menu-vertical"
        @select="handleMenuSelect"
      >
        <template v-for="item in menuRoutes" :key="item.path">
          <!-- 情况1：有子菜单 -->
          <ElSubMenu
            v-if="item.children && item.children.filter((c) => !c.meta?.hidden).length > 0"
            :index="resolvePath('/', item.path)"
          >
            <!-- SubMenu 的标题插槽 -->
            <template #title>
              <ElIcon v-if="item.meta?.icon" class="menu-icon">
                <component :is="getIcon(item.meta.icon as string)" />
              </ElIcon>
              <span class="menu-title">{{ item.meta?.title }}</span>
            </template>

            <!-- 子菜单项 -->
            <ElMenuItem
              v-for="child in item.children.filter((c) => !c.meta?.hidden)"
              :key="child.path"
              :index="resolvePath(resolvePath('/', item.path), child.path)"
            >
              <!-- 子菜单通常不需要图标，如有需要可在此添加 -->
              <template #title>
                <span>{{ child.meta?.title }}</span>
              </template>
            </ElMenuItem>
          </ElSubMenu>

          <!-- 情况2：无子菜单（一级菜单） -->
          <ElMenuItem v-else :index="resolvePath('/', item.path)">
            <ElIcon v-if="item.meta?.icon" class="menu-icon">
              <component :is="getIcon(item.meta.icon as string)" />
            </ElIcon>
            <!-- 关键：必须使用 template #title 包裹文本，否则折叠时文字不会隐藏从而导致重叠 -->
            <template #title>
              <span class="menu-title">{{ item.meta?.title }}</span>
            </template>
          </ElMenuItem>
        </template>
      </ElMenu>
    </ElScrollbar>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.sidebar {
  width: $sidebar-width;
  height: 100vh;
  background-color: $sidebar-bg;
  transition: width $transition-duration;
  display: flex;
  flex-direction: column;

  &.is-collapse {
    width: $sidebar-collapsed-width;

    .logo-text {
      display: none;
    }
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $navbar-height;
  padding: 0 16px; // 保持左右内边距防止logo贴边
  overflow: hidden;
  background-color: color.adjust($sidebar-bg, $lightness: -5%);
  flex-shrink: 0; // 防止Logo被压缩

  .logo-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    margin-left: 12px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    opacity: 1;
    transition: opacity 0.3s;
  }
}

.sidebar-menu-wrapper {
  flex: 1; // 自动填充剩余高度
  overflow-x: hidden; // 防止水平滚动条
}

// ---------------------------
// 修复 Element Plus 样式问题
// ---------------------------
:deep(.el-menu) {
  border-right: none;
  background-color: transparent; // 让背景色跟随容器

  // 1. 图标样式修正
  .el-icon {
    width: 1em;
    height: 1em;
    font-size: 18px; // 统一图标大小
    vertical-align: middle;
    text-align: center;
  }

  // 2. 菜单项样式
  .el-sub-menu__title,
  .el-menu-item {
    height: 56px;
    line-height: 56px;
    display: flex;
    align-items: center; // 垂直居中

    &:hover {
      background-color: $sidebar-active-bg !important;
    }
  }

  // 3. 激活状态
  .el-menu-item.is-active {
    background-color: $primary-color !important;
  }

  // 4. 文字与图标间距
  .menu-title {
    margin-left: 10px;
    vertical-align: middle;
  }
}

// ---------------------------
// 针对折叠模式的特殊修复 (关键)
// ---------------------------
:deep(.el-menu--collapse) {
  .el-sub-menu__title,
  .el-menu-item {
    justify-content: center; // 图标居中
    padding: 0 !important; // 清除内边距防止挤压

    // 在折叠模式下，强制隐藏文字 span
    // Element Plus 自带逻辑会隐藏，但有时候 CSS 权重不够
    .menu-title {
      display: none;
    }

    // 修复图标边距，折叠时不需要左边距
    .el-icon {
      margin: 0;
    }
  }

  // 修复折叠后 tooltip 出现时的子菜单样式
  .el-sub-menu__icon-arrow {
    display: none; // 折叠时隐藏右侧小箭头
  }
}
</style>
