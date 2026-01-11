<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Component } from 'vue'
import * as echarts from 'echarts'
import { 
  UserFilled, 
  Timer, 
  CircleCheck, 
  DataAnalysis, 
  WarningFilled,
  ShoppingCart,
  Goods,
  Money,
  Box,
  TrendCharts
} from '@element-plus/icons-vue'

// 导入 API 和 类型
import { getUserStatistics } from '@/api/user'
import { getOrderStatistics } from '@/api/order'
import { getProductStatistics } from '@/api/product'
import type { GenderDistribution, AgeDistribution } from '@/api/user'
import type { OrderTrendItem } from '@/api/order'
import type { CategorySalesItem, HotProductItem } from '@/api/product'

interface StatCardItem {
  title: string
  value: number
  icon: Component
  color: string
  isNew?: boolean
  suffix?: string
}

/* ========================
   二、响应式数据
======================== */
// 用户统计卡片
const userStatsCards = ref<StatCardItem[]>([
  { title: '总用户数', value: 0, icon: UserFilled, color: '#409EFF' },
  { title: '活跃用户', value: 0, icon: CircleCheck, color: '#67C23A' },
  { title: '今日新增', value: 0, icon: Timer, color: '#E2231A', isNew: true },
  { title: '本月新增', value: 0, icon: DataAnalysis, color: '#E6A23C' }
])

// 订单统计卡片
const orderStatsCards = ref<StatCardItem[]>([
  { title: '订单总数', value: 0, icon: ShoppingCart, color: '#409EFF' },
  { title: '今日订单', value: 0, icon: Timer, color: '#67C23A', isNew: true },
  { title: '待发货', value: 0, icon: Box, color: '#E6A23C' },
  { title: '退款中', value: 0, icon: WarningFilled, color: '#F56C6C' }
])

// 销售额统计卡片
const salesStatsCards = ref<StatCardItem[]>([
  { title: '累计销售额', value: 0, icon: Money, color: '#667eea', suffix: '元' },
  { title: '今日销售额', value: 0, icon: TrendCharts, color: '#67C23A', suffix: '元' },
  { title: '本月销售额', value: 0, icon: DataAnalysis, color: '#E6A23C', suffix: '元' }
])

// 商品统计卡片
const productStatsCards = ref<StatCardItem[]>([
  { title: '商品总数', value: 0, icon: Goods, color: '#409EFF' },
  { title: '在售商品', value: 0, icon: CircleCheck, color: '#67C23A' },
  { title: '下架商品', value: 0, icon: Box, color: '#909399' },
  { title: '库存预警', value: 0, icon: WarningFilled, color: '#F56C6C' }
])

const disabledCount = ref(0)
const ageChartRef = ref<HTMLDivElement | null>(null)
const genderChartRef = ref<HTMLDivElement | null>(null)
const orderTrendChartRef = ref<HTMLDivElement | null>(null)
const categorySalesChartRef = ref<HTMLDivElement | null>(null)
const charts: echarts.ECharts[] = []

// 热销商品数据
const hotProducts = ref<HotProductItem[]>([])

// 当前选中的 Tab
const activeTab = ref('overview')

// 保存 API 数据用于 Tab 切换时重新渲染
const userChartData = ref<{ age: AgeDistribution | null; gender: GenderDistribution | null }>({
  age: null,
  gender: null
})
const orderChartData = ref<OrderTrendItem[]>([])
const productChartData = ref<CategorySalesItem[]>([])

// Tab 切换时重新渲染图表
const handleTabChange = (tabName: string) => {
  nextTick(() => {
    // 先调整所有图表大小
    charts.forEach(c => c.resize())
    
    // 根据 Tab 重新初始化对应图表
    setTimeout(() => {
      if (tabName === 'overview' && orderChartData.value.length > 0) {
        initOrderTrendChart(orderChartData.value)
      } else if (tabName === 'users') {
        if (userChartData.value.age) initAgeChart(userChartData.value.age)
        if (userChartData.value.gender) initGenderChart(userChartData.value.gender)
      } else if (tabName === 'orders' && orderChartData.value.length > 0) {
        initOrderTrendChart(orderChartData.value)
      } else if (tabName === 'products' && productChartData.value.length > 0) {
        initCategorySalesChart(productChartData.value)
      }
    }, 100)
  })
}

/* ========================
   三、图表逻辑
======================== */

const initAgeChart = (data: AgeDistribution) => {
  if (!ageChartRef.value) return
  
  // 如果已存在图表实例，先销毁
  const existingChart = echarts.getInstanceByDom(ageChartRef.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
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
        data['18-25'],
        data['26-35'],
        data['36-45'],
        data.over45
      ]
    }]
  })
}

