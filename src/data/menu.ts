// 菜品分类与模拟数据

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
}

export const MOCK_CATEGORIES: ICategory[] = [
  { key: 'hot', name: '热菜', icon: '🍲' },
  { key: 'cold', name: '凉菜', icon: '🥗' },
  { key: 'staple', name: '主食', icon: '🍚' },
  { key: 'soup', name: '汤品', icon: '🥣' },
  { key: 'drink', name: '饮品', icon: '🧋' },
  { key: 'dessert', name: '甜点', icon: '🍰' },
]

export const MOCK_DISHES: IDish[] = [
  // 热菜
  { id: 'h1', name: '宫保鸡丁', price: 38, description: '经典川菜，鸡肉鲜嫩', category: 'hot', tags: ['微辣', '招牌'], emoji: '🍗' },
  { id: 'h2', name: '麻婆豆腐', price: 28, description: '麻辣鲜香，下饭神器', category: 'hot', tags: ['中辣', '川味'], emoji: '🥘' },
  { id: 'h3', name: '红烧肉', price: 58, description: '肥而不腻，入口即化', category: 'hot', tags: ['不辣', '经典'], emoji: '🍖' },
  { id: 'h4', name: '糖醋里脊', price: 48, description: '酸甜可口，外酥里嫩', category: 'hot', tags: ['酸甜', '人气'], emoji: '🍤' },
  { id: 'h5', name: '水煮鱼', price: 88, description: '麻辣鲜香，鱼肉滑嫩', category: 'hot', tags: ['重辣', '推荐'], emoji: '🐟' },
  { id: 'h6', name: '回锅肉', price: 42, description: '传统川味，香辣下饭', category: 'hot', tags: ['中辣', '传统'], emoji: '🥓' },
  // 凉菜
  { id: 'c1', name: '凉拌黄瓜', price: 18, description: '清爽开胃', category: 'cold', tags: ['清淡', '开胃'], emoji: '🥒' },
  { id: 'c2', name: '口水鸡', price: 38, description: '麻辣鲜香，皮脆肉嫩', category: 'cold', tags: ['麻辣', '招牌'], emoji: '🍗' },
  { id: 'c3', name: '皮蛋豆腐', price: 22, description: '嫩滑爽口', category: 'cold', tags: ['清淡', '家常'], emoji: '🥚' },
  { id: 'c4', name: '夫妻肺片', price: 42, description: '麻辣鲜香，色泽红亮', category: 'cold', tags: ['麻辣', '川味'], emoji: '🌶️' },
  // 主食
  { id: 's1', name: '蛋炒饭', price: 22, description: '粒粒分明，蛋香浓郁', category: 'staple', tags: ['不辣', '经典'], emoji: '🍚' },
  { id: 's2', name: '牛肉拉面', price: 32, description: '汤鲜面筋，牛肉软烂', category: 'staple', tags: ['不辣', '人气'], emoji: '🍜' },
  { id: 's3', name: '葱油饼', price: 18, description: '外酥里软，葱香四溢', category: 'staple', tags: ['咸香', '小吃'], emoji: '🫓' },
  { id: 's4', name: '小笼包', price: 28, description: '皮薄馅大，汤汁鲜美', category: 'staple', tags: ['鲜香', '招牌'], emoji: '🥟' },
  // 汤品
  { id: 't1', name: '酸辣汤', price: 25, description: '酸辣开胃，暖身暖胃', category: 'soup', tags: ['酸辣', '开胃'], emoji: '🍲' },
  { id: 't2', name: '番茄蛋汤', price: 18, description: '酸甜可口，家常味道', category: 'soup', tags: ['酸甜', '清淡'], emoji: '🍅' },
  { id: 't3', name: '紫菜蛋花汤', price: 15, description: '清淡鲜美', category: 'soup', tags: ['清淡', '速食'], emoji: '🥣' },
  { id: 't4', name: '排骨玉米汤', price: 48, description: '滋补养生，汤鲜味美', category: 'soup', tags: ['滋补', '养生'], emoji: '🍖' },
  // 饮品
  { id: 'd1', name: '珍珠奶茶', price: 18, description: 'Q弹珍珠，香浓奶茶', category: 'drink', tags: ['甜', '热销'], emoji: '🧋' },
  { id: 'd2', name: '柠檬水', price: 12, description: '清爽解腻', category: 'drink', tags: ['酸甜', '清爽'], emoji: '🍋' },
  { id: 'd3', name: '鲜榨橙汁', price: 28, description: '新鲜现榨，维C满满', category: 'drink', tags: ['甜', '鲜榨'], emoji: '🍊' },
  { id: 'd4', name: '可乐', price: 8, description: '冰爽可口', category: 'drink', tags: ['冰爽', '经典'], emoji: '🥤' },
  // 甜点
  { id: 'e1', name: '芒果布丁', price: 22, description: '香甜嫩滑，芒果味浓', category: 'dessert', tags: ['甜', '芒果'], emoji: '🍮' },
  { id: 'e2', name: '提拉米苏', price: 38, description: '意式经典，咖啡香浓', category: 'dessert', tags: ['甜', '咖啡'], emoji: '🍰' },
  { id: 'e3', name: '杨枝甘露', price: 28, description: '港式甜品，清爽解腻', category: 'dessert', tags: ['甜', '港式'], emoji: '🥭' },
  { id: 'e4', name: '双皮奶', price: 20, description: '嫩滑香甜，经典广式', category: 'dessert', tags: ['甜', '广式'], emoji: '🥛' },
]
