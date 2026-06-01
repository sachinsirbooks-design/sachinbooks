/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import AllCategories from './pages/AllCategories';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <WishlistProvider>
                <Toaster position="bottom-right" />
                <Routes>
                  {/* Admin Routes (No Layout) */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Public Routes with Layout */}
                  <Route path="/" element={<Layout><Home /></Layout>} />
                  <Route path="/categories" element={<Layout><AllCategories /></Layout>} />
                  <Route path="/category/:slug" element={<Layout><CategoryPage /></Layout>} />
                  <Route path="/book/:id" element={<Layout><ProductDetail /></Layout>} />
                  <Route path="/cart" element={<Layout><Cart /></Layout>} />
                  <Route path="/checkout" element={<Layout><ProtectedRoute><Checkout /></ProtectedRoute></Layout>} />
                  <Route path="/payment-success" element={<Layout><ProtectedRoute><PaymentSuccess /></ProtectedRoute></Layout>} />
                  <Route path="/wishlist" element={<Layout><Wishlist /></Layout>} />
                  <Route path="/search" element={<Layout><Search /></Layout>} />
                  <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
                  <Route path="/about" element={<Layout><About /></Layout>} />
                  <Route path="/contact" element={<Layout><Contact /></Layout>} />
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}
