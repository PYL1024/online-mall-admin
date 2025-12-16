<script setup lang="ts">
/**
 * 订单列表页面
 * 负责人：成员 C
 * 功能：多Tab切换、状态渲染、发货处理
 */
</script>

<template>
  <div class="order-list-container">
    <h1>订单列表</h1>
    <p class="placeholder-text">此页面由成员 C 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>多 Tab 切换（全部/待发货/退款中）</li>
        <li>状态渲染（Tag 样式映射）</li>
        <li>发货弹窗（快递单号验证）</li>
        <li>订单筛选查询</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-list-container {
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
