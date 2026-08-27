import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Users, Receipt, CreditCard, UserCheck, SplitSquareVertical, RotateCcw, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTable } from '@/context/TableContext';
import { getDishUnit } from '@/data/menu';

interface MergedItem {
  dishId: string;
  dishName: string;
  price: number;
  quantity: number;
  amount: number;
  users: string[];
  perUser: { nickname: string; quantity: number }[];
}

interface UserItemDetail {
  avatar: string;
  nickname: string;
  items: { dishId: string; dishName: string; price: number; quantity: number }[];
}

export default function BillPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { table, account, cancelOrder, removeOrder } = useTable();

  const [splitMode, setSplitMode] = useState<'aa' | 'perPerson'>('perPerson');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [dishDetail, setDishDetail] = useState<MergedItem | null>(null);
  const [userDetail, setUserDetail] = useState<UserItemDetail | null>(null);

  const participantCount = table?.participants.length ?? 0;
  const orders = table?.submitted ?? [];
  // 创建者权限：以创建餐桌的账号为准
  const isCreator = !!(table && account && table.creatorId === account.id);

  const handleRemoveOrder = (p: { id: string; nickname: string }) => {
    if (window.confirm(`确定要移除「${p.nickname}」的订单吗？`)) {
      removeOrder(p.id);
      toast.success(`已移除 ${p.nickname} 的订单`);
    }
  };

  const order = useMemo(() => {
    if (orders.length === 0) return null;
    const items = orders.flatMap((o) => o.items);
    return {
      totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
      totalCount: orders.reduce((s, o) => s + o.totalCount, 0),
      items,
      createdAt: Math.max(...orders.map((o) => o.createdAt)),
    };
  }, [orders]);

  const aaAmount = useMemo(() => {
    if (!order || participantCount === 0) return 0;
    return order.totalAmount / participantCount;
  }, [order, participantCount]);

  const perPersonAmounts = useMemo(() => {
    if (!table) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    table.participants.forEach((p) => {
      result[p.id] = orders
        .flatMap((o) => o.items)
        .filter((i) => i.userId === p.id)
        .reduce((s, i) => s + i.price * i.quantity, 0);
    });
    return result;
  }, [table, orders]);

  const perPersonCounts = useMemo(() => {
    if (!table) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    table.participants.forEach((p) => {
      result[p.id] = orders
        .flatMap((o) => o.items)
        .filter((i) => i.userId === p.id)
        .reduce((s, i) => s + i.quantity, 0);
    });
    return result;
  }, [table, orders]);

  // 合并同一菜品：多个用户点了同一份菜时，数量相加、记录每位用户的数量
  const mergedItems = useMemo(() => {
    if (!table || !order) return [] as MergedItem[];
    const map = new Map<string, { dishId: string; dishName: string; price: number; quantity: number; perUser: Record<string, number> }>();
    for (const item of order.items) {
      const user = table.participants.find((p) => p.id === item.userId);
      const tag = user ? `${user.nickname}` : '';
      const entry = map.get(item.dishId);
      if (entry) {
        entry.quantity += item.quantity;
        if (tag) entry.perUser[tag] = (entry.perUser[tag] || 0) + item.quantity;
      } else {
        map.set(item.dishId, {
          dishId: item.dishId,
          dishName: item.dishName,
          price: item.price,
          quantity: item.quantity,
          perUser: tag ? { [tag]: item.quantity } : {},
        });
      }
    }
    return [...map.values()].map((m) => ({
      dishId: m.dishId,
      dishName: m.dishName,
      price: m.price,
      quantity: m.quantity,
      amount: m.price * m.quantity,
      users: Object.keys(m.perUser),
      perUser: Object.entries(m.perUser).map(([nickname, quantity]) => ({ nickname, quantity })),
    }));
  }, [order, table]);

  // 获取某位用户点单的明细
  const getUserItemDetail = (userId: string): UserItemDetail | null => {
    const p = table?.participants.find((x) => x.id === userId);
    if (!p) return null;
    const items = orders.flatMap((o) => o.items).filter((i) => i.userId === userId);
    const merged = new Map<string, { dishId: string; dishName: string; price: number; quantity: number }>();
    for (const it of items) {
      const e = merged.get(it.dishId);
      if (e) e.quantity += it.quantity;
      else merged.set(it.dishId, { dishId: it.dishId, dishName: it.dishName, price: it.price, quantity: it.quantity });
    }
    return { avatar: p.avatar, nickname: p.nickname, items: [...merged.values()] };
  };

  const handleExport = () => {
    if (!mergedItems.length) return;
    const header = '菜品,单价(元),数量,金额(元),点餐人';
    const rows = mergedItems.map((m) =>
      [m.dishName, m.price, m.quantity, m.amount.toFixed(2), m.users.join('、')].join(',')
    );
    const csv = '\ufeff' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `账单清单_${roomCode ?? 'room'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!table || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🤔</div>
        <p className="text-foreground font-medium mb-2">还没有订单哦</p>
        <p className="text-muted-foreground text-sm mb-6">去点餐页下单后再来查看账单吧</p>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate(`/order/${roomCode}`)}
            aria-label="返回"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <div className="font-semibold text-foreground">账单详情</div>
            <div className="text-xs text-muted-foreground">共 {orders.length} 人已提交订单</div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="size-3" />
            {participantCount} 人
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 订单总览卡 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 text-[120px] opacity-10">🍽️</div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-2">
                <Receipt className="size-4" />
                订单总金额
              </div>
              <div className="text-4xl font-black tabular-nums mb-4">
                ¥{order.totalAmount.toFixed(2)}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
                <div>
                  <span className="opacity-70">菜品：</span>
                  <span className="font-medium">{order.totalCount} 串</span>
                </div>
                <div>
                  <span className="opacity-70">时间：</span>
                  <span className="font-medium">{formatTime(order.createdAt)}</span>
                </div>
                <div>
                  <span className="opacity-70">人数：</span>
                  <span className="font-medium">{participantCount} 人</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 账单拆分 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <SplitSquareVertical className="size-5 text-primary" />
            <h2 className="text-lg font-bold">拆分账单</h2>
          </div>

          <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as 'aa' | 'perPerson')}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="perPerson" className="gap-1.5">
                <UserCheck className="size-4" />
                按人结算
              </TabsTrigger>
              <TabsTrigger value="aa" className="gap-1.5">
                <CreditCard className="size-4" />
                AA 制
              </TabsTrigger>
            </TabsList>

            {/* 按人结算 */}
            <TabsContent value="perPerson" className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="perPerson"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {table.participants.map((p, i) => {
                    const amount = perPersonAmounts[p.id];
                    const count = perPersonCounts[p.id];
                    const submitted = orders.some((o) => o.userId === p.id);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + i * 0.06,
                          ease: 'easeOut',
                        }}
                      >
                        <Card>
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                              {p.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{p.nickname}</div>
                              <div className="text-xs text-muted-foreground">
                                {submitted ? `点了 ${count} 串` : '还没提交'}
                              </div>
                            </div>
                            {isCreator && submitted && p.id !== table.creatorId && (
                              <button
                                className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0"
                                onClick={() => handleRemoveOrder(p)}
                                aria-label={`移除 ${p.nickname} 的订单`}
                                title="移除该参与者的订单"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                            <button
                              className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center shrink-0"
                              onClick={() => setUserDetail(getUserItemDetail(p.id))}
                              aria-label={`查看 ${p.nickname} 的点菜详情`}
                              title="查看该用户的点菜明细"
                            >
                              <Eye className="size-4" />
                            </button>
                            <div className="text-right">
                              {submitted ? (
                                <>
                                  <div className="text-xl font-black text-primary tabular-nums">
                                    ¥{amount.toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">应付金额</div>
                                </>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] h-5 px-2">
                                  未提交
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* AA 制 */}
            <TabsContent value="aa" className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key="aa"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {table.participants.map((p, i) => {
                    const submitted = orders.some((o) => o.userId === p.id);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + i * 0.06,
                          ease: 'easeOut',
                        }}
                      >
                        <Card>
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                              {p.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{p.nickname}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                人均 AA
                                {submitted ? (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                    已提交
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                                    未提交
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-primary tabular-nums">
                                ¥{aaAmount.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">每人应付</div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    总金额 ¥{order.totalAmount.toFixed(2)} ÷ {participantCount} 人 = ¥{aaAmount.toFixed(2)}/人
                  </p>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* 菜品清单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="size-5 text-primary" />
            <h2 className="text-lg font-bold">菜品清单</h2>
            <span className="text-xs text-muted-foreground">({order.totalCount} 串)</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1"
              onClick={handleExport}
            >
              <Download className="size-4" />
              导出清单
            </Button>
          </div>
          <Card>
            <CardContent className="p-4 space-y-2">
              {mergedItems.map((merged) => (
                <div key={merged.dishName} className="flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{merged.dishName}</div>
                    <div className="text-xs text-muted-foreground">
                      ¥{merged.price} × {merged.quantity}
                      {getDishUnit(merged.dishId)}
                      {merged.users.length > 0 && (
                        <span className="ml-2">
                          ({merged.users.join('、')})
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1 h-7 px-2"
                    onClick={() => setDishDetail(merged)}
                    aria-label={`查看 ${merged.dishName} 详情`}
                  >
                    <Eye className="size-3.5" />
                    查看详情
                  </Button>
                  <span className="font-semibold tabular-nums shrink-0">
                    ¥{merged.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 操作按钮组 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-2 pb-4 space-y-3"
        >
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => setCancelOpen(true)}>
                <RotateCcw className="size-4 mr-2" />
                取消订单，重新点菜
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要取消订单吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  取消后你的订单将被撤销，已点的菜品会退回购物车，你可以继续加菜或修改；不影响其他已提交订单的人。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>再想想</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => {
                    cancelOrder();
                    setCancelOpen(false);
                    if (roomCode) navigate(`/order/${roomCode}`);
                  }}
                >
                  确认取消
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate(`/order/${roomCode}`)}
          >
            返回点餐页
          </Button>
        </motion.div>

        {/* 菜品详情弹窗：每道菜各用户点了几份 */}
        <Dialog open={!!dishDetail} onOpenChange={(v) => !v && setDishDetail(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                {dishDetail?.dishName}
              </DialogTitle>
              {dishDetail && (
                <DialogDescription>
                  共点 {dishDetail.quantity} {getDishUnit(dishDetail.dishId)} · ¥{dishDetail.amount.toFixed(2)}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-2">
              {dishDetail && dishDetail.perUser.length > 0 ? (
                dishDetail.perUser.map((u) => (
                  <div
                    key={u.nickname}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="font-medium">{u.nickname}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {u.quantity} {getDishUnit(dishDetail.dishId)} · ¥{(u.quantity * dishDetail.price).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">暂无点餐记录</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 用户点单详情弹窗：某用户点的所有菜品及数量 */}
        <Dialog open={!!userDetail} onOpenChange={(v) => !v && setUserDetail(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{userDetail?.avatar}</span>
                {userDetail?.nickname} 的点菜明细
              </DialogTitle>
              {userDetail && userDetail.items.length > 0 && (
                <DialogDescription>
                  共 {userDetail.items.reduce((s, i) => s + i.quantity, 0)} 串
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-2">
              {userDetail && userDetail.items.length > 0 ? (
                userDetail.items.map((it) => (
                  <div
                    key={it.dishName}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="font-medium">{it.dishName}</span>
                    <div className="text-right">
                      <div className="tabular-nums font-semibold text-primary">
                        ¥{(it.price * it.quantity).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ¥{it.price} × {it.quantity} {getDishUnit(it.dishId)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  该用户尚未提交订单
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
