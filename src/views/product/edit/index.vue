<script setup lang="ts">
/**
 * 商品发布/编辑页面
 * 负责人：成员 B
 * 功能：富文本编辑、图片上传、SKU规格生成
 */
import { useRoute } from 'vue-router'

const route = useRoute()
const isEdit = !!route.params.id
</script>

<template>
  <div class="product-edit-container">
    <h1>{{ isEdit ? '编辑商品' : '发布商品' }}</h1>
    <p class="placeholder-text">此页面由成员 B 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>富文本编辑器集成</li>
        <li>多图上传、拖拽排序</li>
        <li>SKU 规格生成器（重难点）</li>
        <li>商品表单验证</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.product-edit-container {
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
