import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage/HomePage";
import OrderPage from "@/pages/OrderPage/OrderPage";
import BillPage from "@/pages/BillPage/BillPage";
import LoginPage from "@/pages/LoginPage/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import { useTable } from "@/context/TableContext";

function RequireAuth() {
  const { account } = useTable();
  if (!account) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<HomePage />} />
          <Route path="order/:roomCode" element={<OrderPage />} />
          <Route path="bill/:roomCode" element={<BillPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
