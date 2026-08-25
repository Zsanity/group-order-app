// 多人点餐助手 - 后端服务器
// HTTP (Express) 负责 创建/加入/查询房间；WebSocket 负责实时同步与操作意图。
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import * as store from './roomStore.js'
import * as dbStore from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()
app.use(express.json({ limit: '1mb' }))

const server = http.createServer(app)

// ---- HTTP API ----
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

// ---- 账号认证（身份持久化到 SQLite）----
// 注册：创建新账号，返回稳定 userId
app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body || {}
  const r = dbStore.createUser({ username, password, nickname })
  if (r.error === 'USERNAME_TAKEN') return res.status(409).json({ error: 'USERNAME_TAKEN', message: '用户名已被注册' })
  if (r.error) return res.status(400).json({ error: r.error, message: '注册失败，用户名需 2-20 个字符' })
  res.json({ userId: r.userId, username: r.username, nickname: r.nickname })
})

// 登录：校验用户名密码，返回稳定 userId
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const r = dbStore.loginUser({ username, password })
  if (r.error === 'USER_NOT_FOUND') return res.status(404).json({ error: 'USER_NOT_FOUND', message: '用户不存在，请先注册' })
  if (r.error === 'BAD_PASSWORD') return res.status(401).json({ error: 'BAD_PASSWORD', message: '密码错误' })
  if (r.error) return res.status(400).json({ error: r.error })
  res.json({ userId: r.userId, username: r.username, nickname: r.nickname })
})

// 创建房间
app.post('/api/rooms', (req, res) => {
  const nickname = (req.body && req.body.nickname) || ''
  const userId = (req.body && req.body.userId) || ''
  const r = store.createRoom(userId, nickname)
  res.json(r)
})

// 加入房间
app.post('/api/rooms/join', (req, res) => {
  const { roomCode, nickname, userId } = req.body || {}
  const r = store.joinRoom(String(roomCode || '').trim(), userId || '', nickname || '')
  if (r.error === 'ROOM_NOT_FOUND') return res.status(404).json({ error: 'ROOM_NOT_FOUND', message: '房间不存在或已失效' })
  if (r.error === 'NICKNAME_TAKEN') return res.status(409).json({ error: 'NICKNAME_TAKEN', message: '昵称已被占用' })
  res.json(r)
})

// 查询房间状态（重连 / 初始加载）
app.get('/api/rooms/:roomCode', (req, res) => {
  const room = store.getRoom(String(req.params.roomCode).trim())
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' })
  res.json({ roomCode: room.roomCode, state: room })
})

// 用户参与过的餐桌（“我的餐桌”）
app.get('/api/users/:userId/rooms', (req, res) => {
  const rooms = dbStore.getUserRooms(String(req.params.userId))
  res.json({ rooms })
})

// 用户的历史订单
app.get('/api/users/:userId/orders', (req, res) => {
  const orders = dbStore.getUserOrders(String(req.params.userId))
  res.json({ orders })
})

// ---- WebSocket ----
const wss = new WebSocketServer({ server, path: '/ws' })

// roomCode -> Map<participantId, Set<ws>>
const roomClients = new Map()

function broadcast(roomCode, message) {
  const clients = roomClients.get(roomCode)
  if (!clients) return
  const data = JSON.stringify(message)
  for (const set of clients.values()) {
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    }
  }
}

function addClient(roomCode, participantId, ws) {
  if (!roomClients.has(roomCode)) roomClients.set(roomCode, new Map())
  const userMap = roomClients.get(roomCode)
  if (!userMap.has(participantId)) userMap.set(participantId, new Set())
  userMap.get(participantId).add(ws)
}

function removeClient(roomCode, participantId, ws) {
  const userMap = roomClients.get(roomCode)
  if (!userMap) return
  const set = userMap.get(participantId)
  if (set) {
    set.delete(ws)
    if (set.size === 0) userMap.delete(participantId)
  }
  if (userMap.size === 0) roomClients.delete(roomCode)
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost')
  const roomCode = url.searchParams.get('room') || ''
  const userId = url.searchParams.get('userId') || ''
  const room = store.getRoom(roomCode)

  if (!room || !room.participants.some((p) => p.id === userId)) {
    ws.send(JSON.stringify({ type: 'error', message: '无效的房间或用户' }))
    ws.close(4003, 'invalid room/user')
    return
  }

  addClient(roomCode, userId, ws)
  ws.send(JSON.stringify({ type: 'welcome', selfId: userId }))
  ws.send(JSON.stringify({ type: 'state', state: room }))

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }))
      return
    }
    const r = store.applyIntent(room, msg, userId)
    if (r.error) {
      ws.send(JSON.stringify({ type: 'error', message: r.error }))
      return
    }
    broadcast(roomCode, { type: 'state', state: r.state })
  })

  ws.on('close', () => {
    removeClient(roomCode, userId, ws)
  })
})

// 服务前端静态文件（生产构建产物）
const distDir = path.join(__dirname, '..', 'dist')
app.use(express.static(distDir))
// SPA 路由回退
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next()
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found')
  })
})

server.listen(PORT, () => {
  console.log(`[group-order-server] listening on :${PORT}`)
})
