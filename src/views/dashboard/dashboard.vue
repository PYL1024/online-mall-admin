<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Component } from 'vue'
import * as echarts from 'echarts'
import { 
  UserFilled, 
  Timer, 
  CircleCheck, 
  DataAnalysis, 
  WarningFilled 
} from '@element-plus/icons-vue'

// 导入 API 和 类型
import { getUserStatistics } from '@/api/user'
import type { GenderDistribution, AgeDistribution } from '@/api/user'

interface StatCardItem {
  title: string
  value: number
  icon: Component
  color: string
  isNew?: boolean
}

/* ========================
   二、响应式数据
======================== */
const statsCards = ref<StatCardItem[]>([
  { title: '总用户数', value: 0, icon: UserFilled, color: '#409EFF' },
  { title: '活跃用户', value: 0, icon: CircleCheck, color: '#67C23A' },
  { title: '今日新增', value: 0, icon: Timer, color: '#E2231A', isNew: true },
  { title: '本月新增', value: 0, icon: DataAnalysis, color: '#E6A23C' }
])

const disabledCount = ref(0)
const ageChartRef = ref<HTMLDivElement | null>(null)
const genderChartRef = ref<HTMLDivElement | null>(null)
const charts: echarts.ECharts[] = []

/* ========================
   三、图表逻辑
======================== */

const initAgeChart = (data: AgeDistribution) => {
  if (!ageChartRef.value) return
  const chart = echarts.init(ageChartRef.value)
  charts.push(chart)

  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(0, 0, 0, 0.1)' }
      }
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '45岁以上'],
      axisLine: { lineStyle: { color: '#E0E6ED' } },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontSize: 12 }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: '#E0E6ED', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#909399', fontSize: 12 }
    },
    series: [{
      name: '人数',
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' }, 
          { offset: 1, color: '#764ba2' }
        ]),
        borderRadius: [8, 8, 0, 0],
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowBlur: 10,
        shadowOffsetY: 5
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#764ba2' }, 
            { offset: 1, color: '#667eea' }
          ])
        }
      },
      data: [
        data.under18, 
        data.age18To25, 
        data.age26To35, 
        data.age36To45, 
        data.over45
      ]
    }]
  })
}

const initGenderChart = (data: GenderDistribution) => {
  if (!genderChartRef.value) return
  const chart = echarts.init(genderChartRef.value)
  charts.push(chart)

  chart.setOption({
    tooltip: { 
      trigger: 'item',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { 
      bottom: '5%',
      itemGap: 20,
      textStyle: { color: '#606266', fontSize: 13 }
    },
    color: ['#5470c6', '#ee6666', '#91cc75'],
    series: [{
      name: '性别',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 10
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        fontSize: 13,
        color: '#606266',
        fontWeight: 'bold'
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
        smooth: true
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        },
        label: {
          fontSize: 15,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: data.male, name: '男性' },
        { value: data.female, name: '女性' },
        { value: data.unknown, name: '未知' }
      ]
    }]
  })
}

/* ========================
   四、数据获取
======================== */

const fetchData = async () => {
  try {
    const data = await getUserStatistics()
    
    // 更新顶部卡片
    statsCards.value[0]!.value = data.totalUsers
    statsCards.value[1]!.value = data.activeUsers
    statsCards.value[2]!.value = data.newUsersToday
    statsCards.value[3]!.value = data.newUsersThisMonth
    
    // 更新封禁数
    disabledCount.value = data.disabledUsers

    // 异步渲染图表
    nextTick(() => {
      initAgeChart(data.ageDistribution)
      initGenderChart(data.genderDistribution)
    })
  } catch (error) {
    console.error('请求失败:', error)
  }
}

const handleResize = () => charts.forEach(c => c.resize())

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>

