/**
 * 商品管理 API
 * 分类和商品接口已对接后端
 */
import type { PageParams, PageResult } from './model/common'
import type {
  Category,
  Product,
  ProductFilter,
  ProductForm,
  ProductCreateRequest,
  ProductCreateResponse,
  BatchUpdateStatusRequest,
  ProductDetailResponse,
  ProductSimple,
  SkuCreateRequest,
  SkuUpdateRequest,
  SkuCreateResponse,
} from './model/product'
import { get, post, del, put } from '@/utils/request'

// 模拟延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const CATEGORY_BASE = '/api/admin/categories'
const CATEGORY_LIST = '/api/products/category/list'
const PRODUCT_BASE = '/api/admin/products'
const PRODUCT_LIST = '/api/products'

// ==================== 分类管理 API ====================

/**
 * 分类请求/响应类型定义
 */
export interface CategoryCreateRequest {
  name: string
  subTitle?: string | null
  themeColor?: string | null
}

export interface CategoryUpdateRequest {
  id: number | string
  name: string
  subTitle: string | null
  themeColor: string | null
}

export interface CategoryCreateResponse {
  id: string
}

/**
 * 获取分类树
 * GET /api/products/category/list
 */
export async function getCategoryTree(): Promise<Category[]> {
  type RawCategory = {
    id: string | number
    name: string
    subTitle?: string | null
    themeColor?: string | null
  }

  // 后端返回结构是 { data: { data: [...] } }，需要处理嵌套
  const response = await get<{ data: RawCategory[] } | RawCategory[]>(CATEGORY_LIST)

  // 兼容两种返回格式
  const list: RawCategory[] = Array.isArray(response)
    ? response
    : (response as { data: RawCategory[] }).data

  // 后端返回为扁平列表，这里补齐树形结构字段
  return list.map((item, index) => ({
    id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
    name: item.name,
    parentId: 0,
    sort: index,
    subTitle: item.subTitle ?? null,
    themeColor: item.themeColor ?? null,
  }))
}

/**
 * 获取扁平化分类列表（用于下拉选择）
 */
export async function getCategoryList(): Promise<Category[]> {
  const tree = await getCategoryTree()
  return flattenCategories(tree)
}

/**
 * 添加分类
 * POST /api/admin/categories
 * 创建新的商品分类，parentId=0表示一级分类
 */
export async function addCategory(data: CategoryCreateRequest): Promise<CategoryCreateResponse> {
  // 构建请求体，移除空值字段或使用空字符串
  const requestBody: Record<string, string> = {
    name: data.name,
  }

  // 只有非空值才添加到请求体
  if (data.subTitle) {
    requestBody.subTitle = data.subTitle
  }
  if (data.themeColor) {
    requestBody.themeColor = data.themeColor
  }

  return post<CategoryCreateResponse>(CATEGORY_BASE, requestBody)
}

/**
 * 更新分类
 * POST /api/admin/categories/update
 * 注意要检测id和name不能重复
 */
export async function updateCategory(data: CategoryUpdateRequest): Promise<void> {
  // 构建请求体
  const requestBody: Record<string, string | number> = {
    id: typeof data.id === 'string' ? parseInt(data.id, 10) : data.id,
    name: data.name,
  }

  // subTitle 和 themeColor 使用空字符串代替 null
  requestBody.subTitle = data.subTitle || ''
  requestBody.themeColor = data.themeColor || ''

  return post<void>(`${CATEGORY_BASE}/update`, requestBody)
}

/**
 * 删除分类
 * DELETE /api/admin/categories/{id}
 * 删除指定ID的分类，需检查是否有子分类或商品占用
 */
export async function deleteCategory(id: number | string): Promise<void> {
  return del<void>(`${CATEGORY_BASE}/${id}`)
}

/**
 * 更新分类排序（本地排序，后端暂不支持）
 * @deprecated 当前API不支持排序功能
 */
export async function updateCategorySort(
  _data: { id: number; sort: number; parentId: number }[],
): Promise<void> {
  // 后端API暂不支持排序功能，此函数保留用于未来扩展
  console.warn('排序功能暂不支持', _data)
  return Promise.resolve()
}

function flattenCategories(
  categories: Category[],
  prefix = '',
  output: Category[] = [],
): Category[] {
  categories.forEach((cat) => {
    output.push({
      ...cat,
      name: prefix + cat.name,
      children: undefined,
    })

    if (cat.children && cat.children.length > 0) {
      flattenCategories(cat.children, prefix + '　', output)
    }
  })

  return output
}

