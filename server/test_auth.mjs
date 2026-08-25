import * as db from './db.js'
import * as store from './roomStore.js'

let pass = 0, fail = 0
function assert(name, cond) {
  if (cond) { pass++; console.log('PASS', name) }
  else { fail++; console.log('FAIL', name) }
}

// --- auth ---
const created = db.createUser({ username: 'alice', password: '1234', nickname: '爱丽丝' })
assert('register returns userId', !!created.userId)
assert('register returns username', created.username === 'alice')

const dup = db.createUser({ username: 'alice', password: 'xxxx' })
assert('duplicate username rejected', dup.error === 'USERNAME_TAKEN')

const loginOk = db.loginUser({ username: 'alice', password: '1234' })
assert('login ok', loginOk.userId === created.userId)

const loginBad = db.loginUser({ username: 'alice', password: 'wrong' })
assert('bad password rejected', loginBad.error === 'BAD_PASSWORD')

const loginMissing = db.loginUser({ username: 'nobody', password: '1234' })
assert('unknown user rejected', loginMissing.error === 'USER_NOT_FOUND')

// --- room with account userId ---
const room = store.createRoom(created.userId, '爱丽丝')
assert('createRoom uses account id', room.userId === created.userId)
assert('participant id = account id', room.state.participants[0].id === created.userId)

// rejoin same account -> same identity, no duplicate
const rejoin = store.joinRoom(room.roomCode, created.userId, '爱丽丝')
assert('rejoin returns same userId', rejoin.userId === created.userId)
assert('rejoin no duplicate participant', room.state.participants.length === 1)

// another account joins
const bob = db.createUser({ username: 'bob', password: '1234' })
const joinBob = store.joinRoom(room.roomCode, bob.userId, '鲍勃')
assert('bob joins with account id', joinBob.userId === bob.userId)
assert('bob participant count 2', room.state.participants.length === 2)

// add dish + submit as alice, then bob unaffected
store.applyIntent(room.state, { type: 'cart:add', userId: created.userId, dishId: 'd1', dishName: '羊肉串', price: 50 }, created.userId)
store.applyIntent(room.state, { type: 'order:submit' }, created.userId)
assert('alice submitted', room.state.submitted.length === 1)
// bob still can add (not blocked by alice submission)
const bobAdd = store.applyIntent(room.state, { type: 'cart:add', userId: bob.userId, dishId: 'd2', dishName: '羊肉筋', price: 45 }, bob.userId)
assert('bob can add after alice submit', !bobAdd.error)

console.log(`\nRESULT: ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
