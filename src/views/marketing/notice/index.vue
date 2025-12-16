<script setup lang="ts">
/**
 * 商城公告页面
 * 负责人：成员 D
 * 功能：公告列表、发布编辑
 */
</script>

<template>
  <div class="notice-container">
    <h1>商城公告</h1>
    <p class="placeholder-text">此页面由成员 D 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>公告列表</li>
        <li>公告发布</li>
        <li>公告编辑</li>
        <li>公告状态管理</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notice-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.placeholder-text {
  color: #909399;
  margin: 16px 0;
}

.features {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    color: #606266;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      list-style: disc;
      margin: 8px 0;
      color: #909399;
    }
  }
}
</style>