// ==================== 商品管理 API ====================

/**
 * 获取商品列表
 * GET /api/products
 */
export async function getProductList(
  params: PageParams & ProductFilter,
): Promise<PageResult<Product>> {
  // 构建查询参数
  const queryParams: Record<string, unknown> = {
    page: params.page,
    pageSize: params.pageSize,
  }

  // 可选参数
  if (params.keyword) {
    queryParams.keyword = params.keyword
  }
  if (params.categoryId !== undefined && params.categoryId !== '') {
    queryParams.categoryId = params.categoryId
  }
  if (params.priceMin !== undefined) {
    queryParams.minPrice = params.priceMin
  }
  if (params.priceMax !== undefined) {
    queryParams.maxPrice = params.priceMax
  }

  // 定义响应类型
  interface RawResponse {
    productSimple?: ProductSimple[]
    ProductSimple?: ProductSimple[]
    data?: ProductSimple[]
    list?: ProductSimple[]
    total?: number
    page?: number
    pageSize?: string | number
  }

  const response = await get<RawResponse | ProductSimple[]>(PRODUCT_LIST, queryParams)

  // 为了给商品补全 categoryId，我们需要拿分类树做匹配
  let categories: Category[] = []
  try {
    categories = await getCategoryTree()
  } catch (e) {
    console.error('获取分类树失败，无法补全 ID:', e)
  }

  // 建立双向映射：名称 -> ID 和 ID -> 名称
  const categoryMap = new Map<string, string | number>()
  const idToNameMap = new Map<string | number, string>()
  const flatten = (items: Category[]) => {
    items.forEach((cat) => {
      categoryMap.set(cat.name, cat.id)
      idToNameMap.set(cat.id, cat.name)
      if (cat.children) flatten(cat.children)
    })
  }
  if (categories.length > 0) flatten(categories)

  // 兼容处理：后端返回字段名为 productSimple (小写p)
  const isArray = Array.isArray(response)
  const rawList = isArray
    ? (response as ProductSimple[])
    : (response as RawResponse).productSimple ||
      (response as RawResponse).ProductSimple ||
      (response as RawResponse).data ||
      (response as RawResponse).list ||
      []

  const total = isArray
    ? (response as ProductSimple[]).length
    : (response as RawResponse).total || 0

  // 转换后端数据格式并串行/并行获取详情以获取完整数据（如 categoryId 需要通过 tag 映射）
  const list: Product[] = await Promise.all(
    rawList.map(async (item) => {
      // 获取商品详情以获取更完整的信息
      const detail = await getProductDetail(item.id)

      // 转换为带可选字段的类型以便访问
      const itemExt = item as ProductSimple & {
        categoryId?: number | string
        status?: number
        description?: string
        mainImage?: string
        stock?: number
      }

      // 计算最终的分类 ID
      const categoryId = Number(
        itemExt.categoryId || detail?.categoryId || (item.tag ? categoryMap.get(item.tag) : 0) || 0,
      )

      return {
        id: item.id,
        name: item.name,
        categoryId,
        // 优先使用详情接口返回的分类名称，其次是标签，最后通过ID映射
        categoryName: detail?.categoryName || item.tag || idToNameMap.get(categoryId) || '',
        mainImage: detail?.mainImage || item.image || itemExt.mainImage || '',
        images: detail?.images && detail.images.length > 0 ? detail.images : [item.image || ''],
        price: detail?.price || item.price || 0,
        stock: detail?.stock || itemExt.stock || 0,
        status: (itemExt.status === 0 ? 0 : 1) as 1 | 0,
        description: detail?.description || itemExt.description || '',
        tag: item.tag,
      }
    }),
  )

  return {
    list,
    total: total,
    page: isArray ? params.page : (response as RawResponse).page || params.page,
    pageSize: Number(
      isArray ? params.pageSize : (response as RawResponse).pageSize || params.pageSize,
    ),
  }
}

/**
 * 获取商品详情
 * GET /api/products/{id}
 */
