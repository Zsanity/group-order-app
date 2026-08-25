import { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Loader2, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTable } from '@/context/TableContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useTable();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validUsername = username.trim().length >= 2 && username.trim().length <= 20;
  const validPassword = password.length >= 4;

  const switchMode = (m: Mode) => {
    setMode(m);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async () => {
    if (!validUsername || !validPassword) return;
    setLoading(true);
    const fn = mode === 'login' ? login : register;
    const res = await fn(username.trim(), password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message || '操作失败');
      return;
    }
    toast.success(mode === 'login' ? `欢迎回来，${username.trim()}` : `账号创建成功，${username.trim()}`);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Utensils className="size-8" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-1">多人点餐</h1>
          <p className="text-muted-foreground text-sm">登录后创建或加入餐桌</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === 'login' ? '登录' : '创建账号'}
            </CardTitle>
            <CardDescription className="text-xs">
              {mode === 'login'
                ? '输入用户名和密码登录，账号跨设备通用'
                : '注册后你的身份会保存到云端，换浏览器也不会丢失'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                用户名 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="2-20 个字符"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {username.length > 0 && !validUsername && (
                <p className="text-xs text-destructive">用户名需要 2-20 个字符</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                密码 <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="至少 4 位"
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 64))}
                maxLength={64}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {password.length > 0 && !validPassword && (
                <p className="text-xs text-destructive">密码至少 4 位</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!validUsername || !validPassword || loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {mode === 'login' ? '登录' : '注册并登录'}
            </Button>
            <div className="flex items-center justify-center gap-1 pt-1 text-sm">
              {mode === 'login' ? (
                <span className="text-muted-foreground">
                  还没有账号？
                  <button
                    className="text-primary hover:underline ml-1 font-medium"
                    onClick={() => switchMode('register')}
                  >
                    创建账号
                  </button>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  已有账号？
                  <button
                    className="text-primary hover:underline ml-1 font-medium"
                    onClick={() => switchMode('login')}
                  >
                    去登录
                  </button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          🍜 多人聚餐，各自点单更自在
        </p>
      </motion.div>
    </div>
  );
}
