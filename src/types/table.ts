// 餐桌/购物车相关类型定义

export interface IParticipant {
  id: string
  nickname: string
  avatar: string // emoji 头像
  joinedAt: number
}

export interface ICartItem {
  id: string // 唯一条目 ID
  dishId: string
  dishName: string
  price: number
  quantity: number
  userId: string // 归属用户 ID
  addedAt: number
  remark?: string // 菜品备注
}

export interface IOrder {
  orderNo: string
  userId: string // 提交该订单的用户
  createdAt: number
  totalAmount: number
  totalCount: number
  items: ICartItem[] // 下单时的菜品快照
}

export interface ITableState {
  roomCode: string // 4 位房间码
  participants: IParticipant[]
  cartItems: ICartItem[] // 未提交的活跃购物车
  submitted: IOrder[] // 各用户已提交的订单（每人一条，互不影响）
  createdAt: number
}
