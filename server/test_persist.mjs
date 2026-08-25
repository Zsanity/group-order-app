import * as db from './db.js'
import * as store from './roomStore.js'

let pass = 0, fail = 0
function assert(name, cond) {
  if (cond) { pass++; console.log('PASS', name) }
  else { fail++; console.log('FAIL', name) }
}

// 造一个账号 + 房间 + 加菜 + 提交
const u = db.createUser({ username: 'persist_user', password: '1234', nickname: '持久化测试' })
assert('create user', !!u.userId)
const room = store.createRoom(u.userId, '持久化测试')
assert('create room', !!room.roomCode)
store.applyIntent(room.state, { type: 'cart:add', userId: u.userId, dishId: 'd1', dishName: '羊肉串', price: 50 }, u.userId)
store.applyIntent(room.state, { type: 'order:submit' }, u.userId)
assert('submitted 1 order', room.state.submitted.length === 1)

// 模拟服务器重启：从库回放
const loaded = db.loadAllRooms()
const found = loaded.find((r) => r.roomCode === room.roomCode)
assert('room reloaded from db', !!found)
assert('reloaded participants', found && found.participants.length === 1)
assert('reloaded submitted', found && found.submitted.length === 1)
assert('reloaded submitted item', found && found.submitted[0].items.length === 1 && found.submitted[0].items[0].dishName === '羊肉串')

// 我的餐桌
const myRooms = db.getUserRooms(u.userId)
assert('getUserRooms returns room', myRooms.some((r) => r.roomCode === room.roomCode))
assert('getUserRooms participantCount', myRooms.some((r) => r.roomCode === room.roomCode && r.participantCount === 1))

// 历史订单
const myOrders = db.getUserOrders(u.userId)
const order = myOrders.find((o) => o.roomCode === room.roomCode)
assert('getUserOrders returns order', !!order)
assert('order amount', order && order.totalAmount === 50)
assert('order items', order && order.items.length === 1)

console.log(`\nRESULT: ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
