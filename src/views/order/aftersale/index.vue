<script setup lang="ts">
/**
 * 售后管理页面
 * 负责人：成员 C
 * 功能：售后列表、审核处理
 */
</script>

<template>
  <div class="aftersale-container">
    <h1>售后管理</h1>
    <p class="placeholder-text">此页面由成员 C 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>售后申请列表</li>
        <li>用户上传凭证图片展示</li>
        <li>审核通过/拒绝交互</li>
        <li>退款处理</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.aftersale-container {
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
