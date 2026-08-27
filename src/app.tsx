import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useTable } from "@/context/TableContext";

const HomePage = lazy(() => import("@/pages/HomePage/HomePage"));
const OrderPage = lazy(() => import("@/pages/OrderPage/OrderPage"));
const BillPage = lazy(() => import("@/pages/BillPage/BillPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage/LoginPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage/NotFoundPage"));

function RequireAuth() {
  const { account } = useTable();
  if (!account) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
