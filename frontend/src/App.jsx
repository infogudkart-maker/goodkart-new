import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import MarketplaceHome from '@/modules/marketplace/pages/Home';
import ProductListing from '@/modules/marketplace/pages/ProductListing';
import ProductDetail from '@/modules/marketplace/pages/ProductDetail';
import Cart from '@/modules/marketplace/pages/Cart';
import Checkout from '@/modules/marketplace/pages/Checkout';
import OrderTracking from '@/modules/marketplace/pages/OrderTracking';
import Invoice from '@/modules/marketplace/pages/Invoice';
import Deals from '@/modules/marketplace/pages/Deals';
import NewArrivals from '@/modules/marketplace/pages/NewArrivals';
import Trending from '@/modules/marketplace/pages/Trending';
import CategoryPage from '@/modules/marketplace/pages/CategoryPage';
import Wishlist from '@/modules/marketplace/pages/Wishlist';
import FAQ from '@/modules/marketplace/pages/FAQ';
import TermsOfUse from '@/modules/marketplace/pages/TermsOfUse';
import CancellationReturns from '@/modules/marketplace/pages/CancellationReturns';
import Privacy from '@/modules/marketplace/pages/Privacy';
import Security from '@/modules/marketplace/pages/Security';
import SellerRegistration from '@/modules/seller/pages/Registration';
import SellerPageWithAuth from '@/modules/seller/pages/SellerPageWithAuth';
import SellerOnboarding from '@/modules/seller/pages/SellerOnboarding';
import SellerDashboard from '@/modules/seller/pages/Dashboard';
import AddProduct from '@/modules/seller/pages/AddProduct';
import AdminDashboard from '@/modules/admin/pages/Dashboard';
import AdminLogin from '@/modules/admin/pages/Login';
import ConsumerDashboard from '@/modules/consumer/pages/Dashboard';
import Navbar from '@/modules/shared/components/layout/Navbar';
import Footer from '@/modules/shared/components/layout/Footer';
import ProtectedRoute from '@/modules/shared/components/common/ProtectedRoute';
import ScrollToTop from '@/modules/shared/components/common/ScrollToTop';

// Mobile Responsiveness - Proper vertical scrolling with adaptive layout
import '@/styles/mobile-responsive.css';
import ErrorBoundary from '@/modules/shared/components/common/ErrorBoundary';

// Auto-cleanup old localStorage data (runs once per version)
import '@/modules/shared/utils/clearOldData';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  // Hide navbar for seller landing, registration, and onboarding flows (they have their own SellerHeader)
  const isSellerPage = location.pathname.startsWith('/seller');

  // Routes where footer should be hidden
  const hideFooterRoutes = [
    "/seller",
    "/seller/register",
    "/seller/onboarding",
    "/seller/dashboard",
    "/admin"
  ];

  return (
    <div className="app-container">
      <ScrollToTop />
      {!isSellerPage && !isAdminPage && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Marketplace Routes */}
          <Route path="/" element={<MarketplaceHome />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute requiredRole="CONSUMER">
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requiredRole="CONSUMER">
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/cancellation-returns" element={<CancellationReturns />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute requiredRole="CONSUMER">
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* Consumer Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute requiredRole="CONSUMER">
                <ConsumerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Seller Routes */}
          <Route path="/seller" element={<SellerPageWithAuth />} />
          <Route path="/seller/register" element={<SellerPageWithAuth />} />
          <Route path="/seller/onboarding" element={<SellerOnboarding />} />
          <Route
            path="/seller/add-product"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard/*"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-All 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
              <p className="mt-4 text-gray-600">The path "{location.pathname}" was not found by the app's router.</p>
              <Link to="/" className="mt-8 btn btn-primary">Go Home</Link>
            </div>
          } />
        </Routes>
      </main>
      {!hideFooterRoutes.some(route => location.pathname.startsWith(route)) && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
