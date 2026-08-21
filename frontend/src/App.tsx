import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useAppDispatch } from '@/hooks/useAppRedux';
import { bootstrapSession } from '@/redux/slices/authSlice';
import { PageLoader } from '@/components/ui/PageLoader';
import { SkipToContent } from '@/components/ui/SkipToContent';

// Route-level code splitting: each page is its own chunk, loaded only
// when its route is visited, instead of one ~1MB bundle up front.
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AboutPage = lazy(() => import('@/pages/marketing/AboutPage'));
const FeaturesPage = lazy(() => import('@/pages/marketing/FeaturesPage'));
const ContactPage = lazy(() => import('@/pages/marketing/ContactPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));
const CustomerBookingsPage = lazy(() => import('@/pages/customer/CustomerBookingsPage'));
const CustomerWalletPage = lazy(() => import('@/pages/customer/CustomerWalletPage'));
const OwnerDashboard = lazy(() => import('@/pages/owner/OwnerDashboard'));
const OwnerBookingsPage = lazy(() => import('@/pages/owner/OwnerBookingsPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminVehiclesPage = lazy(() => import('@/pages/admin/AdminVehiclesPage'));
const AdminDisputesPage = lazy(() => import('@/pages/admin/AdminDisputesPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const OwnerVehiclesPage = lazy(() => import('@/pages/owner/OwnerVehiclesPage'));
const AddVehiclePage = lazy(() => import('@/pages/owner/AddVehiclePage'));
const ManageVehiclePage = lazy(() => import('@/pages/owner/ManageVehiclePage'));
const BrowseVehiclesPage = lazy(() => import('@/pages/vehicles/BrowseVehiclesPage'));
const VehicleDetailPage = lazy(() => import('@/pages/vehicles/VehicleDetailPage'));
const BookingDetailPage = lazy(() => import('@/pages/bookings/BookingDetailPage'));
const PaymentCheckoutPage = lazy(() => import('@/pages/bookings/PaymentCheckoutPage'));
const MessagesInboxPage = lazy(() => import('@/pages/messages/MessagesInboxPage'));

import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SkipToContent />
        <Suspense fallback={<PageLoader />}>
          <div id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/vehicles" element={<BrowseVehiclesPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/bookings/:id/pay" element={<PaymentCheckoutPage />} />
              <Route element={<RoleRoute allow={['customer', 'owner']} />}>
                <Route path="/messages" element={<MessagesInboxPage />} />
              </Route>

              <Route element={<RoleRoute allow={['customer']} />}>
                <Route path="/customer" element={<CustomerDashboard />} />
                <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
                  <Route path="/customer/wallet" element={<CustomerWalletPage />} />
              </Route>
              <Route element={<RoleRoute allow={['owner']} />}>
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route path="/owner/vehicles" element={<OwnerVehiclesPage />} />
                <Route path="/owner/vehicles/new" element={<AddVehiclePage />} />
                <Route path="/owner/vehicles/:id" element={<ManageVehiclePage />} />
                <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
              </Route>
              <Route element={<RoleRoute allow={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
                <Route path="/admin/disputes" element={<AdminDisputesPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;