export async function getProductDetail(id: number): Promise<Product | null> {
  try {
    const response = await get<ProductDetailResponse>(`${PRODUCT_LIST}/${id}`)

    // 解析价格范围，取最低价
    let price = 0
    if (response.priceRange) {
      const match = response.priceRange.match(/[\d.]+/)
      if (match) {
        price = parseFloat(match[0])
      }
    }

    // 计算总库存
    const totalStock = response.skus?.reduce((sum, sku) => sum + sku.stock, 0) || 0

    // 从 detailHtml 中提取图片 URL
    const detailImages: string[] = []
    if (response.detailHtml) {
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
      let match
      while ((match = imgRegex.exec(response.detailHtml)) !== null) {
        if (match[1]) {
          detailImages.push(match[1])
        }
      }
    }

    // 转换后端数据格式为前端格式
    const product: Product = {
      id: response.id,
      name: response.name,
      categoryId: response.categoryId || 0,
      categoryName: response.categoryName || '',
      mainImage: response.mainImages?.[0] || '',
      images: response.mainImages || [],
      price,
      stock: totalStock,
      status: 1,
      description: response.desc || '', // 使用简短描述
      detailImages, // 从 detailHtml 提取的图片
      params: response.params, // 保留原始参数
      skuSpec: {
        cpus: response.specs?.find((s) => s.name === '处理器' || s.name === 'CPU')?.values || [],
        rams: response.specs?.find((s) => s.name === '内存容量' || s.name === '内存')?.values || [],
        storages:
          response.specs?.find((s) => s.name === '存储容量' || s.name === '存储')?.values || [],
        gpus: response.specs?.find((s) => s.name === '显卡' || s.name === '显卡规格')?.values || [],
        vramCapacities:
          response.specs?.find((s) => s.name === '显存容量' || s.name === '显存')?.values || [],
        combinations:
          response.skus?.map((s) => {
            const specs = s.specs as Record<string, string | number>
            return {
              id: s.id,
              cpu: String(specs.cpu || ''),
              ram: String(specs.ram || specs.memory || ''),
              storage: String(specs.storage || ''),
              gpu: String(specs.gpu || ''),
              os: String(specs.os || ''),
              vramCapacity: String(specs.vramCapacity || specs.vram_capacity || ''),
              stock: s.stock,
              price: s.price,
            }
          }) || [],
      },
    }

    return product
  } catch (error) {
    console.error('获取商品详情失败:', error)
    return null
  }
}

/**
 * 添加商品
 * POST /api/admin/products
 * 创建新的商品，名称不能重复
 * 注意：商品的 SKU 通过单独的 SKU API 管理
 */
export async function addProduct(data: ProductForm): Promise<ProductCreateResponse> {
  // 组装主图数组：优先主图，其次轮播图（URL地址）
  const mainImages: string[] = []
  if (data.mainImage) mainImages.push(data.mainImage)
  if (Array.isArray(data.images) && data.images.length > 0) {
    mainImages.push(...data.images.filter(Boolean))
  }

  // 组装图文详情：将详情图片转成简单的 <img> HTML 片段
  const detailHtmlFromImages = Array.isArray(data.detailImages)
    ? data.detailImages
        .filter(Boolean)
        .map((url) => `<img src="${url}" style="max-width:100%;display:block;" />`)
        .join('\n')
    : ''

  // 将前端表单数据转换为后端API所需格式
  const requestBody: ProductCreateRequest = {
    category_id: data.categoryId || null,
    name: data.name,
    description: data.description || '',
    detail_html: detailHtmlFromImages || data.description || '',
    main_images: mainImages.length ? mainImages : [],

    // 注入技术参数并转换为 snake_case
    model: data.params?.model,
    os: data.params?.os,
    positioning: data.params?.positioning,
    cpu_model: data.params?.cpuModel,
    cpu_series: data.params?.cpuSeries,
    max_turbo_freq: data.params?.maxTurboFreq,
    cpu_chip: data.params?.cpuChip,
    screen_size: data.params?.screenSize,
    screen_ratio: data.params?.screenRatio,
    resolution: data.params?.resolution,
    color_gamut: data.params?.colorGamut,
    refresh_rate: data.params?.refreshRate,
    ram_type: data.params?.ramType,
    ssd_type: data.params?.ssdType,
    gpu_type: data.params?.gpuType,
    vram_type: data.params?.vramType,
    camera: data.params?.camera,
    wifi: data.params?.wifi,
    bluetooth: data.params?.bluetooth,
    data_interfaces: data.params?.dataInterfaces,
    video_interfaces: data.params?.videoInterfaces,
    audio_interfaces: data.params?.audioInterfaces,
    keyboard: data.params?.keyboard,
    face_id: data.params?.faceId,
    weight: data.params?.weight,
    thickness: data.params?.thickness,
    software: data.params?.software,
  }

  // 调试日志：查看发送的请求数据
  console.log('📦 addProduct 发送给后端的数据摘要:', {
    name: requestBody.name,
    category_id: requestBody.category_id,
    main_images_count: mainImages.length,
  })

  const response = await post<ProductCreateResponse>(
    PRODUCT_BASE,
    requestBody as unknown as Record<string, unknown>,
  )

  console.log('✅ addProduct 响应数据:', response)

  return response
}

