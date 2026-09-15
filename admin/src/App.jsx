import { lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { PageLoader } from './components/ui.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductForm = lazy(() => import('./pages/ProductForm.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Coupons = lazy(() => import('./pages/Coupons.jsx'));
const Banners = lazy(() => import('./pages/Banners.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

function RequireAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAdmin />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="banners" element={<Banners />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<div className="py-20 text-center text-slate-500">Page not found</div>} />
        </Route>
      </Route>
    </Routes>
  );
}
