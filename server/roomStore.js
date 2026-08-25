// 服务器端权威状态：房间管理 + 操作意图应用
// 采用“服务器权威 + 广播全量状态”模型，保证多客户端实时一致。
// 每次状态变更写入 SQLite，启动时回放，实现订单/历史持久化（重启不丢）。

import { saveRoom, loadAllRooms } from './db.js'

const AVATAR_POOL = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒', '🍍', '🥑', '🍉', '🥭']

function genId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function genRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function pickAvatar(used = []) {
  const remain = AVATAR_POOL.filter((a) => !used.includes(a))
  const pool = remain.length > 0 ? remain : AVATAR_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

function genOrderNo() {
  return 'NO' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10)
}

// room: { roomCode, participants[], cartItems[], status, order?, createdAt }
const rooms = new Map() // roomCode -> room

// 启动时从数据库回放已持久化的房间（重启不丢）
for (const room of loadAllRooms()) {
  rooms.set(room.roomCode, room)
}

export function createRoom(userId, nickname) {
  let roomCode = genRoomCode()
  while (rooms.has(roomCode)) roomCode = genRoomCode()
  const user = {
    id: userId || genId('u_'), // 有账号时使用稳定账号ID，保证换浏览器同一身份
    nickname: (nickname || '').trim() || '食客' + Math.floor(Math.random() * 100),
    avatar: AVATAR_POOL[0],
    joinedAt: Date.now(),
  }
  const room = {
    roomCode,
    participants: [user],
    cartItems: [],
    submitted: [], // 各用户已提交的订单快照（每人一条）
    createdAt: Date.now(),
  }
  rooms.set(roomCode, room)
  saveRoom(room)
  return { roomCode, userId: user.id, state: room }
}

export function joinRoom(roomCode, userId, nickname) {
  const room = rooms.get(roomCode)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  // 同一账号再次加入：直接返回其原有身份（保持头像与已提交订单，避免重复成员）
  if (userId) {
    const existing = room.participants.find((p) => p.id === userId)
    if (existing) {
      return { roomCode, userId: existing.id, state: room }
    }
  }
  const name = (nickname || '').trim() || '食客' + Math.floor(Math.random() * 100)
  if (room.participants.some((p) => p.nickname === name)) {
    return { error: 'NICKNAME_TAKEN' }
  }
  const usedAvatars = room.participants.map((p) => p.avatar)
  const user = {
    id: userId || genId('u_'),
    nickname: name,
    avatar: pickAvatar(usedAvatars),
    joinedAt: Date.now(),
  }
  room.participants.push(user)
  saveRoom(room)
  return { roomCode, userId: user.id, state: room }
}

export function getRoom(roomCode) {
  return rooms.get(roomCode) || null
}

export function roomExists(roomCode) {
  return rooms.has(roomCode)
}

// 新增参与者（模拟他人加入 / 追加成员）
export function addParticipant(room, nickname) {
  const name = (nickname || '').trim()
  if (!name) return { error: 'EMPTY_NICKNAME' }
  if (room.participants.some((p) => p.nickname === name)) {
    return { error: 'NICKNAME_TAKEN' }
  }
  const usedAvatars = room.participants.map((p) => p.avatar)
  const participant = {
    id: genId('u_'),
    nickname: name,
    avatar: pickAvatar(usedAvatars),
    joinedAt: Date.now(),
  }
  room.participants.push(participant)
  return { participant, state: room }
}

// ---- 购物车操作 ----

export function cartAdd(room, { userId, dishId, dishName, price, remark }) {
  if (!userId) return { error: 'MISSING_USER' }
  // 只有该用户本人提交后才锁定其购物车；其他人不受影响
  if (room.submitted.some((s) => s.userId === userId)) return { error: 'ALREADY_SUBMITTED' }
  if (!dishId) return { error: 'MISSING_DISH' }
  const existing = room.cartItems.find((i) => i.dishId === dishId && i.userId === userId)
  if (existing) {
    existing.quantity += 1
    if (remark && !existing.remark) existing.remark = remark
  } else {
    room.cartItems.push({
      id: genId('ci_'),
      dishId,
      dishName: dishName || '',
      price: Number(price) || 0,
      quantity: 1,
      userId,
      addedAt: Date.now(),
      remark: remark || undefined,
    })
  }
  return { state: room }
}

export function cartUpdateQty(room, { itemId, quantity }) {
  const qty = Number(quantity)
  if (qty <= 0) {
    room.cartItems = room.cartItems.filter((i) => i.id !== itemId)
  } else {
    const item = room.cartItems.find((i) => i.id === itemId)
    if (item) item.quantity = qty
  }
  return { state: room }
}

export function cartRemove(room, { itemId }) {
  room.cartItems = room.cartItems.filter((i) => i.id !== itemId)
  return { state: room }
}

export function cartUpdateRemark(room, { itemId, remark }) {
  const item = room.cartItems.find((i) => i.id === itemId)
  if (item) item.remark = remark || undefined
  return { state: room }
}

// ---- 订单操作（按用户各自提交，互不影响）----

export function submitOrder(room, userId) {
  const items = room.cartItems.filter((i) => i.userId === userId)
  if (items.length === 0) return { error: 'EMPTY_CART' }
  if (room.submitted.some((s) => s.userId === userId)) return { error: 'ALREADY_SUBMITTED' }
  const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  room.submitted.push({
    userId,
    orderNo: genOrderNo(),
    createdAt: Date.now(),
    totalAmount,
    totalCount,
    items: items.map((i) => ({ ...i })),
  })
  // 已提交的菜品从活跃购物车移除，进入订单快照；其他用户不受影响
  room.cartItems = room.cartItems.filter((i) => i.userId !== userId)
  return { state: room }
}

export function cancelOrder(room, userId) {
  const removed = room.submitted.find((s) => s.userId === userId)
  if (!removed) return { error: 'NOT_SUBMITTED' }
  room.submitted = room.submitted.filter((s) => s.userId !== userId)
  // 把该用户的菜品退回活跃购物车，方便重新修改
  room.cartItems = room.cartItems.concat(removed.items.map((i) => ({ ...i })))
  return { state: room }
}

export function applyIntent(room, msg, userId) {
  // 统一入口：根据消息类型应用操作，返回 { state } 或 { error }
  let r
  switch (msg.type) {
    case 'participant:add':
      r = addParticipant(room, msg.nickname)
      break
    case 'cart:add':
      r = cartAdd(room, msg)
      break
    case 'cart:updateQty':
      r = cartUpdateQty(room, msg)
      break
    case 'cart:remove':
      r = cartRemove(room, msg)
      break
    case 'cart:updateRemark':
      r = cartUpdateRemark(room, msg)
      break
    case 'order:submit':
      r = submitOrder(room, userId)
      break
    case 'order:cancel':
      r = cancelOrder(room, userId)
      break
    default:
      return { error: 'UNKNOWN_TYPE' }
  }
  // 任何成功的状态变更都持久化到数据库
  if (r && !r.error && r.state) saveRoom(r.state)
  return r
}
