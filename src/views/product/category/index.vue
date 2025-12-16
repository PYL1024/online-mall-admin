<script setup lang="ts">
/**
 * 商品分类管理页面
 * 负责人：成员 B
 * 功能：树形表格、分类增删改
 */
</script>

<template>
  <div class="category-container">
    <h1>分类管理</h1>
    <p class="placeholder-text">此页面由成员 B 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>树形表格（Tree Table）</li>
        <li>分类的增删改操作</li>
        <li>拖拽排序</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-container {
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
