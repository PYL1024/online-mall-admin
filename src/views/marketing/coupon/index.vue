<script setup lang="ts">
/**
 * 优惠券管理页面
 * 负责人：成员 D
 * 功能：优惠券列表、创建编辑
 */
</script>

<template>
  <div class="coupon-container">
    <h1>优惠券管理</h1>
    <p class="placeholder-text">此页面由成员 D 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>优惠券列表</li>
        <li>日期选择器（有效期约束）</li>
        <li>满减/折扣券表单</li>
        <li>优惠券发放</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.coupon-container {
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
