/**
 * 商品相关类型定义
 */

/**
 * 商品分类
 */
export interface Category {
  id: number | string  // 后端返回字符串ID
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
  categoryId?: number | string // 分类ID（后端返回字符串）
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
  description: string // 商品简短描述
  detailImages?: string[] // 图文详情图片
  tag?: string // 分类标签
  skuSpec?: SkuSpec // SKU规格
  params?: ProductParams // 商品参数
  createTime?: string
  updateTime?: string
}

/**
 * SKU规格数据结构
 */
export interface SkuSpec {
  cpus: string[]      // 对应后端处理器
  rams: string[]      // 对应后端内存容量
  storages: string[]  // 对应后端存储容量
  gpus: string[]      // 对应后端显卡
  vramCapacities: string[] // 显存容量
  combinations: SkuCombination[] // 规格组合
}

/**
 * SKU组合项
 */
export interface SkuCombination {
  id?: number
  cpu: string
  ram: string
  storage: string
  gpu: string
  os: string
  vramCapacity: string
  stock: number
  price: number
}

/**
 * 商品表单数据
 */
export interface ProductForm {
  id?: number
  name: string
  categoryId: number | string | undefined  // 支持字符串ID（后端返回）
  mainImage: string
  images: string[]
  detailImages?: string[]  // 商品详情图片
  price: number | undefined
  originalPrice?: number
  stock: number | undefined
  status: 0 | 1
  description: string
  skuSpec?: SkuSpec
  params?: Partial<ProductParams> // 显式包含参数对象
}

/**
 * 商品创建/更新请求数据（对应后端API）
 * 根据 POST /api/admin/products 规范
 */
export interface ProductCreateRequest {
  category_id?: number | string | null // 分类ID，可为空
  name: string                          // 商品名称（必填，不能重复）
  description?: string                  // 商品描述
  detail_html?: string                  // 商品详情HTML
  main_images?: string[]                // 主图数组（URL地址）
  tags?: string[]                       // 商品标签

  // 技术参数（扁平化到根节点）
  model?: string
  os?: string                           // 操作系统
  positioning?: string                  // 定位
  cpu_model?: string
  cpu_series?: string
  max_turbo_freq?: string
  cpu_chip?: string
  screen_size?: string
  screen_ratio?: string
  resolution?: string
  color_gamut?: string
  refresh_rate?: string
  ram_type?: string
  ssd_type?: string
  gpu_type?: string
  vram_type?: string
  camera?: string
  wifi?: string
  bluetooth?: string
  data_interfaces?: string
  video_interfaces?: string
  audio_interfaces?: string
  keyboard?: string
  face_id?: string
  weight?: string
  thickness?: string
  software?: string
}

/**
 * 商品创建响应
 */
export interface ProductCreateResponse {
  id: number
}

/**
 * 批量上下架请求数据
 */
export interface BatchUpdateStatusRequest {
  ids: number[]    // 商品ID数组
  status: 0 | 1    // 状态：0-下架，1-上架
}

// ==================== 后端API返回类型 ====================

/**
 * 商品列表项（后端返回）
 */
export interface ProductSimple {
  id: number
  name: string
  price: number
  image: string
  tag?: string
}

/**
 * 商品列表响应数据（后端返回）
 */
export interface ProductListResponse {
  ProductSimple: ProductSimple[]
  total: number
  page: number
  pageSize: string | number
}

/**
 * 商品列表查询参数（后端API）
 */
export interface ProductListParams {
  keyword?: string
  categoryId?: number | string
  page?: number
  pageSize?: number
  sort?: string
  minPrice?: number
  maxPrice?: number
}

/**
 * 商品规格（后端返回）
 */
export interface ProductSpec {
  name: string
  values: string[]
}

/**
 * SKU项（后端返回）
 */
export interface ProductSku {
  id: number
  specs: Record<string, unknown> | ProductSpec[]
  price: number
  stock: number
  diffParams?: {
    ssdCapacity?: string
    gpuChip?: string
    vramCapacity?: string
    [key: string]: string | undefined
  }
}

/**
 * 商品参数（后端返回）
 */
export interface ProductParams {
  model?: string
  os?: string
  positioning?: string
  cpuModel?: string
  cpuSeries?: string
  maxTurboFreq?: string
  cpuChip?: string
  screenSize?: string
  screenRatio?: string
  resolution?: string
  colorGamut?: string
  refreshRate?: string
  ramCapacity?: string
  ramType?: string
  ssdType?: string
  gpuType?: string
  vramType?: string
  camera?: string
  wifi?: string
  bluetooth?: string
  dataInterfaces?: string
  videoInterfaces?: string
  audioInterfaces?: string
  keyboard?: string
  faceId?: string
  weight?: string
  thickness?: string
  software?: string
}

/**
 * 商品详情（后端返回）
 */
export interface ProductDetailResponse {
  id: number
  name: string
  desc: string
  priceRange: string
  mainImages: string[]
  detailHtml: string
  categoryId: number
  categoryName: string
  specs: ProductSpec[]
  skus: ProductSku[]
  params: ProductParams
}

// ==================== SKU API 相关类型 ====================

/**
 * SKU 创建请求数据（对应后端 POST /api/admin/sku）
 */
export interface SkuCreateRequest {
  product_id: number
  price: number
  stock: number
  sales_count?: number
  os: string
  cpu: string
  ram: string
  storage: string
  gpu: string
  vram_capacity: string
  is_active?: number // 1-激活，0-禁用
}

/**
 * SKU 创建响应
 */
export interface SkuCreateResponse {
  id: number
}

/**
 * SKU 更新请求数据（对应后端 PUT /api/admin/sku/{id}）
 */
export interface SkuUpdateRequest {
  product_id?: number
  price?: number
  stock?: number
  sales_count?: number
  os?: string
  cpu?: string
  ram?: string
  storage?: string
  gpu?: string
  vram_capacity?: string
  is_active?: number
}

/**
 * SKU 批量更新状态请求数据（对应后端 PUT /api/admin/sku/batch-status）
 */
export interface SkuBatchUpdateStatusRequest {
  ids: number[]
  is_active: number // 1-激活，0-禁用
}
