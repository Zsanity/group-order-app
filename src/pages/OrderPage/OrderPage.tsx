import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Users, ChevronLeft, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import DishCard from '@/components/DishCard';
import CartPanel from '@/components/CartPanel';
import ParticipantPanel from '@/components/ParticipantPanel';
import SubmitConfirmDialog from '@/components/SubmitConfirmDialog';
import { useTable } from '@/context/TableContext';
import { getMinPortionCount, MOCK_CATEGORIES, MOCK_DISHES, MENU_NOTE } from '@/data/menu';

export default function OrderPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const {
    table,
    currentUserId,
    currentUser,
    connectionState,
    addDish,
    updateQuantity,
    addParticipant,
    submitOrder,
    getUserTotal,
    getMyCount,
    getDishTotalQuantity,
  } = useTable();

  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0].key);
  const [cartOpen, setCartOpen] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const myOrder = table?.submitted.find((s) => s.userId === currentUserId);
  const mySubmitted = !!myOrder;

  useEffect(() => {
    if (table === null && connectionState !== 'connecting') {
      navigate('/', { replace: true });
    }
  }, [table, connectionState, navigate]);

  const dishQuantities = useMemo(() => {
    if (!table || !currentUserId) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    table.cartItems.forEach((item) => {
      if (item.userId === currentUserId) {
        result[item.dishId] = (result[item.dishId] || 0) + item.quantity;
      }
    });
    return result;
  }, [table, currentUserId]);

  const totalCount = getMyCount();
  const totalAmount = currentUserId ? getUserTotal(currentUserId) : 0;

  const handleAddUser = async () => {
    const name = newNickname.trim();
    if (name.length < 2 || name.length > 8) {
      toast.error('昵称需要 2-8 个字');
      return;
    }
    if (!table) return;
    if (table.participants.some((p) => p.nickname === name)) {
      toast.error('昵称已被使用');
      return;
    }
    const id = await addParticipant(name);
    if (id) {
      toast.success(`${name} 已加入`);
      setAddUserOpen(false);
      setNewNickname('');
    } else {
      toast.error('添加失败');
    }
  };

  const handleSubmit = () => {
    submitOrder();
    setConfirmOpen(false);
    setCartOpen(false);
    toast.success('订单已提交！');
    if (roomCode) {
      navigate(`/bill/${roomCode}`);
    }
  };

  const handleViewBill = () => {
    if (roomCode) {
      navigate(`/bill/${roomCode}`);
    }
  };

  if (!table) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/')}
            aria-label="返回"
          >
            <ChevronLeft className="size-5" />
          </Button>

          {/* 房间码 + 状态 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">房间码</span>
              <span className="font-bold text-primary tracking-wider">{table.roomCode}</span>
              <div className="flex items-center gap-1.5">
                {mySubmitted && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    已下单
                  </Badge>
                )}
                <button
                  className="text-[11px] text-primary hover:text-primary/80 font-medium inline-flex items-center gap-0.5 transition-colors"
                  onClick={handleViewBill}
                >
                  <Receipt className="size-3" />
                  账单
                </button>
              </div>
            </div>
          </div>

          {/* 参与者头像群 */}
          <button
            className="flex items-center gap-1 -space-x-2 hover:opacity-80 transition-opacity"
            onClick={() => setParticipantOpen(true)}
            aria-label="查看参与者"
          >
            {table.participants.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="size-7 rounded-full bg-card border-2 border-background flex items-center justify-center text-base"
                title={p.nickname}
              >
                {p.avatar}
              </div>
            ))}
            {table.participants.length > 4 && (
              <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{table.participants.length - 4}
              </div>
            )}
            <Users className="size-4 text-muted-foreground ml-3" />
          </button>
        </div>

        {/* 当前视角提示 */}
        {currentUser && (
          <div className="px-4 pb-2">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
              <span>{currentUser.avatar}</span>
              <span>当前以 <b>{currentUser.nickname}</b> 的身份点餐</span>
            </div>
          </div>
        )}
      </header>

      {/* 分类标签 */}
      <div className="sticky top-[60px] md:top-[60px] z-30 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="flex overflow-x-auto gap-1 px-3 py-2 no-scrollbar">
          {MOCK_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  categoryRefs.current[cat.key]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 菜品列表 */}
      <main className="px-4 py-4 space-y-6">
        <div className="text-center text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-lg px-3 py-2">
          {MENU_NOTE}
        </div>
        {MOCK_CATEGORIES.map((cat) => {
          const dishes = MOCK_DISHES.filter((d) => d.category === cat.key);
          return (
            <section
              key={cat.key}
              ref={(el) => {
                categoryRefs.current[cat.key] = el;
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
                <span className="text-xs text-muted-foreground">{dishes.length} 道</span>
              </div>
              <div className="space-y-3">
                {dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantity={dishQuantities[dish.id] || 0}
                    onAdd={() => {
                      const totalUnits = getDishTotalQuantity(dish.id) * getMinPortionCount(dish);
                      if (dish.baseQuantity != null && totalUnits >= dish.baseQuantity) {
                        toast(`「${dish.name}」已达基础数量 ${dish.baseQuantity}${dish.unit ?? ''}，继续加点请确认`, {
                          style: { background: '#ef4444', color: '#fff' },
                          duration: 2600,
                        });
                      }
                      addDish(dish.id, dish.name, dish.price);
                    }}
                    onDecrease={() => {
                      const item = table.cartItems.find(
                        (i) => i.dishId === dish.id && i.userId === currentUserId
                      );
                      if (item) {
                        updateQuantity(item.id, item.quantity - 1);
                      }
                    }}
                    disabled={mySubmitted}
                    totalQuantity={getDishTotalQuantity(dish.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* 底部购物车栏 */}
      <AnimatePresence>
        {(totalCount > 0 || mySubmitted) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <div className="bg-foreground text-background rounded-2xl shadow-xl shadow-foreground/20 flex items-center px-3 py-3 pl-4 gap-3">
              {/* 购物车图标 + 角标 */}
              <div className="relative shrink-0">
                <ShoppingCart className="size-6" />
                <motion.span
                  key={totalCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                >
                  {totalCount}
                </motion.span>
              </div>

              {/* 总金额 */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-background/60">总计</div>
                <div className="text-lg font-black tabular-nums">¥{totalAmount.toFixed(2)}</div>
              </div>

              {/* 按钮 */}
              <Button
                size="lg"
                variant="secondary"
                className="rounded-xl"
                onClick={mySubmitted ? handleViewBill : () => setCartOpen(true)}
              >
                {mySubmitted ? (
                  <>
                    <Receipt className="size-4 mr-1.5" />
                    查看账单
                  </>
                ) : (
                  '查看购物车'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 空状态底部提示（购物车为空时） */}
      {totalCount === 0 && !mySubmitted && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40 pointer-events-none">
          <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-3 text-center text-sm text-muted-foreground border shadow-sm">
            还没有点菜哦，快选几道喜欢的吧 🍲
          </div>
        </div>
      )}

      {/* 购物车面板 */}
      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onSubmit={() => setConfirmOpen(true)}
      />

      {/* 参与者面板 */}
      <ParticipantPanel
        open={participantOpen}
        onClose={() => setParticipantOpen(false)}
        onAddParticipant={() => {
          setParticipantOpen(false);
          setAddUserOpen(true);
        }}
      />

      {/* 添加参与者弹窗 */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加参与者</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="输入昵称（2-8 个字）"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              maxLength={8}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
            />
            <p className="text-xs text-muted-foreground">
              用于模拟多人点餐效果，添加后可切换身份
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddUserOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={newNickname.trim().length < 2 || newNickname.trim().length > 8}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提交确认弹窗 */}
      <SubmitConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
