import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, PlusCircle, LogIn, ArrowRight, LogOut, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTable } from '@/context/TableContext';

interface MyRoom {
  roomCode: string;
  createdAt: number;
  nickname: string;
  avatar: string;
  participantCount: number;
  submittedCount: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { table, createTable, joinTable, currentUser, account, logout } = useTable();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [myRooms, setMyRooms] = useState<MyRoom[]>([]);

  const validNickname = nickname.trim().length >= 2 && nickname.trim().length <= 8;

  useEffect(() => {
    let alive = true;
    if (!account?.id) {
      setMyRooms([]);
      return;
    }
    fetch(`/api/users/${account.id}/rooms`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setMyRooms(d.rooms || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [account?.id]);

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    navigate('/login', { replace: true });
  };

  const handleEnterRoom = async (room: MyRoom) => {
    setLoading(true);
    const res = await joinTable(room.roomCode, room.nickname);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message || '进入失败');
      return;
    }
    toast.success(`已进入 ${room.roomCode} 号桌`);
    navigate(`/order/${room.roomCode}`);
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleCreate = async () => {
    if (!validNickname) return;
    setLoading(true);
    try {
      const { roomCode } = await createTable(nickname.trim());
      setCreateOpen(false);
      setNickname('');
      toast.success('餐桌创建成功');
      navigate(`/order/${roomCode}`);
    } catch {
      toast.error('创建失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!validNickname) return;
    if (roomCodeInput.length !== 4) {
      toast.error('请输入4位房间码');
      return;
    }
    setLoading(true);
    const res = await joinTable(roomCodeInput, nickname.trim());
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message || '加入失败');
      return;
    }
    toast.success(`加入成功！你是 ${nickname.trim()}`);
    setJoinOpen(false);
    setNickname('');
    setRoomCodeInput('');
    navigate(`/order/${roomCodeInput}`);
  };

  const handleContinue = () => {
    if (table) {
      navigate(`/order/${table.roomCode}`);
    }
  };

  const totalCount = table ? table.cartItems.reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <main className="max-w-md mx-auto px-4 pt-16 pb-12">
        {/* 当前登录用户 + 退出 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold">
              {account?.nickname?.[0] || account?.username?.[0] || '?'}
            </span>
            <span className="text-muted-foreground">
              已登录：<span className="font-medium text-foreground">{account?.username || ''}</span>
            </span>
          </div>
          <button
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
            退出
          </button>
        </div>

        {/* Logo / 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Utensils className="size-8" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">多人点餐</h1>
          <p className="text-muted-foreground">一起吃饭，各自点单，轻松结账</p>
        </motion.div>

        {/* 继续上次点餐 */}
        <AnimatePresence>
          {table && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <Card
                className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={handleContinue}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold tracking-wider">
                    {table.roomCode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">上次有点餐进行中</div>
                    <div className="text-xs text-muted-foreground">
                      {currentUser?.nickname || '未登录'} · {table.participants.length} 人 · {totalCount} 份菜
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-primary shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 我的餐桌 */}
        {myRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-5"
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
              <History className="size-4 text-primary" />
              我的餐桌
              <span className="text-xs font-normal text-muted-foreground">({myRooms.length})</span>
            </div>
            <div className="space-y-2">
              {myRooms.map((room) => (
                <Card
                  key={room.roomCode}
                  className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                  onClick={() => handleEnterRoom(room)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-secondary/60 flex items-center justify-center text-sm font-bold tracking-wider text-foreground">
                      {room.roomCode}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {room.nickname} · {room.participantCount} 人
                        {room.submittedCount > 0 && (
                          <span className="ml-1.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            已提交 {room.submittedCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        创建于 {fmtTime(room.createdAt)}
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-primary shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* 两个操作卡片 */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => {
                setNickname(account?.nickname || account?.username || '');
                setCreateOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <PlusCircle className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">创建餐桌</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      开一个新局，生成房间码
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => {
                setNickname(account?.nickname || account?.username || '');
                setRoomCodeInput('');
                setJoinOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-secondary/60 text-secondary-foreground flex items-center justify-center">
                    <LogIn className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">加入餐桌</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      输入 4 位房间码加入朋友的局
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* 底部小提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12 text-xs text-muted-foreground"
        >
          <p>🍜 多人聚餐，各自点单更自在</p>
        </motion.div>
      </main>

      {/* 创建餐桌弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>创建餐桌</DialogTitle>
            <DialogDescription>输入你的昵称，创建后会生成房间码</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              你的昵称 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="2-8 个字"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 8))}
              maxLength={8}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              {nickname.length > 0
                ? validNickname
                  ? '✓ 昵称可用'
                  : '昵称需要 2-8 个字'
                : '给自己取个名字吧'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!validNickname || loading}>
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 加入餐桌弹窗 */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>加入餐桌</DialogTitle>
            <DialogDescription>输入房间码和你的昵称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                房间码 <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="请输入 4 位房间码"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                autoFocus
                className="text-center tracking-[0.5em] font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                你的昵称 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="2-8 个字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 8))}
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setJoinOpen(false)}>
              取消
            </Button>
            <Button onClick={handleJoin} disabled={!validNickname || roomCodeInput.length !== 4 || loading}>
              {loading ? '加入中...' : '加入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