/**
 * 更新商品
 * PUT /api/admin/products/{id}
 * 更新商品信息，名称不能重复且不能为空
 * 注意：商品的 SKU 通过单独的 SKU API 管理
 */
export async function updateProduct(data: ProductForm): Promise<ProductCreateResponse> {
  if (!data.id) {
    throw new Error('商品ID不能为空')
  }

  // 组装主图数组：优先主图，其次轮播图（URL地址）
  const mainImages: string[] = []
  if (data.mainImage) mainImages.push(data.mainImage)
  if (Array.isArray(data.images) && data.images.length > 0) {
    mainImages.push(...data.images.filter(Boolean))
  }

  // 组装图文详情：将详情图片转成简单的 <img> HTML 片段
  const detailHtmlFromImages = Array.isArray(data.detailImages)
    ? data.detailImages
        .filter(Boolean)
        .map((url) => `<img src="${url}" style="max-width:100%;display:block;" />`)
        .join('\n')
    : ''

  // 将前端表单数据转换为后端API所需格式
  const requestBody: ProductCreateRequest = {
    category_id: data.categoryId ? Number(data.categoryId) : null,
    name: data.name,
    description: data.description || '',
    detail_html: detailHtmlFromImages || data.description || '',
    main_images: mainImages.length ? mainImages : [],

    // 注入技术参数并转换为 snake_case
    model: data.params?.model,
    os: data.params?.os,
    positioning: data.params?.positioning,
    cpu_model: data.params?.cpuModel,
    cpu_series: data.params?.cpuSeries,
    max_turbo_freq: data.params?.maxTurboFreq,
    cpu_chip: data.params?.cpuChip,
    screen_size: data.params?.screenSize,
    screen_ratio: data.params?.screenRatio,
    resolution: data.params?.resolution,
    color_gamut: data.params?.colorGamut,
    refresh_rate: data.params?.refreshRate,
    ram_type: data.params?.ramType,
    ssd_type: data.params?.ssdType,
    gpu_type: data.params?.gpuType,
    vram_type: data.params?.vramType,
    camera: data.params?.camera,
    wifi: data.params?.wifi,
    bluetooth: data.params?.bluetooth,
    data_interfaces: data.params?.dataInterfaces,
    video_interfaces: data.params?.videoInterfaces,
    audio_interfaces: data.params?.audioInterfaces,
    keyboard: data.params?.keyboard,
    face_id: data.params?.faceId,
    weight: data.params?.weight,
    thickness: data.params?.thickness,
    software: data.params?.software,
  }

  return put<ProductCreateResponse>(
    `${PRODUCT_BASE}/${data.id}`,
    requestBody as unknown as Record<string, unknown>,
  )
}

/**
 * 删除商品
 * DELETE /api/admin/products/{id}
 * 删除指定ID的商品
 */
export async function deleteProduct(id: number): Promise<void> {
  return del<void>(`${PRODUCT_BASE}/${id}`)
}

/**
 * 批量更新商品状态（上下架）
 * PUT /api/admin/products/status
 * 批量更新商品的上架/下架状态
 */
export async function batchUpdateProductStatus(ids: number[], status: 0 | 1): Promise<void> {
  const requestBody: BatchUpdateStatusRequest = {
    ids,
    status,
  }

  return put<void>(`${PRODUCT_BASE}/status`, requestBody as unknown as Record<string, unknown>)
}

const SKU_BASE = '/api/admin/sku'

/**
 * 新增 SKU
 * POST /api/admin/sku
 * 为指定产品创建新的SKU（具体规格）
 */
export async function addSku(data: SkuCreateRequest): Promise<SkuCreateResponse> {
  return post<SkuCreateResponse>(SKU_BASE, data as unknown as Record<string, unknown>)
}

/**
 * 更新 SKU
 * PUT /api/admin/sku/{id}
 * 更新指定ID的SKU信息
 */
export async function updateSku(id: number, data: SkuUpdateRequest): Promise<void> {
  return put<void>(`${SKU_BASE}/${id}`, data as unknown as Record<string, unknown>)
}

