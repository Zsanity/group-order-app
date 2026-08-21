import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTable } from '@/context/TableContext';

interface SubmitConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function SubmitConfirmDialog({ open, onClose, onConfirm }: SubmitConfirmDialogProps) {
  const { table, getUserTotal, getTotalAmount, getTotalCount } = useTable();

  if (!table) return null;

  const totalAmount = getTotalAmount();
  const totalCount = getTotalCount();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>确认提交订单？</DialogTitle>
          <DialogDescription>
            提交后将进入已下单状态，不能再加菜
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground">共 {totalCount} 份菜品</div>
            <div className="text-3xl font-black text-primary mt-1">¥{totalAmount.toFixed(2)}</div>
          </div>

          <div className="space-y-3">
            {table.participants
              .filter((p) => {
                const userItems = table.cartItems.filter((i) => i.userId === p.id);
                return userItems.length > 0;
              })
              .map((p) => {
                const userItems = table.cartItems.filter((i) => i.userId === p.id);
                const count = userItems.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="size-7 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
                        {p.avatar}
                      </div>
                      <span className="flex-1 truncate font-medium">{p.nickname}</span>
                      <span className="text-muted-foreground text-xs">{count} 份</span>
                      <span className="font-semibold tabular-nums min-w-[4.5rem] text-right text-primary">
                        ¥{getUserTotal(p.id).toFixed(2)}
                      </span>
                    </div>
                    <div className="pl-10 space-y-1">
                      {userItems.map((item) => (
                        <div
                          key={item.id}
                          className="text-xs text-muted-foreground flex items-start gap-1"
                        >
                          <span className="shrink-0">·</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-foreground/80">{item.dishName}</span>
                            <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                            {item.remark && (
                              <div className="text-[11px] text-primary/80 bg-primary/5 inline-block px-1.5 py-0.5 rounded mt-0.5">
                                💬 {item.remark}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            再看看
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            确认下单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
