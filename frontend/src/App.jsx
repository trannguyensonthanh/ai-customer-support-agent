import { Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { AuthProvider as AdminAuthProvider } from './admin/AuthContext.jsx';

// Shop & Customer
import Storefront from './Storefront.jsx';
import ProductList from './shop/ProductList.jsx';
import ProductDetail from './shop/ProductDetail.jsx';
import CartPage from './shop/CartPage.jsx';
import CheckoutPage from './shop/CheckoutPage.jsx';
import OrderConfirmation from './shop/OrderConfirmation.jsx';
import LoginPage from './customer/LoginPage.jsx';
import ProfilePage from './customer/ProfilePage.jsx';
import MyOrders from './customer/MyOrders.jsx';
import OrderDetail from './customer/OrderDetail.jsx';
import ChatPage from './shop/ChatPage.jsx';
import ToastContainer from './components/Toast.jsx';

// Admin
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Conversations from './admin/Conversations.jsx';
import Faqs from './admin/Faqs.jsx';
import Tickets from './admin/Tickets.jsx';
import Orders from './admin/Orders.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AdminAuthProvider>
              <ToastContainer />
              <Routes>
                {/* Store & Customer Routes */}
                <Route path="/" element={<Storefront />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirm" element={<OrderConfirmation />} />
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Unified Login */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:code" element={<OrderDetail />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="conversations" element={<Conversations />} />
                  <Route path="faqs" element={<Faqs />} />
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="orders" element={<Orders />} />
                </Route>
              </Routes>
            </AdminAuthProvider>
          </NotificationProvider>
        </CartProvider>
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
