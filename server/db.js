// 持久化层（Node 内置 SQLite，无外部依赖）
// - users：用户账号（登录身份）
// - rooms / participants / cart_items / submitted_orders / submitted_items：房间与订单历史
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite')

const db = new DatabaseSync(DB_PATH)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rooms (
    roomCode TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS participants (
    roomCode TEXT NOT NULL,
    userId TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    joinedAt INTEGER,
    PRIMARY KEY (roomCode, userId)
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    roomCode TEXT NOT NULL,
    userId TEXT NOT NULL,
    dishId TEXT,
    dishName TEXT,
    price REAL,
    quantity INTEGER,
    remark TEXT,
    addedAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS submitted_orders (
    id TEXT PRIMARY KEY,
    roomCode TEXT NOT NULL,
    userId TEXT NOT NULL,
    orderNo TEXT,
    totalAmount REAL,
    totalCount INTEGER,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS submitted_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    roomCode TEXT NOT NULL,
    userId TEXT NOT NULL,
    dishId TEXT,
    dishName TEXT,
    price REAL,
    quantity INTEGER,
    remark TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(userId);
  CREATE INDEX IF NOT EXISTS idx_cart_room ON cart_items(roomCode);
  CREATE INDEX IF NOT EXISTS idx_submitted_room ON submitted_orders(roomCode);
  CREATE INDEX IF NOT EXISTS idx_submitted_user ON submitted_orders(userId);
`)

const AVATAR_POOL = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒', '🍍', '🥑', '🍉', '🥭']

function genId() {
  return 'u_' + crypto.randomBytes(8).toString('hex')
}

function pickAvatar() {
  return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)]
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const calc = crypto.scryptSync(String(pw), salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(calc, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ---- 账号 ----
export function createUser({ username, password, nickname }) {
  const uname = String(username || '').trim()
  if (!uname || !password) return { error: 'MISSING_FIELDS' }
  if (uname.length < 2 || uname.length > 20) return { error: 'BAD_USERNAME' }
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(uname)
  if (row) return { error: 'USERNAME_TAKEN' }
  const id = genId()
  const nick = String(nickname || '').trim() || uname
  db.prepare(
    'INSERT INTO users (id, username, password, nickname, avatar, created_at) VALUES (?,?,?,?,?,?)'
  ).run(id, uname, hashPassword(password), nick, pickAvatar(), Date.now())
  return { userId: id, username: uname, nickname: nick }
}

export function loginUser({ username, password }) {
  const uname = String(username || '').trim()
  if (!uname || !password) return { error: 'MISSING_FIELDS' }
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(uname)
  if (!row) return { error: 'USER_NOT_FOUND' }
  if (!verifyPassword(password, row.password)) return { error: 'BAD_PASSWORD' }
  return { userId: row.id, username: row.username, nickname: row.nickname || row.username }
}

export function getUserById(id) {
  if (!id) return null
  const row = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(id)
  return row || null
}

// ---- 房间与订单持久化（写穿透 + 启动回放）----

export function saveRoom(room) {
  const rc = room.roomCode
  const d1 = db.prepare('DELETE FROM submitted_items WHERE roomCode=?')
  const d2 = db.prepare('DELETE FROM submitted_orders WHERE roomCode=?')
  const d3 = db.prepare('DELETE FROM cart_items WHERE roomCode=?')
  const d4 = db.prepare('DELETE FROM participants WHERE roomCode=?')
  const d5 = db.prepare('DELETE FROM rooms WHERE roomCode=?')
  const insRoom = db.prepare('INSERT INTO rooms (roomCode, createdAt) VALUES (?,?)')
  const insP = db.prepare('INSERT INTO participants (roomCode,userId,nickname,avatar,joinedAt) VALUES (?,?,?,?,?)')
  const insC = db.prepare('INSERT INTO cart_items (id,roomCode,userId,dishId,dishName,price,quantity,remark,addedAt) VALUES (?,?,?,?,?,?,?,?,?)')
  const insO = db.prepare('INSERT INTO submitted_orders (id,roomCode,userId,orderNo,totalAmount,totalCount,createdAt) VALUES (?,?,?,?,?,?,?)')
  const insI = db.prepare('INSERT INTO submitted_items (id,orderId,roomCode,userId,dishId,dishName,price,quantity,remark) VALUES (?,?,?,?,?,?,?,?,?)')
  try {
    db.exec('BEGIN')
    d1.run(rc); d2.run(rc); d3.run(rc); d4.run(rc); d5.run(rc)
    insRoom.run(rc, room.createdAt)
    for (const p of room.participants) insP.run(rc, p.id, p.nickname, p.avatar, p.joinedAt)
    for (const it of room.cartItems) {
      insC.run(it.id, rc, it.userId, it.dishId, it.dishName, it.price, it.quantity, it.remark || null, it.addedAt)
    }
    for (const s of room.submitted) {
      const oid = 'o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      insO.run(oid, rc, s.userId, s.orderNo, s.totalAmount, s.totalCount, s.createdAt)
      for (const i of s.items) {
        const iid = 'si_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
        insI.run(iid, oid, rc, s.userId, i.dishId, i.dishName, i.price, i.quantity, i.remark || null)
      }
    }
    db.exec('COMMIT')
  } catch (e) {
    try { db.exec('ROLLBACK') } catch { /* ignore */ }
    throw e
  }
}

export function loadAllRooms() {
  const rooms = []
  const roomRows = db.prepare('SELECT roomCode, createdAt FROM rooms').all()
  const selP = db.prepare('SELECT userId,nickname,avatar,joinedAt FROM participants WHERE roomCode=?')
  const selC = db.prepare('SELECT id,userId,dishId,dishName,price,quantity,remark,addedAt FROM cart_items WHERE roomCode=?')
  const selO = db.prepare('SELECT id,userId,orderNo,totalAmount,totalCount,createdAt FROM submitted_orders WHERE roomCode=?')
  const selI = db.prepare('SELECT userId,dishId,dishName,price,quantity,remark FROM submitted_items WHERE orderId=?')
  for (const rr of roomRows) {
    const rc = rr.roomCode
    const participants = selP.all(rc).map((p) => ({ id: p.userId, nickname: p.nickname, avatar: p.avatar, joinedAt: p.joinedAt }))
    const cartItems = selC.all(rc).map((it) => ({ id: it.id, userId: it.userId, dishId: it.dishId, dishName: it.dishName, price: it.price, quantity: it.quantity, remark: it.remark, addedAt: it.addedAt }))
    const submitted = selO.all(rc).map((o) => ({
      userId: o.userId,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      totalCount: o.totalCount,
      items: selI.all(o.id).map((i) => ({ userId: i.userId, dishId: i.dishId, dishName: i.dishName, price: i.price, quantity: i.quantity, remark: i.remark })),
    }))
    rooms.push({ roomCode: rc, participants, cartItems, submitted, createdAt: rr.createdAt })
  }
  return rooms
}

// 某用户参与过的所有餐桌
export function getUserRooms(userId) {
  return db
    .prepare(
      `SELECT r.roomCode, r.createdAt, p.nickname, p.avatar,
        (SELECT COUNT(*) FROM participants p2 WHERE p2.roomCode = r.roomCode) AS participantCount,
        (SELECT COUNT(*) FROM submitted_orders s WHERE s.roomCode = r.roomCode) AS submittedCount
       FROM participants p JOIN rooms r ON r.roomCode = p.roomCode
       WHERE p.userId = ?
       ORDER BY r.createdAt DESC`
    )
    .all(userId)
}

// 某用户的历史订单
export function getUserOrders(userId) {
  const rows = db
    .prepare(
      `SELECT o.id, o.roomCode, o.orderNo, o.totalAmount, o.totalCount, o.createdAt
       FROM submitted_orders o WHERE o.userId = ? ORDER BY o.createdAt DESC`
    )
    .all(userId)
  const selI = db.prepare('SELECT dishId,dishName,price,quantity,remark FROM submitted_items WHERE orderId=?')
  return rows.map((o) => ({ roomCode: o.roomCode, orderNo: o.orderNo, totalAmount: o.totalAmount, totalCount: o.totalCount, createdAt: o.createdAt, items: selI.all(o.id) }))
}
