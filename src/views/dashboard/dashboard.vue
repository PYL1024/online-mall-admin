<script setup lang="ts">
/**
 * 仪表盘页面
 * 负责人：成员 D
 * 功能：数据可视化、统计卡片、图表展示
 */
</script>

<template>
  <div class="dashboard-container">
    <h1>仪表盘</h1>
    <p class="placeholder-text">此页面由成员 D 负责开发</p>
    <div class="features">
      <h3>待实现功能：</h3>
      <ul>
        <li>ECharts 图表开发（折线图、柱状图）</li>
        <li>数据统计卡片</li>
        <li>实时数据展示</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
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