const initGenderChart = (data: GenderDistribution) => {
  if (!genderChartRef.value) return
  
  // 如果已存在图表实例，先销毁
  const existingChart = echarts.getInstanceByDom(genderChartRef.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
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

/**
 * 订单趋势图表
 */
const initOrderTrendChart = (data: OrderTrendItem[]) => {
  if (!orderTrendChartRef.value) return
  
  // 如果已存在图表实例，先销毁
  const existingChart = echarts.getInstanceByDom(orderTrendChartRef.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
  const chart = echarts.init(orderTrendChartRef.value)
  charts.push(chart)

  const dates = data.map(item => item.date.slice(5)) // MM-DD
  const orderCounts = data.map(item => item.orderCount)
  const orderAmounts = data.map(item => item.orderAmount)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单数', '销售额'],
      top: '5%',
      textStyle: { color: '#606266' }
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#E0E6ED' } },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left',
        splitLine: { lineStyle: { color: '#E0E6ED', type: 'dashed' } },
        axisLine: { show: false },
        axisLabel: { color: '#909399', fontSize: 12 }
      },
      {
        type: 'value',
        name: '销售额',
        position: 'right',
        splitLine: { show: false },
        axisLine: { show: false },
        axisLabel: { 
          color: '#909399', 
          fontSize: 12,
          formatter: (value: number) => (value / 10000).toFixed(1) + '万'
        }
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        data: orderCounts
      },
      {
        name: '销售额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#67C23A' },
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        },
        data: orderAmounts
      }
    ]
  })
}

/**
 * 分类销量图表
 */
const initCategorySalesChart = (data: CategorySalesItem[]) => {
  if (!categorySalesChartRef.value) return
  
  // 如果已存在图表实例，先销毁
  const existingChart = echarts.getInstanceByDom(categorySalesChartRef.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
  const chart = echarts.init(categorySalesChartRef.value)
  charts.push(chart)

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: { name: string; value: number; percent: number }) => {
        return `${params.name}<br/>销量: ${params.value}<br/>占比: ${params.percent}%`
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#606266', fontSize: 12 }
    },
    color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
    series: [{
      name: '分类销量',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '50%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      },
      data: data.map(item => ({
        value: item.salesCount,
        name: item.categoryName
      }))
    }]
  })
}

/* ========================
   四、数据获取
======================== */

