# 电商管理平台 - 开发任务清单

本文档详细列出了后续需要实现的功能模块、对应页面路径及 API 接口参考。

## 1. 管理员管理 (Admin Management)

**目标**：独立于用户管理，专门用于管理具有管理员权限的账号。

| 任务描述           | 页面路径                                         | API 接口 (Apifox)                                                                         | 关键逻辑                  |
| :----------------- | :----------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------ |
| **管理员列表展示** | `src/views/system/admin/system-admin.vue`        | [获取管理员列表](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229953e0.md) | 筛选 `role == 1` 的用户。 |
| **创建管理员**     | `src/views/system/admin/system-admin.vue` (弹窗) | [创建管理员](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229954e0.md)     | 默认设置 `role = 1`。     |
| **删除管理员**     | `src/views/system/admin/system-admin.vue`        | [删除管理员](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229955e0.md)     | 二次确认弹窗。            |

## 2. 管理员个人中心 (Admin Profile)

**目标**：提供管理员查看和修改自身信息的入口。

| 任务描述         | 页面路径                             | API 接口 (Apifox)                                                                         | 关键逻辑                         |
| :--------------- | :----------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------- |
| **个人信息展示** | `src/views/system/profile/index.vue` | [获取管理员信息](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229950e0.md) | 进入页面时自动加载。             |
| **更新个人信息** | `src/views/system/profile/index.vue` | [更新管理员信息](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229951e0.md) | 支持修改头像、手机号、邮箱等。   |
| **修改密码**     | `src/views/system/profile/index.vue` | [修改管理员密码](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229952e0.md) | 需校验原密码，两次新密码一致性。 |
| **管理员登出**   | 顶部导航栏 / 个人中心                | [管理员登出](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229949e0.md)     | 清除 Token，跳转至登录页。       |

## 3. 认证与安全 (Auth & Security)

**目标**：完善登录流程及账号找回机制。

| 任务描述       | 页面路径                              | API 接口 (Apifox)                                                                         | 关键逻辑                         |
| :------------- | :------------------------------------ | :---------------------------------------------------------------------------------------- | :------------------------------- |
| **管理员登录** | `src/views/login/login.vue`           | [管理员登录](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229942e0.md)     | 增加表单校验，处理登录失败反馈。 |
| **找回密码**   | `src/views/login/forgot-password.vue` | [管理员找回密码](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229943e0.md) | 通过邮箱或手机号验证码重置。     |

## 4. 用户管理优化 (User Management)

**目标**：完善现有用户管理页面的业务逻辑。

| 任务描述          | 页面路径                                | API 接口 (Apifox)                                                                           | 关键逻辑                                                       |
| :---------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------- |
| **分页查询用户**  | `src/views/system/user/system-user.vue` | [分页查询用户列表](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229944e0.md) | 确保分页参数与后端一致。                                       |
| **删除用户**      | `src/views/system/user/system-user.vue` | [删除用户](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392800536e0.md)         | 物理删除或逻辑删除确认。                                       |
| **封禁/解禁用户** | `src/views/system/user/system-user.vue` | [封禁/解禁用户](https://s.apifox.cn/dc0a1453-90ee-4d48-a169-1ad5afb5a427/392229947e0.md)    | **核心逻辑**：若 `status == 1`，置为 `0` 并记录封禁/解封时间。 |

---

## 5. 路由配置建议

在 `src/router/routes.ts` 中增加以下配置：

```typescript
// 系统管理子路由
{
  path: 'admin',
  name: 'AdminManagement',
  component: () => import('@/views/system/admin/system-admin.vue'),
  meta: { title: '管理员管理' }
},
{
  path: 'profile',
  name: 'UserProfile',
  component: () => import('@/views/system/profile/index.vue'),
  meta: { title: '个人中心', hidden: true }
}
```
