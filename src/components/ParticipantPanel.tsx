import { motion, AnimatePresence } from 'framer-motion';
import { Copy, UserPlus, Users, LogOut, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTable } from '@/context/TableContext';

interface ParticipantPanelProps {
  open: boolean
  onClose: () => void
  onAddParticipant: () => void
}

export default function ParticipantPanel({ open, onClose, onAddParticipant }: ParticipantPanelProps) {
  const { table, currentUserId, setCurrentUser, leaveTable } = useTable();

  const copyRoomCode = async () => {
    if (!table) return;
    try {
      await navigator.clipboard.writeText(table.roomCode);
      toast.success('房间码已复制');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = table.roomCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success('房间码已复制');
    }
  };

  const handleLeave = () => {
    if (window.confirm('确定要离开餐桌吗？')) {
      leaveTable();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            餐桌信息
          </DialogTitle>
        </DialogHeader>

        {table && (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">房间码</div>
              <div className="text-3xl font-black tracking-[0.3em] text-primary mb-2">
                {table.roomCode}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyRoomCode}
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                复制房间码
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-foreground">
                  参与者 <span className="text-muted-foreground">({table.participants.length}人)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddParticipant}
                  className="h-7 text-primary gap-1 -mr-2"
                >
                  <UserPlus className="size-4" />
                  添加
                </Button>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {table.participants.map((p) => {
                    const isCurrent = p.id === currentUserId;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border hover:bg-muted/40 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isCurrent) {
                            setCurrentUser(p.id);
                            toast.success(`已切换到 ${p.nickname} 的视角`);
                          }
                        }}
                      >
                        <div className="size-10 rounded-full bg-card border flex items-center justify-center text-xl shrink-0">
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{p.nickname}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                                当前
                              </span>
                            )}
                          </div>
                        </div>
                        {!isCurrent && (
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/5"
              onClick={handleLeave}
            >
              <LogOut className="size-4 mr-2" />
              离开餐桌
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
