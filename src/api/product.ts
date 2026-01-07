/**
 * 商品管理 API
 * 使用 Mock 数据模拟后端接口
 */

import { get, post, del } from '@/utils/request'
import type { PageParams, PageResult } from './model/common'
import type { Category, Product, ProductFilter, ProductForm } from './model/product'

// ==================== Mock 数据 ====================

/**
 * Mock 分类数据（笔记本商城）
 * 顶级：ThinkPad系列、拯救者系列、YOGA系列、ThinkBook系列、小新系列
 * 二级：产品1、产品2、产品3
 */
const mockCategories: Category[] = [
  {
    id: 1,
    name: 'ThinkPad系列',
    parentId: 0,
    sort: 1,
    children: [
      { id: 11, name: '产品1', parentId: 1, sort: 1, children: [] },
      { id: 12, name: '产品2', parentId: 1, sort: 2, children: [] },
      { id: 13, name: '产品3', parentId: 1, sort: 3, children: [] },
    ],
  },
  {
    id: 2,
    name: '拯救者系列',
    parentId: 0,
    sort: 2,
    children: [
      { id: 21, name: '产品1', parentId: 2, sort: 1, children: [] },
      { id: 22, name: '产品2', parentId: 2, sort: 2, children: [] },
      { id: 23, name: '产品3', parentId: 2, sort: 3, children: [] },
    ],
  },
  {
    id: 3,
    name: 'YOGA系列',
    parentId: 0,
    sort: 3,
    children: [
      { id: 31, name: '产品1', parentId: 3, sort: 1, children: [] },
      { id: 32, name: '产品2', parentId: 3, sort: 2, children: [] },
      { id: 33, name: '产品3', parentId: 3, sort: 3, children: [] },
    ],
  },
  {
    id: 4,
    name: 'ThinkBook系列',
    parentId: 0,
    sort: 4,
    children: [
      { id: 41, name: '产品1', parentId: 4, sort: 1, children: [] },
      { id: 42, name: '产品2', parentId: 4, sort: 2, children: [] },
      { id: 43, name: '产品3', parentId: 4, sort: 3, children: [] },
    ],
  },
  {
    id: 5,
    name: '小新系列',
    parentId: 0,
    sort: 5,
    children: [
      { id: 51, name: '产品1', parentId: 5, sort: 1, children: [] },
      { id: 52, name: '产品2', parentId: 5, sort: 2, children: [] },
      { id: 53, name: '产品3', parentId: 5, sort: 3, children: [] },
    ],
  },
]

/**
 * Mock 商品数据（示例与新分类对齐）
 */
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'ThinkPad X1 Carbon 2024',
    categoryId: 11,
    categoryName: '产品1',
    mainImage: 'https://picsum.photos/200/200?random=101',
    images: [
      'https://picsum.photos/400/400?random=101',
      'https://picsum.photos/400/400?random=102',
      'https://picsum.photos/400/400?random=103',
    ],
    price: 12999,
    originalPrice: 13999,
    stock: 80,
    status: 1,
    description: '<p>ThinkPad X1 Carbon，轻薄商务本，碳纤维机身。</p>',
    skuSpec: {
      colors: ['黑色', '银色'],
      memories: ['16GB/512GB', '32GB/1TB'],
      combinations: [
        { color: '黑色', memory: '16GB/512GB', stock: 20, price: 12999 },
        { color: '黑色', memory: '32GB/1TB', stock: 15, price: 14999 },
        { color: '银色', memory: '16GB/512GB', stock: 25, price: 12999 },
      ],
    },
    createTime: '2024-02-15 10:30:00',
    updateTime: '2024-02-20 14:20:00',
  },
  {
    id: 2,
    name: '拯救者 Y9000P 2024',
    categoryId: 21,
    categoryName: '产品1',
    mainImage: 'https://picsum.photos/200/200?random=104',
    images: ['https://picsum.photos/400/400?random=104', 'https://picsum.photos/400/400?random=105'],
    price: 9999,
    originalPrice: 10999,
    stock: 60,
    status: 1,
    description: '<p>拯救者 Y9000P，高性能游戏本，双风扇散热系统。</p>',
    createTime: '2024-02-10 09:00:00',
    updateTime: '2024-02-18 16:00:00',
  },
  {
    id: 3,
    name: 'YOGA 14s 2024',
    categoryId: 31,
    categoryName: '产品1',
    mainImage: 'https://picsum.photos/200/200?random=106',
    images: ['https://picsum.photos/400/400?random=106'],
    price: 7999,
    originalPrice: 8999,
    stock: 40,
    status: 1,
    description: '<p>YOGA 14s，轻薄便携，高清触控屏。</p>',
    createTime: '2024-02-08 11:00:00',
    updateTime: '2024-02-15 10:00:00',
  },
  {
    id: 4,
    name: 'ThinkBook 14+ 2024',
    categoryId: 41,
    categoryName: '产品1',
    mainImage: 'https://picsum.photos/200/200?random=107',
    images: ['https://picsum.photos/400/400?random=107'],
    price: 6999,
    stock: 35,
    status: 0,
    description: '<p>ThinkBook 14+，全能轻薄本，性价比之选。</p>',
    createTime: '2024-02-05 14:00:00',
    updateTime: '2024-02-10 09:00:00',
  },
  {
    id: 5,
    name: '小新 Pro 14 2024',
    categoryId: 51,
    categoryName: '产品1',
    mainImage: 'https://picsum.photos/200/200?random=108',
    images: ['https://picsum.photos/400/400?random=108'],
    price: 5999,
    originalPrice: 6499,
    stock: 50,
    status: 1,
    description: '<p>小新 Pro 14，2.8K 高刷屏，金属机身。</p>',
    createTime: '2024-02-03 16:00:00',
    updateTime: '2024-02-12 11:00:00',
  },
]

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ==================== 分类管理 API ====================

