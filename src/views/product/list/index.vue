<script setup lang="ts">
/**
 * 商品列表页面
 * 负责人：成员 B
 * 功能：商品筛选查询、列表展示
 */
</script>

<template>
  <div class="product-list-container">
    <h1>商品列表</h1>
    <p class="placeholder-text">此页面由成员 B 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>复杂筛选查询（组合查询）</li>
        <li>商品列表展示</li>
        <li>批量操作（上架/下架）</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-list-container {
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
