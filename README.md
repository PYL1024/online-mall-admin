# 电商管理平台 (Admin System)

基于 Vue 3 + TypeScript + Element Plus + Vite 的企业级后台管理系统前端解决方案。

## 👨‍💻 项目成员与分工

本项目采用模块化开发模式，由4位成员共同维护：

- **成员 A (架构/基建)**: 负责项目初始化、公共布局、用户与权限管理 (`/system`)
- **成员 B (商品)**: 负责商品分类、规格管理、发布编辑 (`/product`)
- **成员 C (订单)**: 负责订单流转、发货、售后处理 (`/order`)
- **成员 D (营销)**: 负责仪表盘、优惠券、内容管理 (`/marketing`, `/dashboard`)

## 🚀 快速开始

### 环境依赖

- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产环境
npm run build
```

## 🛠️ 技术栈

- **Core**: Vue 3.5, TypeScript 5.9
- **Build**: Vite 7
- **UI Framework**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **CSS Preprocessor**: Sass

## 📂 目录结构

```
src/
├── api/              # API 接口（按模块划分）
├── assets/           # 静态资源
├── components/       # 公共组件 (UploadImage等)
├── layout/           # 全局布局 (Sidebar, Navbar)
├── router/           # 路由配置 (Guard, Routes)
├── stores/           # 状态管理
├── utils/            # 工具函数 (Request, Auth)
└── views/            # 页面视图（分工明确）
    ├── login/        # 登录页
    ├── dashboard/    # 仪表盘 [成员D]
    ├── product/      # 商品管理 [成员B]
    ├── order/        # 订单管理 [成员C]
    ├── marketing/    # 营销管理 [成员D]
    └── system/       # 系统管理 [成员A]
```

## 🛡️ 开发规范与技巧

### 1. 路由守卫

- 生产环境默认启用权限验证。
- **开发环境默认禁用**路由守卫，方便直接访问任意页面进行调试。
- 如需在开发环境开启守卫，请修改 `.env.development`：
  ```properties
  VITE_ENABLE_PERMISSION_GUARD=true
  ```

### 2. Mock 数据

- 当前阶段后端接口可能未就绪，`src/api` 目录下的接口默认开启了 **Mock 模式** (`USE_MOCK = true`)。
- 开发时可直接在 View 组件中模拟数据，或修改 API 文件返回 Promise。

### 3. 公共组件

- 图片上传：请使用 `<UploadImage v-model="form.image" />`，不要重复造轮子。**但是还没有实现**。

---

> Created by Team Antipravity
