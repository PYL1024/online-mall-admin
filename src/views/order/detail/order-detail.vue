<script setup lang="ts">
/**
 * 订单详情页面
 * 负责人：成员 C
 * 功能：订单详情展示
 */
import { useRoute } from 'vue-router'

const route = useRoute()
const orderId = route.params.id
</script>

<template>
  <div class="order-detail-container">
    <h1>订单详情   等待后端的查看详情api</h1>
    <p class="placeholder-text">订单ID: {{ orderId }}</p>
    <p class="placeholder-text">此页面由成员 C 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>订单基本信息展示</li>
        <li>商品列表</li>
        <li>收货地址信息</li>
        <li>订单状态流转记录</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-detail-container {
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
