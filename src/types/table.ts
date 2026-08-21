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
  createdAt: number
  totalAmount: number
  totalCount: number
  items: ICartItem[] // 下单时的菜品快照
}

export interface ITableState {
  roomCode: string // 4 位房间码
  participants: IParticipant[]
  cartItems: ICartItem[]
  status: 'ordering' | 'ordered' // 点餐中 / 已下单
  order?: IOrder
  createdAt: number
}
