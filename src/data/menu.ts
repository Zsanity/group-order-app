// 菜单数据 - 伊兰穆择清真烧烤
// 数据来源：实际价目表（串类按斤/份计价，素菜按串，调料/用具按件）

export interface ICategory {
  key: string
  name: string
  icon: string
}

export interface IDish {
  id: string
  name: string
  price: number
  description: string
  category: string
  tags: string[]
  emoji: string
  /** 规格/份量说明，如 "15-16串"、"一把10串"、"小袋" */
  spec?: string
  /** 基础数量（同桌备料上限）：被点达到/超过该值后继续加点会标红提示 */
  baseQuantity?: number
  /** 基础数量/已点数的显示单位，如 "串"、"袋"、"瓶"、"把"（食材类基础单位为串） */
  unit?: string
}

// 本店通用说明
export const MENU_NOTE =
  '注：单价按原总价 ÷ 串数下限核算；法式羊排按块计价、风味烤肠按根计价；本店所有串系均带签子出售，谢谢！'

export const MOCK_CATEGORIES: ICategory[] = [
  { key: 'lamb', name: '羊肉类', icon: '🐑' },
  { key: 'beef', name: '牛肉类', icon: '🐂' },
  { key: 'chicken', name: '鸡肉类', icon: '🐔' },
  { key: 'other', name: '其它串', icon: '🍢' },
  { key: 'veg', name: '素菜主食', icon: '🥬' },
  { key: 'seasoning', name: '调料类', icon: '🧂' },
  { key: 'tools', name: '烧烤用具', icon: '🔥' },
]

