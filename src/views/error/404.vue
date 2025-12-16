<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElButton, ElResult } from 'element-plus'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="error-page">
    <ElResult icon="warning" title="404" sub-title="抱歉，您访问的页面不存在">
      <template #extra>
        <ElButton type="primary" @click="goHome">返回首页</ElButton>
        <ElButton @click="goBack">返回上页</ElButton>
      </template>
    </ElResult>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>
