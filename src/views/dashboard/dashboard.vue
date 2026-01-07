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
  <div class="dashboard-container">
    <div class="header-section">
      <div class="title-group">
        <div class="title-decorator"></div>
        <div>
          <h2 class="main-title">
            <span class="title-icon">📊</span>
            数据看板
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

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="dashboard-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="总览" name="overview">
        <!-- 销售额统计 -->
        <div class="section-title">
          <span class="section-icon">💰</span>
          <span>销售概览</span>
        </div>
        <div class="stats-grid sales-grid">
          <div 
            v-for="(item, index) in salesStatsCards" 
            :key="'sales-' + index" 
            class="stat-card sales-card"
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
                  ¥{{ formatAmount(item.value) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 订单趋势图 -->
        <div class="chart-card order-trend-card">
          <div class="chart-header">
            <h3>📈 近7天订单趋势</h3>
            <span class="chart-badge">实时统计</span>
          </div>
          <div ref="orderTrendChartRef" class="chart-box"></div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户数据" name="users">
        <!-- 用户核心指标卡片 -->
        <div class="section-title">
          <span class="section-icon">👥</span>
          <span>用户统计</span>
        </div>
        <div class="stats-grid">
          <div 
            v-for="(item, index) in userStatsCards" 
            :key="'user-' + index" 
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

        <!-- 用户图表区域 -->
        <el-row :gutter="20" class="charts-row">
          <el-col :span="14" :xs="24">
            <div class="chart-card age-chart-card">
              <div class="chart-header">
                <h3>📊 年龄分布趋势</h3>
                <span class="chart-badge">实时统计</span>
              </div>
              <div ref="ageChartRef" class="chart-box"></div>
            </div>
          </el-col>
          <el-col :span="10" :xs="24">
            <div class="chart-card gender-chart-card">
              <div class="chart-header">
                <h3>👤 性别占比</h3>
                <span class="chart-badge">用户画像</span>
              </div>
              <div ref="genderChartRef" class="chart-box"></div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="订单数据" name="orders">
        <!-- 订单统计卡片 -->
        <div class="section-title">
          <span class="section-icon">🛒</span>
          <span>订单统计</span>
        </div>
        <div class="stats-grid">
          <div 
            v-for="(item, index) in orderStatsCards" 
            :key="'order-' + index" 
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

        <!-- 订单趋势图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>📈 近7天订单趋势</h3>
            <span class="chart-badge">实时统计</span>
          </div>
          <div ref="orderTrendChartRef" class="chart-box"></div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="商品数据" name="products">
        <!-- 商品统计卡片 -->
        <div class="section-title">
          <span class="section-icon">📦</span>
          <span>商品统计</span>
        </div>
        <div class="stats-grid">
          <div 
            v-for="(item, index) in productStatsCards" 
            :key="'product-' + index" 
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
              </div>
            </div>
            <div class="stat-wave"></div>
          </div>
        </div>

        <el-row :gutter="20" class="charts-row">
          <!-- 分类销量 -->
          <el-col :span="12" :xs="24">
            <div class="chart-card">
              <div class="chart-header">
                <h3>🏷️ 分类销量占比</h3>
                <span class="chart-badge">销售分析</span>
              </div>
              <div ref="categorySalesChartRef" class="chart-box"></div>
            </div>
          </el-col>
          <!-- 热销商品 -->
          <el-col :span="12" :xs="24">
            <div class="chart-card hot-products-card">
              <div class="chart-header">
                <h3>🔥 热销商品 TOP5</h3>
                <span class="chart-badge">销量排行</span>
              </div>
              <div class="hot-products-list">
                <div 
                  v-for="(product, index) in hotProducts" 
                  :key="product.id" 
                  class="hot-product-item"
                >
                  <div class="rank-badge" :class="{ 'top-three': index < 3 }">
                    {{ index + 1 }}
                  </div>
                  <img :src="product.mainImage" :alt="product.name" class="product-image" />
                  <div class="product-info">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-stats">
                      <span class="sales-count">销量: {{ product.salesCount }}</span>
                      <span class="sales-amount">¥{{ formatAmount(product.salesAmount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
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

  /* Tab 样式 */
  .dashboard-tabs {
    :deep(.el-tabs__header) {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 8px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.3s;
      color: #606266;

      &.is-active {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
      }

      &:hover:not(.is-active) {
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
    }

    :deep(.el-tabs__active-bar) {
      display: none;
    }
  }

  /* Section 标题 */
  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .section-icon {
      font-size: 24px;
    }

    span:last-child {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  /* 销售额卡片特殊样式 */
  .sales-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .sales-card {
    .stat-value {
      font-size: 28px !important;
    }
  }

  /* 订单趋势卡片 */
  .order-trend-card {
    margin-top: 24px;
  }

  /* 热销商品列表 */
  .hot-products-card {
    .chart-box {
      display: none;
    }
  }

  .hot-products-list {
    padding: 10px 0;
  }

  .hot-product-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #f8f9fa, #fff);
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    transition: all 0.3s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      transform: translateX(8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .rank-badge {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #909399;
      background: #f0f2f5;
      margin-right: 14px;
      flex-shrink: 0;

      &.top-three {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      }
    }

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      object-fit: cover;
      margin-right: 14px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .product-info {
      flex: 1;
      min-width: 0;

      .product-name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .product-stats {
        display: flex;
        gap: 16px;
        font-size: 13px;

        .sales-count {
          color: #909399;
        }

        .sales-amount {
          color: #667eea;
          font-weight: 600;
        }
      }
    }
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