/**
 * 删除 SKU
 * DELETE /api/admin/sku/{id}
 * 删除指定ID的SKU
 */
export async function deleteSku(id: number): Promise<void> {
  return del<void>(`${SKU_BASE}/${id}`)
}

/**
 * 批量更新 SKU 状态
 * PUT /api/admin/sku/batch-status
 * 批量更新SKU的激活状态
 */
export async function batchUpdateSkuStatus(ids: number[], isActive: number): Promise<void> {
  const requestBody = {
    ids,
    is_active: isActive,
  }

  return put<void>(`${SKU_BASE}/batch-status`, requestBody as unknown as Record<string, unknown>)
}

/**
 * 批量保存 SKU（新增或更新）
 * 根据 SKU 是否有 id 来判断是新增还是更新
 * @param productId 商品ID
 * @param skus SKU 列表
 * @param existingSkuIds 原有的 SKU ID 列表（用于判断是否需要删除）
 */
export async function batchSaveSkus(
  productId: number,
  skus: {
    id?: number
    cpu: string
    ram: string
    storage: string
    gpu: string
    stock: number
    price: number
    os?: string
    vramCapacity?: string
  }[],
  existingSkuIds: number[] = [],
): Promise<void> {
  // 收集当前提交的所有带 id 的 SKU
  const currentIds = skus.filter((s) => s.id).map((s) => s.id as number)

  // 找出需要删除的 SKU（在原有列表中但不在当前列表中）
  const idsToDelete = existingSkuIds.filter((id) => !currentIds.includes(id))

  // 删除需要删除的 SKU
  for (const id of idsToDelete) {
    try {
      await deleteSku(id)
      console.log(`✅ 已删除 SKU: ${id}`)
    } catch (error) {
      console.error(`❌ 删除 SKU ${id} 失败:`, error)
    }
  }

  // 新增或更新 SKU
  for (const sku of skus) {
    const skuData: SkuCreateRequest = {
      product_id: productId,
      price: sku.price,
      stock: sku.stock,
      os: sku.os || '',
      cpu: sku.cpu || '',
      ram: sku.ram || '',
      storage: sku.storage || '',
      gpu: sku.gpu || '',
      vram_capacity: sku.vramCapacity || '',
      is_active: 1,
    }

    try {
      if (sku.id) {
        // 更新已有 SKU
        await updateSku(sku.id, skuData as SkuUpdateRequest)
        console.log(`✅ 已更新 SKU: ${sku.id}`)
      } else {
        // 新增 SKU
        const result = await addSku(skuData)
        console.log(`✅ 已新增 SKU: ${result.id}`)
      }
    } catch (error) {
      console.error(`❌ 保存 SKU 失败:`, sku, error)
      throw error
    }
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
  totalProducts: number // 商品总数
  onSaleProducts: number // 在售商品
  offSaleProducts: number // 下架商品
  lowStockProducts: number // 库存预警（库存<10）
  totalCategories: number // 分类总数
  todayViews: number // 今日浏览量
  monthViews: number // 本月浏览量
  categorySales: CategorySalesItem[] // 分类销量
  hotProducts: HotProductItem[] // 热销商品Top5
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
      { categoryId: 5, categoryName: '小新系列', salesCount: 450, salesAmount: 2700000 },
    ],
    hotProducts: [
      {
        id: 1,
        name: 'ThinkPad X1 Carbon 2024',
        mainImage: 'https://picsum.photos/100/100?random=1',
        salesCount: 156,
        salesAmount: 2027400,
      },
      {
        id: 2,
        name: '拯救者 Y9000P 2024',
        mainImage: 'https://picsum.photos/100/100?random=2',
        salesCount: 142,
        salesAmount: 1704000,
      },
      {
        id: 3,
        name: 'YOGA Pro 14s',
        mainImage: 'https://picsum.photos/100/100?random=3',
        salesCount: 128,
        salesAmount: 1152000,
      },
      {
        id: 4,
        name: '小新 Pro 16 2024',
        mainImage: 'https://picsum.photos/100/100?random=4',
        salesCount: 115,
        salesAmount: 690000,
      },
      {
        id: 5,
        name: 'ThinkBook 14+ 2024',
        mainImage: 'https://picsum.photos/100/100?random=5',
        salesCount: 98,
        salesAmount: 588000,
      },
    ],
  }

  // 真实API调用
  // return get<ProductStatisticsData>('/api/admin/products/statistics')
}
