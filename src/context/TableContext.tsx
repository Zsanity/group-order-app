import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { ITableState, IParticipant, ICartItem, IOrder } from '@/types/table'

const STORAGE_KEY_TABLE = 'grouporder_table'
const STORAGE_KEY_CURRENT_USER = 'grouporder_current_user_id'

const AVATAR_POOL = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒', '🍍', '🥑', '🍉', '🥭']

function genId(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10)
}

function genRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function pickAvatar(used: string[]): string {
  const remain = AVATAR_POOL.filter((a) => !used.includes(a))
  const pool = remain.length > 0 ? remain : AVATAR_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

function loadTableFromStorage(): ITableState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TABLE)
    return raw ? (JSON.parse(raw) as ITableState) : null
  } catch (e) {
    console.error('Failed to parse table state:', String(e))
    return null
  }
}

function loadCurrentUserFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CURRENT_USER) || null
  } catch (e) {
    console.error('Failed to read current user:', String(e))
    return null
  }
}

interface TableContextValue {
  table: ITableState | null
  currentUserId: string | null
  currentUser: IParticipant | null
  createTable: (nickname: string) => { roomCode: string; userId: string }
  joinTable: (roomCode: string, nickname: string) => boolean
  addParticipant: (nickname: string) => string | null
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
  const [table, setTable] = useState<ITableState | null>(() => loadTableFromStorage())
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(() =>
    loadCurrentUserFromStorage()
  )

  useEffect(() => {
    if (table) {
      localStorage.setItem(STORAGE_KEY_TABLE, JSON.stringify(table))
    }
  }, [table])

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserId)
    }
  }, [currentUserId])

  const currentUser = table && currentUserId
    ? table.participants.find((p) => p.id === currentUserId) ?? null
    : null

  const createTable = useCallback(
    (nickname: string) => {
      const roomCode = genRoomCode()
      const userId = genId('u_')
      const newTable: ITableState = {
        roomCode,
        participants: [
          {
            id: userId,
            nickname,
            avatar: AVATAR_POOL[0],
            joinedAt: Date.now(),
          },
        ],
        cartItems: [],
        status: 'ordering',
        createdAt: Date.now(),
      }
      setTable(newTable)
      setCurrentUserIdState(userId)
      return { roomCode, userId }
    },
    []
  )

  const joinTable = useCallback(
    (roomCode: string, nickname: string): boolean => {
      if (!table) {
        console.warn('No table exists to join')
        return false
      }
      if (table.roomCode !== roomCode) {
        console.warn('Room code mismatch')
        return false
      }
      const usedAvatars = table.participants.map((p) => p.avatar)
      const newParticipant: IParticipant = {
        id: genId('u_'),
        nickname,
        avatar: pickAvatar(usedAvatars),
        joinedAt: Date.now(),
      }
      setTable({
        ...table,
        participants: [...table.participants, newParticipant],
      })
      setCurrentUserIdState(newParticipant.id)
      return true
    },
    [table]
  )

  const addParticipant = useCallback(
    (nickname: string): string | null => {
      if (!table) return null
      if (table.participants.some((p) => p.nickname === nickname)) {
        return null
      }
      const usedAvatars = table.participants.map((p) => p.avatar)
      const newParticipant: IParticipant = {
        id: genId('u_'),
        nickname,
        avatar: pickAvatar(usedAvatars),
        joinedAt: Date.now(),
      }
      setTable({
        ...table,
        participants: [...table.participants, newParticipant],
      })
      return newParticipant.id
    },
    [table]
  )

  const setCurrentUser = useCallback((userId: string) => {
    setCurrentUserIdState(userId)
  }, [])

  const addDish = useCallback(
    (dishId: string, dishName: string, price: number) => {
      if (!table || !currentUserId) return
      if (table.status !== 'ordering') return

      const existingIdx = table.cartItems.findIndex(
        (item) => item.dishId === dishId && item.userId === currentUserId
      )
      if (existingIdx >= 0) {
        const updated = [...table.cartItems]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        }
        setTable({ ...table, cartItems: updated })
      } else {
        const newItem: ICartItem = {
          id: genId('ci_'),
          dishId,
          dishName,
          price,
          quantity: 1,
          userId: currentUserId,
          addedAt: Date.now(),
        }
        setTable({ ...table, cartItems: [...table.cartItems, newItem] })
      }
    },
    [table, currentUserId]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (!table) return
      if (quantity <= 0) {
        setTable({
          ...table,
          cartItems: table.cartItems.filter((i) => i.id !== itemId),
        })
      } else {
        setTable({
          ...table,
          cartItems: table.cartItems.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        })
      }
    },
    [table]
  )

  const removeItem = useCallback(
    (itemId: string) => {
      if (!table) return
      setTable({
        ...table,
        cartItems: table.cartItems.filter((i) => i.id !== itemId),
      })
    },
    [table]
  )

  const updateRemark = useCallback(
    (itemId: string, remark: string) => {
      if (!table) return
      setTable({
        ...table,
        cartItems: table.cartItems.map((i) =>
          i.id === itemId ? { ...i, remark } : i
        ),
      })
    },
    [table]
  )

  const submitOrder = useCallback(() => {
    if (!table || table.cartItems.length === 0) return
    const totalAmount = table.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const totalCount = table.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const order: IOrder = {
      orderNo: 'NO' + Date.now().toString().slice(-8),
      createdAt: Date.now(),
      totalAmount,
      totalCount,
      items: table.cartItems.map((i) => ({ ...i })),
    }
    setTable({
      ...table,
      status: 'ordered',
      order,
    })
  }, [table])

  const cancelOrder = useCallback(() => {
    if (!table || table.status !== 'ordered') return
    setTable({
      ...table,
      status: 'ordering',
      order: undefined,
    })
  }, [table])

  const leaveTable = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TABLE)
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
    setTable(null)
    setCurrentUserIdState(null)
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
    table,
    currentUserId,
    currentUser,
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
