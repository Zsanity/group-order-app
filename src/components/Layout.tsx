import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TableProvider } from '@/context/TableContext';
import { IS_TEST_BUILD } from '@/config';

export const Layout = () => {
  return (
    <TableProvider>
      <Outlet />
      <Toaster position="top-center" />
      {/* 版本角标：测试版常驻右上角，正式版不显示 */}
      {IS_TEST_BUILD && (
        <div className="fixed top-3 right-3 z-[100] text-[11px] font-semibold text-amber-600 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full pointer-events-none">
          测试版
        </div>
      )}
    </TableProvider>
  );
};
