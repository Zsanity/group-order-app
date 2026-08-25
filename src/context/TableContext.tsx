import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { ITableState, IParticipant } from '@/types/table'

const ROOM_KEY = 'grouporder_roomcode'
const USER_KEY = 'grouporder_current_user_id'
const SESSION_KEY = 'grouporder_session'

interface Account {
  id: string
  username: string
  nickname: string
}

function loadAccountFromStorage(): Account | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const a = JSON.parse(raw)
    if (a && a.id && a.username) return a
    return null
  } catch {
    return null
  }
}

function saveAccount(acc: Account) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(acc))
  } catch {
    /* ignore */
  }
}

function loadCurrentUserFromStorage(): string | null {
  try {
    return localStorage.getItem(USER_KEY) || null
  } catch {
    return null
  }
}

function loadRoomFromStorage(): string | null {
  try {
    return localStorage.getItem(ROOM_KEY) || null
  } catch {
    return null
  }
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected'

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

interface TableContextValue {
  account: Account | null
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>
  register: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
  table: ITableState | null
  currentUserId: string | null
  currentUser: IParticipant | null
  connectionState: ConnectionState
  createTable: (nickname: string) => Promise<{ roomCode: string; userId: string }>
  joinTable: (
    roomCode: string,
    nickname: string
  ) => Promise<{ ok: boolean; message?: string }>
  addParticipant: (nickname: string) => Promise<string | null>
  setCurrentUser: (userId: string) => void
  addDish: (dishId: string, dishName: string, price: number) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateRemark: (itemId: string, remark: string) => void
  removeItem: (itemId: string) => void
  submitOrder: () => void
  cancelOrder: () => void
  leaveTable: () => void
  getUserTotal: (userId: string) => number
  getTotalAmount: () => number
  getTotalCount: () => number
  getDishTotalQuantity: (dishId: string) => number
}

const TableContext = createContext<TableContextValue | null>(null)

export function TableProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => loadAccountFromStorage())
  const [table, setTable] = useState<ITableState | null>(null)
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(() =>
    loadAccountFromStorage()?.id ?? loadCurrentUserFromStorage()
  )
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')

  const wsRef = useRef<WebSocket | null>(null)
  const genRef = useRef(0)
  const leavingRef = useRef(false)
  const tableRef = useRef<ITableState | null>(null)
  const currentUserIdRef = useRef<string | null>(currentUserId)
  const accountRef = useRef<Account | null>(account)
  const pendingAddsRef = useRef<Map<string, (id: string | null) => void>>(new Map())

  useEffect(() => {
    tableRef.current = table
  }, [table])

  useEffect(() => {
    accountRef.current = account
  }, [account])

  useEffect(() => {
    currentUserIdRef.current = currentUserId
    if (currentUserId) {
      try {
        localStorage.setItem(USER_KEY, currentUserId)
      } catch {
        /* ignore */
      }
    }
  }, [currentUserId])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.userId) {
      const acc: Account = {
        id: data.userId,
        username: data.username,
        nickname: data.nickname || data.username,
      }
      setAccount(acc)
      saveAccount(acc)
      setCurrentUserIdState(acc.id)
      return { ok: true }
    }
    return { ok: false, message: data.message || '登录失败，请稍后再试' }
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.userId) {
      const acc: Account = {
        id: data.userId,
        username: data.username,
        nickname: data.nickname || data.username,
      }
      setAccount(acc)
      saveAccount(acc)
      setCurrentUserIdState(acc.id)
      return { ok: true }
    }
    return { ok: false, message: data.message || '注册失败，请稍后再试' }
  }, [])

  const logout = useCallback(() => {
    leavingRef.current = true
    genRef.current += 1
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    }
    try {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(ROOM_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    pendingAddsRef.current.clear()
    setAccount(null)
    setTable(null)
    setCurrentUserIdState(null)
    setConnectionState('idle')
  }, [])

  const sendIntent = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }, [])

  const connect = useCallback((roomCode: string, userId: string) => {
    const gen = ++genRef.current
    leavingRef.current = false
    const ws = new WebSocket(`${wsUrl()}?room=${encodeURIComponent(roomCode)}&userId=${encodeURIComponent(userId)}`)
    wsRef.current = ws
    setConnectionState('connecting')

    ws.onmessage = (ev) => {
      if (gen !== genRef.current) return
      let msg: { type?: string; state?: ITableState; message?: string }
      try {
        msg = JSON.parse(ev.data as string)
      } catch {
        return
      }
      if (msg.type === 'state' && msg.state) {
        setTable(msg.state)
        // 解析待处理的 addParticipant
        const pending = pendingAddsRef.current
        if (pending.size > 0) {
          const known = new Set((tableRef.current?.participants || []).map((p) => p.id))
          for (const [name, resolve] of Array.from(pending.entries())) {
            const found = msg.state.participants.find(
              (p) => p.nickname === name && !known.has(p.id)
            )
            if (found) {
              pending.delete(name)
              resolve(found.id)
            }
          }
        }
        setConnectionState('connected')
      } else if (msg.type === 'error') {
        // 服务器返回错误，如无效房间
      }
    }

    ws.onclose = (ev) => {
      if (gen !== genRef.current) return
      const invalid = ev.code === 4003
      if (invalid) {
        try {
          localStorage.removeItem(ROOM_KEY)
          localStorage.removeItem(USER_KEY)
        } catch {
          /* ignore */
        }
        setCurrentUserIdState(null)
        setTable(null)
        setConnectionState('idle')
        return
      }
      setConnectionState('disconnected')
      const rc = loadRoomFromStorage()
      const uid = loadCurrentUserFromStorage()
      if (!leavingRef.current && rc && uid) {
        setTimeout(() => connect(rc, uid), 2000)
      }
    }

    ws.onerror = () => {
      /* onclose 统一处理 */
    }
  }, [])

  // 页面加载时自动重连
  useEffect(() => {
    const rc = loadRoomFromStorage()
    const uid = loadCurrentUserFromStorage()
    if (rc && uid) {
      connect(rc, uid)
    }
    return () => {
      leavingRef.current = true
      genRef.current += 1
    }
  }, [connect])

  const currentUser =
    table && currentUserId
      ? table.participants.find((p) => p.id === currentUserId) ?? null
      : null

  const createTable = useCallback(
    async (nickname: string) => {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, userId: accountRef.current?.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.roomCode && data.userId) {
        try {
          localStorage.setItem(ROOM_KEY, data.roomCode)
          localStorage.setItem(USER_KEY, data.userId)
        } catch {
          /* ignore */
        }
        setCurrentUserIdState(data.userId)
        connect(data.roomCode, data.userId)
        return { roomCode: data.roomCode, userId: data.userId }
      }
      throw new Error('创建餐桌失败')
    },
    [connect]
  )

  const joinTable = useCallback(
    async (roomCode: string, nickname: string) => {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, nickname, userId: accountRef.current?.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.userId) {
        try {
          localStorage.setItem(ROOM_KEY, roomCode)
          localStorage.setItem(USER_KEY, data.userId)
        } catch {
          /* ignore */
        }
        setCurrentUserIdState(data.userId)
        connect(roomCode, data.userId)
        return { ok: true }
      }
      let message = '加入失败，请稍后再试'
      if (data.error === 'ROOM_NOT_FOUND') message = '房间不存在或已失效'
      else if (data.error === 'NICKNAME_TAKEN') message = '昵称已被占用，请换一个'
      return { ok: false, message }
    },
    [connect]
  )

  const addParticipant = useCallback((nickname: string) => {
    return new Promise<string | null>((resolve) => {
      const cur = tableRef.current
      if (!cur) return resolve(null)
      if (cur.participants.some((p) => p.nickname === nickname)) return resolve(null)
      pendingAddsRef.current.set(nickname, resolve)
      sendIntent({ type: 'participant:add', nickname })
      setTimeout(() => {
        if (pendingAddsRef.current.has(nickname)) {
          pendingAddsRef.current.delete(nickname)
          resolve(null)
        }
      }, 5000)
    })
  }, [sendIntent])

  const setCurrentUser = useCallback((userId: string) => {
    setCurrentUserIdState(userId)
  }, [])

  const addDish = useCallback(
    (dishId: string, dishName: string, price: number) => {
      const cur = tableRef.current
      const uid = currentUserIdRef.current
      if (!cur || !uid) return
      // 仅当当前用户自己已提交订单时锁定其加菜；其他人不受影响
      if (cur.submitted.some((s) => s.userId === uid)) return
      sendIntent({ type: 'cart:add', userId: uid, dishId, dishName, price })
    },
    [sendIntent]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      sendIntent({ type: 'cart:updateQty', itemId, quantity })
    },
    [sendIntent]
  )

  const updateRemark = useCallback(
    (itemId: string, remark: string) => {
      sendIntent({ type: 'cart:updateRemark', itemId, remark })
    },
    [sendIntent]
  )

  const removeItem = useCallback(
    (itemId: string) => {
      sendIntent({ type: 'cart:remove', itemId })
    },
    [sendIntent]
  )

  const submitOrder = useCallback(() => {
    sendIntent({ type: 'order:submit' })
  }, [sendIntent])

  const cancelOrder = useCallback(() => {
    sendIntent({ type: 'order:cancel' })
  }, [sendIntent])

  const leaveTable = useCallback(() => {
    leavingRef.current = true
    genRef.current += 1
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    }
    try {
      localStorage.removeItem(ROOM_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    pendingAddsRef.current.clear()
    setTable(null)
    setCurrentUserIdState(null)
    setConnectionState('idle')
  }, [])

  const getUserTotal = useCallback(
    (userId: string): number => {
      if (!table) return 0
      return table.cartItems
        .filter((item) => item.userId === userId)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    [table]
  )

  const getTotalAmount = useCallback((): number => {
    if (!table) return 0
    return table.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [table])

  const getTotalCount = useCallback((): number => {
    if (!table) return 0
    return table.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [table])

  const getDishTotalQuantity = useCallback(
    (dishId: string): number => {
      if (!table) return 0
      return table.cartItems
        .filter((i) => i.dishId === dishId)
        .reduce((sum, item) => sum + item.quantity, 0)
    },
    [table]
  )

  const value: TableContextValue = {
    account,
    login,
    register,
    logout,
    table,
    currentUserId,
    currentUser,
    connectionState,
    createTable,
    joinTable,
    addParticipant,
    setCurrentUser,
    addDish,
    updateQuantity,
    updateRemark,
    removeItem,
    submitOrder,
    cancelOrder,
    leaveTable,
    getUserTotal,
    getTotalAmount,
    getTotalCount,
    getDishTotalQuantity,
  }

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  const ctx = useContext(TableContext)
  if (!ctx) throw new Error('useTable must be used within TableProvider')
  return ctx
}
