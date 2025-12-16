<script setup lang="ts">
/**
 * 轮播图管理页面
 * 负责人：成员 D
 * 功能：轮播图列表、图片上传
 */
</script>

<template>
  <div class="banner-container">
    <h1>轮播图管理</h1>
    <p class="placeholder-text">此页面由成员 D 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>轮播图列表</li>
        <li>图片上传</li>
        <li>排序调整</li>
        <li>链接配置</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banner-container {
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
