import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/api/model/user'

/**
 * 公共路由（无需登录）
 */
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/login.vue'),
    meta: {
      title: '登录',
      hidden: true,
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/login/forgot-password.vue'),
    meta: {
      title: '找回密码',
      hidden: true,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      hidden: true,
    },
  },
]

/**
 * 需要认证的路由（需要登录）
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      // ========== 成员 D: 仪表盘 ==========
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/dashboard.vue'),
        meta: {
          title: '仪表盘',
          icon: 'Odometer',
        },
      },

      // ========== 成员 B: 商品管理 ==========
      {
        path: 'product',
        name: 'Product',
        redirect: '/product/list',
        meta: {
          title: '商品管理',
          icon: 'Goods',
        },
        children: [
          {
            path: 'category',
            name: 'ProductCategory',
            component: () => import('@/views/product/category/product-category.vue'),
            meta: {
              title: '分类管理',
            },
          },
          {
            path: 'list',
            name: 'ProductList',
            component: () => import('@/views/product/list/product-list.vue'),
            meta: {
              title: '商品列表',
            },
          },
          {
            path: 'edit',
            name: 'ProductCreate',
            component: () => import('@/views/product/edit/product-edit.vue'),
            meta: {
              title: '发布商品',
              hidden: true,
            },
          },
          {
            path: 'edit/:id',
            name: 'ProductEdit',
            component: () => import('@/views/product/edit/product-edit.vue'),
            meta: {
              title: '编辑商品',
              hidden: true,
            },
          },
        ],
      },

      // ========== 成员 C: 订单管理 ==========
      {
        path: 'order',
        name: 'Order',
        redirect: '/order/list',
        meta: {
          title: '订单管理',
          icon: 'List',
        },
        children: [
          {
            path: 'list',
            name: 'OrderList',
            component: () => import('@/views/order/list/order-list.vue'),
            meta: {
              title: '订单列表',
            },
          },
          {
            path: 'detail/:id',
            name: 'OrderDetail',
            component: () => import('@/views/order/detail/order-detail.vue'),
            meta: {
              title: '订单详情',
              hidden: true,
            },
          },
          {
            path: 'aftersale',
            name: 'AfterSale',
            component: () => import('@/views/order/aftersale/order-aftersale.vue'),
            meta: {
              title: '售后管理',
            },
          },
        ],
      },

      // ========== 成员 D: 营销管理 ==========
      {
        path: 'marketing',
        name: 'Marketing',
        redirect: '/marketing/coupon',
        meta: {
          title: '营销管理',
          icon: 'Present',
        },
        children: [
          {
            path: 'coupon',
            name: 'CouponManagement',
            component: () => import('@/views/marketing/coupon/marketing-coupon.vue'),
            meta: {
              title: '优惠券管理',
            },
          },
          {
            path: 'banner',
            name: 'BannerManagement',
            component: () => import('@/views/marketing/banner/marketing-banner.vue'),
            meta: {
              title: '轮播图管理',
            },
          },
          {
            path: 'notice',
            name: 'NoticeManagement',
            component: () => import('@/views/marketing/notice/marketing-notice.vue'),
            meta: {
              title: '商城公告',
            },
          },
        ],
      },

      // ========== 成员 A: 系统管理 ==========
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: {
          title: '系统管理',
          icon: 'Setting',
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: () => import('@/views/system/user/system-user.vue'),
            meta: {
              title: '用户管理',
            },
          },
          {
            path: 'admin',
            name: 'AdminManagement',
            component: () => import('@/views/system/admin/system-admin.vue'),
            meta: {
              title: '管理员管理',
              roles: [UserRole.SUPER_ADMIN],
            },
          },
          {
            path: 'profile',
            name: 'UserProfile',
            component: () => import('@/views/system/profile/admin-index.vue'),
            meta: {
              title: '个人中心',
              hidden: true,
            },
          },
        ],
      },
    ],
  },

  // 404 匹配
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true,
    },
  },
]

/**
 * 所有路由
 */
export const routes: RouteRecordRaw[] = [...publicRoutes, ...asyncRoutes]
