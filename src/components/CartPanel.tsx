import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Minus, Plus, Receipt, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import { useTable } from '@/context/TableContext';
import { getDishUnit } from '@/data/menu';
import type { ICartItem } from '@/types/table';

interface CartPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CartPanel({ open, onClose, onSubmit }: CartPanelProps) {
  const navigate = useNavigate();
  const { table, currentUserId, updateQuantity, updateRemark, removeItem, clearCart, getMyCount } =
    useTable();

  const [remarkItemId, setRemarkItemId] = useState<string | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  if (!table || !currentUserId) return null;

  // 只展示当前用户自己的菜品
  const myCartItems = table.cartItems.filter((item) => item.userId === currentUserId);
  const myOrder = table.submitted.find((s) => s.userId === currentUserId);
  const mySubmitted = !!myOrder;

  const displayItems: ICartItem[] = mySubmitted ? (myOrder?.items ?? []) : myCartItems;
  const myCount = mySubmitted ? (myOrder?.totalCount ?? 0) : getMyCount();
  const myAmount = mySubmitted
    ? (myOrder?.totalAmount ?? 0)
    : myCartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const currentRemarkItem = remarkItemId
    ? table.cartItems.find((i) => i.id === remarkItemId)
    : null;

  const openRemark = (item: ICartItem) => {
    setRemarkItemId(item.id);
    setRemarkInput(item.remark ?? '');
  };

  const saveRemark = () => {
    if (remarkItemId) {
      updateRemark(remarkItemId, remarkInput.trim());
      setRemarkItemId(null);
    }
  };

  const confirmDelete = (itemId: string) => {
    setDeleteItemId(itemId);
  };

  const handleDelete = () => {
    if (deleteItemId) {
      removeItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleClear = () => {
    clearCart();
    setClearOpen(false);
  };

  const handleViewBill = () => {
    if (table.roomCode) {
      navigate(`/bill/${table.roomCode}`);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              {mySubmitted ? (
                <>
                  <Receipt className="size-5 text-primary" />
                  我的订单详情
                </>
              ) : (
                <>
                  <ShoppingCart className="size-5 text-primary" />
                  我的购物车
                </>
              )}
              <Badge variant="secondary" className="ml-1">
                {myCount} 串
              </Badge>
            </DialogTitle>
            <DialogDescription>
              仅展示自己点的菜品 · 共 {myCount} 串 · 总计{' '}
              <span className="text-primary font-semibold">¥{myAmount.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-muted-foreground">
                  {mySubmitted ? '你已提交订单' : '还没有点菜哦'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {mySubmitted ? '可前往账单查看结算明细' : '快去菜单里挑选美味吧～'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {displayItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      className="bg-muted/30 rounded-lg p-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.dishName}</div>
                          <div className="text-xs text-muted-foreground">
                            ¥{item.price} × {item.quantity}
                            {getDishUnit(item.dishId)}
                          </div>
                        </div>

                        {!mySubmitted ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="text-sm font-medium tabular-nums min-w-[1.2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="default"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => confirmDelete(item.id)}
                              aria-label="删除"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-primary w-16 text-right">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 pl-0">
                        {item.remark ? (
                          <>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-normal text-foreground border-border bg-card gap-1 cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => !mySubmitted && openRemark(item)}
                            >
                              <MessageSquare className="size-3" />
                              {item.remark}
                            </Badge>
                            {!mySubmitted && (
                              <button
                                className="text-[11px] text-muted-foreground hover:text-primary"
                                onClick={() => openRemark(item)}
                              >
                                编辑
                              </button>
                            )}
                          </>
                        ) : !mySubmitted ? (
                          <button
                            className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                            onClick={() => openRemark(item)}
                          >
                            <MessageSquare className="size-3" />
                            加备注
                          </button>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {displayItems.length > 0 && (
            <DialogFooter className="px-6 py-4 border-t">
              <div className="w-full flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  共 {myCount} 串
                  <span className="ml-2 text-lg font-bold text-primary">
                    ¥{myAmount.toFixed(2)}
                  </span>
                </div>
                {mySubmitted ? (
                  <Button variant="secondary" size="lg" onClick={handleViewBill} className="gap-2">
                    <Receipt className="size-4" />
                    查看账单
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setClearOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      清空
                    </Button>
                    <Button onClick={onSubmit} size="lg" className="gap-2">
                      <Receipt className="size-4" />
                      提交订单
                    </Button>
                  </div>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 备注编辑弹窗 */}
      <Dialog open={!!remarkItemId} onOpenChange={(v) => !v && setRemarkItemId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>菜品备注</DialogTitle>
            <DialogDescription>{currentRemarkItem?.dishName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="如：少辣、不要香菜、忌口葱姜"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
              {['少辣', '微辣', '不辣', '不要香菜', '少盐', '忌口葱姜'].map((t) => (
                <button
                  key={t}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                  onClick={() => setRemarkInput((prev) => (prev ? prev + '、' + t : t))}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-right">{remarkInput.length}/30</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemarkItemId(null)}>
              取消
            </Button>
            <Button onClick={saveRemark}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除单道菜确认弹窗 */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(v) => !v && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这道菜？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后可以重新添加，备注信息也会一并清除
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 一键清空确认弹窗 */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空购物车？</AlertDialogTitle>
            <AlertDialogDescription>
              将清空你自己加入的全部菜品，其他同桌成员不受影响。清空后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">
              清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
