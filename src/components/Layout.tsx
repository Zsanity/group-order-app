import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TableProvider } from '@/context/TableContext';

export const Layout = () => {
  return (
    <TableProvider>
      <Outlet />
      <Toaster position="top-center" />
    </TableProvider>
  );
};