const fetchUserData = async () => {
  try {
    const data = await getUserStatistics()
    
    // 更新用户统计卡片
    userStatsCards.value[0]!.value = data.totalUsers
    userStatsCards.value[1]!.value = data.activeUsers
    userStatsCards.value[2]!.value = data.newUsersToday
    userStatsCards.value[3]!.value = data.newUsersThisMonth
    
    // 更新封禁数
    disabledCount.value = data.disabledUsers

    // 保存图表数据
    userChartData.value = {
      age: data.ageDistribution,
      gender: data.genderDistribution
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
  }
}

const fetchOrderData = async () => {
  try {
    const data = await getOrderStatistics()
    
    // 更新订单统计卡片
    orderStatsCards.value[0]!.value = data.totalOrders
    orderStatsCards.value[1]!.value = data.todayOrders
    orderStatsCards.value[2]!.value = data.pendingShipment
    orderStatsCards.value[3]!.value = data.refundingOrders
    
    // 更新销售额统计卡片
    salesStatsCards.value[0]!.value = data.totalAmount
    salesStatsCards.value[1]!.value = data.todayAmount
    salesStatsCards.value[2]!.value = data.monthAmount

    // 保存图表数据
    orderChartData.value = data.weeklyTrend

    // 默认在 overview Tab，直接渲染
    nextTick(() => {
      initOrderTrendChart(data.weeklyTrend)
    })
  } catch (error) {
    console.error('获取订单统计失败:', error)
  }
}

const fetchProductData = async () => {
  try {
    const data = await getProductStatistics()
    
    // 更新商品统计卡片
    productStatsCards.value[0]!.value = data.totalProducts
    productStatsCards.value[1]!.value = data.onSaleProducts
    productStatsCards.value[2]!.value = data.offSaleProducts
    productStatsCards.value[3]!.value = data.lowStockProducts
    
    // 热销商品
    hotProducts.value = data.hotProducts

    // 保存图表数据
    productChartData.value = data.categorySales
  } catch (error) {
    console.error('获取商品统计失败:', error)
  }
}

const fetchAllData = async () => {
  await Promise.all([
    fetchUserData(),
    fetchOrderData(),
    fetchProductData()
  ])
}

// 格式化金额
const formatAmount = (value: number): string => {
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toLocaleString()
}

const handleResize = () => charts.forEach(c => c.resize())

onMounted(() => {
  fetchAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>

<template>
  <div class="dashboard-page">
    <el-card shadow="never" class="main-card">
      <div class="header">
        <div class="title-area">
          <h2 class="title">数据看板</h2>
          <span class="sub-title">实时监控 · 数据驱动决策</span>
        </div>
        <div class="header-info">
          <span class="info-item">
            <el-icon><Timer /></el-icon>
            {{ new Date().toLocaleDateString() }}
          </span>
          <span class="info-item warning">
            <el-icon><WarningFilled /></el-icon>
            封禁用户: {{ disabledCount }}
          </span>
        </div>
      </div>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="总览" name="overview">
          <!-- 销售额统计 -->
          <div class="section-header">销售概览</div>
          <div class="stats-row">
            <div v-for="(item, index) in salesStatsCards" :key="'sales-' + index" class="stat-item">
              <div class="stat-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ item.title }}</div>
                <div class="stat-value">¥{{ formatAmount(item.value) }}</div>
              </div>
            </div>
          </div>

          <!-- 订单趋势图 -->
          <div class="chart-section">
            <div class="chart-title">近7天订单趋势</div>
            <div ref="orderTrendChartRef" class="chart-box"></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户数据" name="users">
          <!-- 用户核心指标卡片 -->
          <div class="section-header">用户统计</div>
          <div class="stats-row">
            <div v-for="(item, index) in userStatsCards" :key="'user-' + index" class="stat-item">
              <div class="stat-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ item.title }}</div>
                <div class="stat-value">{{ item.value.toLocaleString() }}</div>
                <el-tag v-if="item.isNew" size="small" type="danger">Today</el-tag>
              </div>
            </div>
          </div>

          <!-- 用户图表区域 -->
          <el-row :gutter="20">
            <el-col :span="14" :xs="24">
              <div class="chart-section">
                <div class="chart-title">年龄分布</div>
                <div ref="ageChartRef" class="chart-box"></div>
              </div>
            </el-col>
            <el-col :span="10" :xs="24">
              <div class="chart-section">
                <div class="chart-title">性别占比</div>
                <div ref="genderChartRef" class="chart-box"></div>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="订单数据" name="orders">
          <!-- 订单统计卡片 -->
          <div class="section-header">订单统计</div>
          <div class="stats-row">
            <div v-for="(item, index) in orderStatsCards" :key="'order-' + index" class="stat-item">
              <div class="stat-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ item.title }}</div>
                <div class="stat-value">{{ item.value.toLocaleString() }}</div>
                <el-tag v-if="item.isNew" size="small" type="danger">Today</el-tag>
              </div>
            </div>
          </div>

          <!-- 订单趋势图 -->
          <div class="chart-section">
            <div class="chart-title">近7天订单趋势</div>
            <div ref="orderTrendChartRef" class="chart-box"></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="商品数据" name="products">
          <!-- 商品统计卡片 -->
          <div class="section-header">商品统计</div>
          <div class="stats-row">
            <div v-for="(item, index) in productStatsCards" :key="'product-' + index" class="stat-item">
              <div class="stat-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ item.title }}</div>
                <div class="stat-value">{{ item.value.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <el-row :gutter="20">
            <!-- 分类销量 -->
            <el-col :span="12" :xs="24">
              <div class="chart-section">
                <div class="chart-title">分类销量占比</div>
                <div ref="categorySalesChartRef" class="chart-box"></div>
              </div>
            </el-col>
            <!-- 热销商品 -->
            <el-col :span="12" :xs="24">
              <div class="chart-section">
                <div class="chart-title">热销商品 TOP5</div>
                <div class="hot-products-list">
                  <div 
                    v-for="(product, index) in hotProducts" 
                    :key="product.id" 
                    class="hot-product-item"
                  >
                    <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                    <img :src="product.mainImage" :alt="product.name" class="product-img" />
                    <div class="product-info">
                      <div class="product-name">{{ product.name }}</div>
                      <div class="product-stats">
                        <span>销量: {{ product.salesCount }}</span>
                        <span class="amount">¥{{ formatAmount(product.salesAmount) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  padding: 20px;
}

.main-card {
  border-radius: 10px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    .title-area {
      .title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 4px 0;
      }

      .sub-title {
        font-size: 13px;
        color: #909399;
      }
    }

    .header-info {
      display: flex;
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        padding: 6px 12px;
        background: #f6f7fb;
        border-radius: 6px;

        &.warning {
          color: #f56c6c;
        }
      }
    }
  }
}

.section-header {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #f6f7fb;
    border-radius: 8px;
    min-width: 180px;
    flex: 1;

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .stat-info {
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.chart-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .chart-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
  }

  .chart-box {
    width: 100%;
    height: 350px;
  }
}

.hot-products-list {
  .hot-product-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .rank {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #909399;
      background: #f0f2f5;
      margin-right: 12px;

      &.top {
        background: #409eff;
        color: #fff;
      }
    }

    .product-img {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      object-fit: cover;
      margin-right: 12px;
    }

    .product-info {
      flex: 1;
      min-width: 0;

      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .product-stats {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #909399;

        .amount {
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }

  .stats-row {
    .stat-item {
      min-width: 140px;
    }
  }

  .chart-section .chart-box {
    height: 280px;
  }
}
</style>