let categoryIdCounter = 100

/**
 * 获取分类树
 */
export async function getCategoryTree(): Promise<Category[]> {
  await delay(300)
  return JSON.parse(JSON.stringify(mockCategories))
}

/**
 * 获取扁平化分类列表（用于下拉选择）
 */
export async function getCategoryList(): Promise<Category[]> {
  await delay(200)
  const flatList: Category[] = []

  function flatten(categories: Category[], prefix = '') {
    categories.forEach((cat) => {
      flatList.push({
        ...cat,
        name: prefix + cat.name,
        children: undefined,
      })
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children, prefix + '　')
      }
    })
  }

  flatten(mockCategories)
  return flatList
}

/**
 * 添加分类
 */
export async function addCategory(
  _data: Omit<Category, 'id' | 'children'>,
): Promise<{ id: number }> {
  await delay(300)
  categoryIdCounter++
  // 实际项目中会添加到数据库，使用 _data 参数
  void _data
  return { id: categoryIdCounter }
}

/**
 * 更新分类
 */
export async function updateCategory(_data: Omit<Category, 'children'>): Promise<void> {
  await delay(300)
  // 实际项目中会更新数据库，使用 _data 参数
  void _data
}

/**
 * 删除分类
 */
export async function deleteCategory(_id: number): Promise<void> {
  await delay(300)
  // 实际项目中会删除数据库记录，使用 _id 参数
  void _id
}

/**
 * 更新分类排序
 */
export async function updateCategorySort(
  _data: { id: number; sort: number; parentId: number }[],
): Promise<void> {
  await delay(300)
  // 实际项目中会批量更新排序，使用 _data 参数
  void _data
}

// ==================== 商品管理 API ====================

let productIdCounter = 100

/**
 * 获取商品列表
 */
export async function getProductList(
  params: PageParams & ProductFilter,
): Promise<PageResult<Product>> {
  await delay(400)

  let filteredProducts = [...mockProducts]

  // 筛选条件
  if (params.categoryId) {
    filteredProducts = filteredProducts.filter((p) => p.categoryId === params.categoryId)
  }
  if (params.status !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.status === params.status)
  }
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filteredProducts = filteredProducts.filter((p) => p.name.toLowerCase().includes(keyword))
  }
  if (params.priceMin !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price >= params.priceMin!)
  }
  if (params.priceMax !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price <= params.priceMax!)
  }

  // 分页
  const total = filteredProducts.length
  const start = (params.page - 1) * params.pageSize
  const list = filteredProducts.slice(start, start + params.pageSize)

  return {
    list,
    total,
    page: params.page,
    pageSize: params.pageSize,
  }
}

/**
 * 获取商品详情
 */