<template>
  <div class="dashboard-container">
    <div class="header-section">
      <div class="title-group">
        <div class="title-decorator"></div>
        <div>
          <h2 class="main-title">
            <span class="title-icon">📊</span>
            用户数据看板
          </h2>
          <span class="sub-title">实时监控 · 数据驱动决策</span>
        </div>
      </div>
      <div class="header-extras">
        <div class="date-badge">
          <el-icon><Timer /></el-icon>
          <span>{{ new Date().toLocaleDateString() }}</span>
        </div>
        <div class="disabled-badge">
          <el-icon><WarningFilled /></el-icon>
          <span>封禁用户: {{ disabledCount }}</span>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="stats-grid">
      <div 
        v-for="(item, index) in statsCards" 
        :key="index" 
        class="stat-card"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="stat-card-bg" :style="{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)` }"></div>
        <div class="stat-content">
          <div class="stat-icon-wrapper" :style="{ 
            background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
            boxShadow: `0 4px 12px ${item.color}40`
          }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ item.value.toLocaleString() }}
            </div>
            <div v-if="item.isNew" class="stat-tag">
              <span class="pulse-dot"></span>
              Today
            </div>
          </div>
        </div>
        <div class="stat-wave"></div>
      </div>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="14" :xs="24">
        <div class="chart-card age-chart-card">
          <div class="chart-header">
            <h3>📈 年龄分布趋势</h3>
            <span class="chart-badge">实时统计</span>
          </div>
          <div ref="ageChartRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :span="10" :xs="24">
        <div class="chart-card gender-chart-card">
          <div class="chart-header">
            <h3>👥 性别占比</h3>
            <span class="chart-badge">用户画像</span>
          </div>
          <div ref="genderChartRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 0 0 50% 50% / 0 0 80px 80px;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    animation: slideDown 0.6s ease-out;

    .title-group {
      display: flex;
      align-items: center;
      gap: 16px;

      .title-decorator {
        width: 4px;
        height: 48px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 2px;
        animation: stretch 1s ease-in-out infinite alternate;
      }

      .main-title { 
        font-size: 28px; 
        font-weight: 700; 
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;

        .title-icon {
          font-size: 32px;
          animation: bounce 2s ease-in-out infinite;
        }
      }

      .sub-title { 
        font-size: 14px; 
        color: #909399; 
        margin-left: 4px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
    }

    .header-extras {
      display: flex;
      gap: 12px;
      align-items: center;

      .date-badge, .disabled-badge {
        padding: 10px 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s;
        cursor: default;

        &:hover {
          transform: translateY(-2px);
        }

        .el-icon {
          font-size: 16px;
        }
      }

      .date-badge {
        background: linear-gradient(135deg, #667eea15, #764ba215);
        color: #667eea;
        border: 1px solid #667eea30;
      }

      .disabled-badge {
        background: linear-gradient(135deg, #ff6b6b15, #ee5a6f15);
        color: #ff6b6b;
        border: 1px solid #ff6b6b30;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    animation: fadeInUp 0.6s ease-out backwards;

    &:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

      .stat-icon-wrapper {
        transform: rotate(360deg) scale(1.1);
      }

      .stat-wave {
        transform: translateX(0);
      }
    }

    .stat-card-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.6;
      transition: opacity 0.3s;
    }

    &:hover .stat-card-bg {
      opacity: 1;
    }

    .stat-content {
      display: flex;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .stat-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 16px;
      color: #fff;
      transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      flex-shrink: 0;
    }

    .stat-info {
      flex: 1;
    }

    .stat-title { 
      font-size: 14px; 
      color: #909399; 
      margin-bottom: 8px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .stat-value { 
      font-size: 32px; 
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      background: linear-gradient(135deg, currentColor, currentColor);
      -webkit-background-clip: text;
    }

    .stat-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      color: #fff;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);

      .pulse-dot {
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    .stat-wave {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      transform: translateX(60px) translateY(60px);
      transition: transform 0.6s;
    }
  }

  .chart-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;
    animation: fadeInUp 0.8s ease-out backwards;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f2f5;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chart-badge {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea15, #764ba215);
        color: #667eea;
        font-weight: 600;
        border: 1px solid #667eea30;
      }
    }

    .chart-box {
      width: 100%;
      height: 380px;
    }
  }

  .age-chart-card {
    animation-delay: 0.2s;
  }

  .gender-chart-card {
    animation-delay: 0.4s;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes stretch {
  from {
    transform: scaleY(1);
  }
  to {
    transform: scaleY(1.1);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
    padding: 20px !important;

    .title-group {
      .main-title {
        font-size: 24px;
      }
      
      .title-decorator {
        height: 40px;
      }
    }

    .header-extras {
      width: 100%;
      justify-content: space-between;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 16px;

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      margin-right: 12px;
    }

    .stat-value {
      font-size: 24px;
    }
  }

  .charts-row {
    .el-col {
      margin-bottom: 20px;
    }
  }

  .chart-card {
    padding: 16px;

    .chart-box {
      height: 300px;
    }
  }
}
</style>