export const MOCK_DISHES: IDish[] = [
  // ===== 羊肉类（元/串，法式羊排按块）=====
  { id: 'l1', name: '羊肉串', price: 3.3, description: '鲜嫩多汁，孜然飘香', category: 'lamb', tags: ['招牌', '人气'], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 60 },
  { id: 'l2', name: '羊肉筋', price: 3, description: '筋道有嚼劲，越嚼越香', category: 'lamb', tags: ['推荐'], emoji: '🥩', spec: '串', unit: '串' },
  { id: 'l3', name: '羊腰', price: 13, description: '滋补鲜嫩，炭火炙烤', category: 'lamb', tags: ['滋补'], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 10 },
  { id: 'l4', name: '羊板筋', price: 4, description: 'Q弹爽口，烧烤必备', category: 'lamb', tags: [], emoji: '🍖', spec: '串', unit: '串' },
  { id: 'l5', name: '羊宝', price: 10, description: '炭烤入味，香气浓郁', category: 'lamb', tags: ['滋补'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'l6', name: '羊鞭', price: 8, description: '劲道弹牙，风味独特', category: 'lamb', tags: ['滋补'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'l7', name: '羊脆', price: 6, description: '外焦里嫩，酥脆可口', category: 'lamb', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'l8', name: '法式羊排', price: 12, description: '整块羊排，肉香四溢', category: 'lamb', tags: ['招牌'], emoji: '🍖', spec: '块', unit: '块' },
  { id: 'l9', name: '羊肝', price: 2.5, description: '鲜嫩不膻，补铁佳品', category: 'lamb', tags: [], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 10 },
  // ===== 牛肉类（元/串）=====
  { id: 'b1', name: '牛肉串', price: 3, description: '肉质紧实，肉汁饱满', category: 'beef', tags: ['人气'], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 15 },
  { id: 'b2', name: '牛板筋(熟)', price: 3.7, description: '软糯带筋，越嚼越香', category: 'beef', tags: ['推荐'], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 10 },
  { id: 'b3', name: '牛心管(熟)', price: 7.3, description: '爽脆弹牙，烧烤经典', category: 'beef', tags: ['招牌'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'b4', name: '牛腰子', price: 4, description: '炭烤焦香，风味浓郁', category: 'beef', tags: [], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 10 },
  { id: 'b5', name: '牛蹄筋(熟)', price: 5, description: '软糯Q弹，胶原满满', category: 'beef', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'b6', name: '牛肉丸', price: 3.1, description: '弹牙多汁，肉香十足', category: 'beef', tags: ['推荐'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'b7', name: '牛胸口油', price: 5, description: '油香四溢，入口即化', category: 'beef', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  // ===== 鸡肉类（元/串）=====
  { id: 'c1', name: '鸡翅(原味)', price: 5, description: '外皮焦香，肉质嫩滑', category: 'chicken', tags: ['人气'], emoji: '🍗', spec: '串', unit: '串', baseQuantity: 15 },
  { id: 'c2', name: '鸡翅(奥尔良)', price: 5, description: '奥尔良风味，甜辣适口', category: 'chicken', tags: ['招牌'], emoji: '🍗', spec: '串', unit: '串' },
  { id: 'c3', name: '鸡胗', price: 1.8, description: '爽脆有嚼劲，下酒神器', category: 'chicken', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'c4', name: '鸡心', price: 2.8, description: '鲜嫩弹牙，炭香四溢', category: 'chicken', tags: [], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 15 },
  { id: 'c5', name: '鸡软骨', price: 3.8, description: '嘎嘣脆，越嚼越香', category: 'chicken', tags: ['推荐'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'c6', name: '鸡肉串', price: 2.5, description: '嫩滑多汁，老少皆宜', category: 'chicken', tags: [], emoji: '🍢', spec: '串', unit: '串', baseQuantity: 15 },
  { id: 'c7', name: '鸡皮', price: 2.8, description: '焦香酥脆，油而不腻', category: 'chicken', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'c8', name: '三角脆', price: 2.3, description: '独特口感，香脆可口', category: 'chicken', tags: [], emoji: '🍢', spec: '串', unit: '串' },
  // ===== 其它类（元/串，风味烤肠按根）=====
  { id: 'o1', name: '面筋', price: 2, description: '软韧入味，素串经典', category: 'other', tags: ['素'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'o2', name: '鱿鱼', price: 5, description: '鲜香弹牙，烧烤海鲜', category: 'other', tags: ['海鲜'], emoji: '🦑', spec: '串', unit: '串', baseQuantity: 5 },
  { id: 'o3', name: '鱼豆腐', price: 2.1, description: '鲜嫩Q弹，滋味十足', category: 'other', tags: ['推荐'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'o4', name: '骨肉相连', price: 2.1, description: '骨脆肉嫩，越啃越香', category: 'other', tags: ['人气'], emoji: '🍢', spec: '串', unit: '串' },
  { id: 'o5', name: '风味烤肠', price: 2.5, description: '外脆里嫩，风味独特', category: 'other', tags: [], emoji: '🌭', spec: '根', unit: '根' },
  // ===== 素菜主食 =====
  { id: 'v1', name: '豆皮卷金针菇', price: 3, description: '鲜香多汁，层次丰富', category: 'veg', tags: ['素'], emoji: '🥬', spec: '串' },
  { id: 'v2', name: '豆皮卷香菜', price: 3, description: '香菜清香，爽口解腻', category: 'veg', tags: ['素'], emoji: '🥬', spec: '串' },
  { id: 'v3', name: '茄子', price: 3, description: '软糯入味，蒜香浓郁', category: 'veg', tags: ['素'], emoji: '🍆', spec: '串' },
  { id: 'v4', name: '辣椒', price: 3, description: '微辣鲜香，开胃下酒', category: 'veg', tags: ['辣', '素'], emoji: '🌶️', spec: '串' },
  { id: 'v5', name: '玉米粒', price: 5, description: '香甜可口，粒粒分明', category: 'veg', tags: ['甜', '素'], emoji: '🌽', spec: '一把10串' },
  { id: 'v6', name: '大蒜', price: 3, description: '烤蒜软糯，香气扑鼻', category: 'veg', tags: ['素'], emoji: '🧄', spec: '串' },
  { id: 'v7', name: '香菇', price: 3, description: '肥厚多汁，菌香浓郁', category: 'veg', tags: ['素'], emoji: '🍄', spec: '串' },
  { id: 'v8', name: '馒头', price: 2, description: '外脆里软，饱腹主食', category: 'veg', tags: ['主食'], emoji: '🍞', spec: '串' },
  { id: 'v9', name: '烤馕', price: 5, description: '面香四溢，越嚼越香', category: 'veg', tags: ['主食'], emoji: '🫓', spec: '串' },
  // ===== 调料类 =====
  { id: 's1', name: '孜然(小)', price: 5, description: '烧烤灵魂调料', category: 'seasoning', tags: ['调料'], emoji: '🧂', spec: '袋' },
  { id: 's2', name: '孜然(大)', price: 10, description: '烧烤灵魂调料', category: 'seasoning', tags: ['调料'], emoji: '🧂', spec: '袋', baseQuantity: 1, unit: '袋' },
  { id: 's3', name: '辣椒(小)', price: 5, description: '香辣过瘾', category: 'seasoning', tags: ['辣', '调料'], emoji: '🌶️', spec: '袋' },
  { id: 's4', name: '辣椒(大)', price: 10, description: '香辣过瘾', category: 'seasoning', tags: ['辣', '调料'], emoji: '🌶️', spec: '袋', baseQuantity: 1, unit: '袋' },
  { id: 's5', name: '烧烤酱·原味', price: 5, description: '经典烧烤蘸酱', category: 'seasoning', tags: ['蘸酱'], emoji: '🥫', spec: '袋' },
  { id: 's6', name: '烧烤酱·香辣', price: 5, description: '香辣风味蘸酱', category: 'seasoning', tags: ['辣', '蘸酱'], emoji: '🥫', spec: '袋' },
  { id: 's7', name: '烧烤酱·奥尔良', price: 5, description: '奥尔良风味蘸酱', category: 'seasoning', tags: ['蘸酱'], emoji: '🥫', spec: '袋' },
  { id: 's8', name: '烧烤酱·黑椒', price: 5, description: '黑椒风味蘸酱', category: 'seasoning', tags: ['蘸酱'], emoji: '🥫', spec: '袋' },
  { id: 's9', name: '烧烤酱·蒜蓉', price: 5, description: '蒜香浓郁蘸酱', category: 'seasoning', tags: ['蘸酱'], emoji: '🥫', spec: '袋' },
  { id: 's10', name: '盐', price: 3, description: '基础调味', category: 'seasoning', tags: ['调料'], emoji: '🧂', spec: '袋', baseQuantity: 1, unit: '袋' },
  { id: 's11', name: '蘸料·香辣', price: 7, description: '秘制香辣蘸料', category: 'seasoning', tags: ['辣', '蘸料'], emoji: '🥣', spec: '份' },
  { id: 's12', name: '蘸料·原味', price: 7, description: '秘制原味蘸料', category: 'seasoning', tags: ['蘸料'], emoji: '🥣', spec: '份' },
  { id: 's13', name: '蘸料·五香', price: 7, description: '五香风味蘸料', category: 'seasoning', tags: ['蘸料'], emoji: '🥣', spec: '份' },
  { id: 's14', name: '蘸料·麻辣', price: 7, description: '麻辣过瘾蘸料', category: 'seasoning', tags: ['辣', '蘸料'], emoji: '🥣', spec: '份' },
  // ===== 烧烤用具 =====
  { id: 't1', name: '刷子', price: 3, description: '刷油刷酱好帮手', category: 'tools', tags: ['用具'], emoji: '🖌️', spec: '把' },
  { id: 't2', name: '篦子', price: 10, description: '烧烤网架', category: 'tools', tags: ['用具'], emoji: '🍢', spec: '个' },
  { id: 't3', name: '酒精', price: 2, description: '点火助燃', category: 'tools', tags: ['耗材'], emoji: '🔥', spec: '瓶', baseQuantity: 3, unit: '瓶' },
  { id: 't4', name: '烤架(小)', price: 25, description: '小巧便携', category: 'tools', tags: ['用具'], emoji: '🔥', spec: '个' },
  { id: 't5', name: '烤架(大)', price: 35, description: '容量更大', category: 'tools', tags: ['用具'], emoji: '🔥', spec: '个' },
  { id: 't6', name: '炉子(小)55cm', price: 45, description: '家庭烧烤炉', category: 'tools', tags: ['用具'], emoji: '🔥', spec: '个' },
  { id: 't7', name: '炉子(中)65cm', price: 55, description: '多人烧烤炉', category: 'tools', tags: ['用具'], emoji: '🔥', spec: '个' },
  { id: 't8', name: '炉子(大)70cm', price: 65, description: '聚餐烧烤炉', category: 'tools', tags: ['用具'], emoji: '🔥', spec: '个' },
  { id: 't9', name: '竹签', price: 10, description: '串串必备', category: 'tools', tags: ['耗材'], emoji: '🥢', spec: '把' },
  { id: 't10', name: '扇子', price: 5, description: '扇火助燃', category: 'tools', tags: ['用具'], emoji: '🪭', spec: '把', baseQuantity: 1, unit: '把' },
  { id: 't11', name: '木炭', price: 10, description: '经典木炭', category: 'tools', tags: ['耗材'], emoji: '🪵', spec: '袋', baseQuantity: 1, unit: '袋' },
  { id: 't12', name: '无烟炭', price: 10, description: '无烟环保炭', category: 'tools', tags: ['耗材'], emoji: '🪵', spec: '袋' },
  { id: 't13', name: '无烟炭', price: 35, description: '无烟环保炭', category: 'tools', tags: ['耗材'], emoji: '📦', spec: '箱' },
  { id: 't14', name: '一次性盒子', price: 0.8, description: '打包分装', category: 'tools', tags: ['耗材'], emoji: '📦', spec: '个' },
  { id: 't15', name: '一次性盘子', price: 0.6, description: '分餐盛放', category: 'tools', tags: ['耗材'], emoji: '🍽️', spec: '个' },
  { id: 't16', name: '一次性筷子', price: 0.5, description: '方便卫生', category: 'tools', tags: ['耗材'], emoji: '🥢', spec: '双' },
]


/**
 * 计算每个菜品的“每份最小串数”。
 * 现价目表按串/块/根计价，每次加点即 1 串/块/根，故统一返回 1；
 * 保留对历史“15-16串”等规格的兼容。
 */
export function getMinPortionCount(dish: IDish): number {
  if (dish.unit === '串') {
    const m = dish.spec?.match(/(\d+)\s*[-~至]\s*(\d+)\s*串/);
    if (m) return parseInt(m[1], 10);
    return 1; // 规格为 "串"（如鱿鱼 ¥5/串）时，1份=1串
  }
  return 1; // 袋/瓶/把/块/根
}

/** 按菜品 id 查找菜品（用于从订单项反查单位等） */
export function getDishById(id: string): IDish | undefined {
  return MOCK_DISHES.find((d) => d.id === id)
}

/** 取某菜品的计价单位（串/块/根/袋/瓶/把），默认串 */
export function getDishUnit(id: string): string {
  return getDishById(id)?.unit || '串'
}