export async function getProductDetail(id: number): Promise<Product | null> {
  await delay(300)
  return mockProducts.find((p) => p.id === id) || null
}

/**
 * 添加商品
 */
export async function addProduct(_data: ProductForm): Promise<{ id: number }> {
  await delay(500)
  productIdCounter++
  // 实际项目中会使用 _data 参数添加到数据库
  void _data
  return { id: productIdCounter }
}

/**
 * 更新商品
 */
export async function updateProduct(_data: ProductForm): Promise<void> {
  await delay(500)
  // 实际项目中会更新数据库，使用 _data 参数
  void _data
}

/**
 * 删除商品
 */
export async function deleteProduct(_id: number): Promise<void> {
  await delay(300)
  // 实际项目中会删除数据库记录，使用 _id 参数
  void _id
}

/**
 * 批量更新商品状态
 */
export async function batchUpdateProductStatus(_ids: number[], _status: 0 | 1): Promise<void> {
  await delay(400)
  // 实际项目中会批量更新状态，使用 _ids 和 _status 参数
  void _ids
  void _status
}

/**
 * 模拟图片上传
 */
export async function uploadImage(_file: File): Promise<{ url: string }> {
  await delay(500)
  // 模拟返回图片URL，实际项目中会使用 _file 参数上传
  void _file
  const randomId = Math.floor(Math.random() * 1000)
  return {
    url: `https://picsum.photos/400/400?random=${randomId}`,
  }
}

// ==================== 商品统计 API ====================

/**
 * 分类销量数据结构
 */
export interface CategorySalesItem {
  categoryId: number
  categoryName: string
  salesCount: number
  salesAmount: number
}

/**
 * 热销商品数据结构
 */
export interface HotProductItem {
  id: number
  name: string
  mainImage: string
  salesCount: number
  salesAmount: number
}

/**
 * 商品统计数据结构
 */
export interface ProductStatisticsData {
  totalProducts: number         // 商品总数
  onSaleProducts: number        // 在售商品
  offSaleProducts: number       // 下架商品
  lowStockProducts: number      // 库存预警（库存<10）
  totalCategories: number       // 分类总数
  todayViews: number            // 今日浏览量
  monthViews: number            // 本月浏览量
  categorySales: CategorySalesItem[]  // 分类销量
  hotProducts: HotProductItem[]       // 热销商品Top5
}

/**
 * 获取商品统计数据
 * API: GET /api/admin/products/statistics
 */
export async function getProductStatistics(): Promise<ProductStatisticsData> {
  await delay(500)
  
  // Mock 数据
  return {
    totalProducts: 256,
    onSaleProducts: 198,
    offSaleProducts: 58,
    lowStockProducts: 15,
    totalCategories: 25,
    todayViews: 3680,
    monthViews: 125800,
    categorySales: [
      { categoryId: 1, categoryName: 'ThinkPad系列', salesCount: 580, salesAmount: 7540000 },
      { categoryId: 2, categoryName: '拯救者系列', salesCount: 420, salesAmount: 5880000 },
      { categoryId: 3, categoryName: 'YOGA系列', salesCount: 350, salesAmount: 3850000 },
      { categoryId: 4, categoryName: 'ThinkBook系列', salesCount: 280, salesAmount: 2520000 },
      { categoryId: 5, categoryName: '小新系列', salesCount: 450, salesAmount: 2700000 }
    ],
    hotProducts: [
      { id: 1, name: 'ThinkPad X1 Carbon 2024', mainImage: 'https://picsum.photos/100/100?random=1', salesCount: 156, salesAmount: 2027400 },
      { id: 2, name: '拯救者 Y9000P 2024', mainImage: 'https://picsum.photos/100/100?random=2', salesCount: 142, salesAmount: 1704000 },
      { id: 3, name: 'YOGA Pro 14s', mainImage: 'https://picsum.photos/100/100?random=3', salesCount: 128, salesAmount: 1152000 },
      { id: 4, name: '小新 Pro 16 2024', mainImage: 'https://picsum.photos/100/100?random=4', salesCount: 115, salesAmount: 690000 },
      { id: 5, name: 'ThinkBook 14+ 2024', mainImage: 'https://picsum.photos/100/100?random=5', salesCount: 98, salesAmount: 588000 }
    ]
  }
  
  // 真实API调用
  // return get<ProductStatisticsData>('/api/admin/products/statistics')
}
