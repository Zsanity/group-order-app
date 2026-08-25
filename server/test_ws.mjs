// 后端 WebSocket 冒烟测试（按用户独立提交）：
// A提交订单后，B 仍可继续加菜并提交自己的购物车，互不影响。
import WebSocket from 'ws'

const BASE = 'http://127.0.0.1:3001'
const WS = 'ws://127.0.0.1:3001/ws'

function httpPost(path, body) {
  return fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())
}

function connectWs(roomCode, userId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS}?room=${roomCode}&userId=${userId}`)
    const states = []
    ws.on('open', () => resolve({ ws, states }))
    ws.on('error', reject)
    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString())
      if (msg.type === 'state') states.push(msg.state)
    })
  })
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }
function last(arr) { return arr[arr.length - 1] }
function assert(cond, label) { console.log(cond ? label + '_PASS' : label + '_FAIL'); return cond }

// 创建房间（小明） + 小红加入
const created = await httpPost('/api/rooms', { nickname: '小明' })
const roomCode = created.roomCode
const xiaoming = created.userId
const joined = await httpPost('/api/rooms/join', { roomCode, nickname: '小红' })
const xiaohong = joined.userId
console.log('room', roomCode, 'xiaoming=', xiaoming, 'xiaohong=', xiaohong)

const A = await connectWs(roomCode, xiaoming)
const B = await connectWs(roomCode, xiaohong)
console.log('both connected')

// 小明加菜 宫保鸡丁38
A.ws.send(JSON.stringify({ type: 'cart:add', userId: xiaoming, dishId: 'd1', dishName: '宫保鸡丁', price: 38 }))
await wait(500)
let st = last(B.states)
assert(st.cartItems.length === 1 && st.cartItems[0].dishName === '宫保鸡丁', 'SYNC_ADD')
console.log('  B sees:', st.cartItems.map((i) => i.dishName + '@' + i.userId.slice(-4)).join(','))

// 小红加菜 麻婆豆腐28
B.ws.send(JSON.stringify({ type: 'cart:add', userId: xiaohong, dishId: 'd2', dishName: '麻婆豆腐', price: 28 }))
await wait(500)
st = last(A.states)
assert(st.cartItems.length === 2, 'CONCURRENT_ADD')
console.log('  A sees 2 items:', st.cartItems.map((i) => i.dishName).join(','))

// 小明提交订单
A.ws.send(JSON.stringify({ type: 'order:submit' }))
await wait(500)
st = last(A.states)
const xiaomingOrder = st.submitted.find((s) => s.userId === xiaoming)
assert(xiaomingOrder && xiaomingOrder.totalAmount === 38, 'A_SUBMIT')
console.log('  A submitted totalAmount:', xiaomingOrder && xiaomingOrder.totalAmount)
console.log('  A active cartItems now:', st.cartItems.map((i) => i.dishName).join(',') || '(empty)')

// 关键：小红不受影响，仍能继续加菜
B.ws.send(JSON.stringify({ type: 'cart:add', userId: xiaohong, dishId: 'd3', dishName: '红烧肉', price: 58 }))
await wait(500)
st = last(B.states)
const hongShao = st.cartItems.find((i) => i.dishId === 'd3' && i.userId === xiaohong)
assert(!!hongShao, 'B_STILL_ADD_AFTER_A_SUBMIT')
console.log('  B still can add after A submitted, B cartItems:', st.cartItems.map((i) => i.dishName).join(','))

// 小红提交自己的订单
B.ws.send(JSON.stringify({ type: 'order:submit' }))
await wait(500)
st = last(B.states)
const xiaohongOrder = st.submitted.find((s) => s.userId === xiaohong)
assert(xiaohongOrder && xiaohongOrder.totalAmount === 86, 'B_SUBMIT')
console.log('  B submitted totalAmount:', xiaohongOrder && xiaohongOrder.totalAmount)

// 两人都已提交，room.submitted 有 2 条
assert(st.submitted.length === 2, 'TWO_ORDERS')
console.log('  room submitted orders:', st.submitted.map((o) => o.userId.slice(-4) + '=' + o.totalAmount).join(', '))

// 小红已提交后自己不能再加菜
B.ws.send(JSON.stringify({ type: 'cart:add', userId: xiaohong, dishId: 'd9', dishName: '可乐', price: 8 }))
await wait(500)
const stillNoExtra = !last(B.states).cartItems.some((i) => i.dishId === 'd9')
assert(stillNoExtra, 'B_LOCKED_AFTER_OWN_SUBMIT')

process.exit(0)
