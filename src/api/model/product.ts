/**
 * 商品相关类型定义
 */

/**
 * 商品分类
 */
export interface Category {
  id: number
  name: string
  parentId: number // 父分类ID，0表示一级分类
  sort: number // 排序权重
  subTitle?: string | null // 分类描述
  themeColor?: string | null // 分类主题色
  children?: Category[] // 子分类
}

/**
 * 商品筛选参数
 */
export interface ProductFilter {
  categoryId?: number // 分类ID
  status?: 0 | 1 // 0-下架，1-上架
  keyword?: string // 商品名称搜索
  priceMin?: number
  priceMax?: number
}

/**
 * 商品信息
 */
export interface Product {
  id: number
  name: string
  categoryId: number
  categoryName?: string
  mainImage: string // 主图
  images: string[] // 商品图片列表
  price: number // 价格
  originalPrice?: number // 原价
  stock: number // 库存
  status: 0 | 1 // 0-下架，1-上架
  description: string // 商品详情（富文本）
  skuSpec?: SkuSpec // SKU规格
  createTime?: string
  updateTime?: string
}

/**
 * SKU规格数据结构
 */
export interface SkuSpec {
  colors: string[] // 颜色列表
  memories: string[] // 内存列表
  combinations: SkuCombination[] // 规格组合
}

/**
 * SKU组合项
 */
export interface SkuCombination {
  color: string
  memory: string
  stock: number
  price: number
}

/**
 * 商品表单数据
 */
export interface ProductForm {
  id?: number
  name: string
  categoryId: number | undefined
  mainImage: string
  images: string[]
  price: number | undefined
  originalPrice?: number
  stock: number | undefined
  status: 0 | 1
  description: string
  skuSpec?: SkuSpec
}
