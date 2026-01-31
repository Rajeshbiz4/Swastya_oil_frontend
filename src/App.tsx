import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './store';
import { fetchProfile } from './store/slices/authSlice';
import { UserRole } from './types';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import Procurement from './pages/Procurement';
import Inventory from './pages/Inventory';
import ProductionImproved from './pages/ProductionImproved';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Worker from './pages/Worker';
import Attendance from './pages/Attendance';
import Payment from './pages/Payment';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';

// Placeholder components for future implementation
const NotFound = () => <div className="page-placeholder">Page Not Found</div>;

const AppContent: React.FC = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If we have a token but no user, fetch the profile
    if (token && !isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [token, isAuthenticated, dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Admin-only routes */}
          <Route path="dashboard" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="booking" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Booking />
            </ProtectedRoute>
          } />
          <Route path="procurement" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Procurement />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Reports />
            </ProtectedRoute>
          } />
          
          {/* User-only routes */}
          <Route path="inventory" element={
            <ProtectedRoute requiredRoles={[UserRole.USER]}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="production" element={
            <ProtectedRoute requiredRoles={[UserRole.USER]}>
              <ProductionImproved />
            </ProtectedRoute>
          } />
          <Route path="sales" element={
            <ProtectedRoute requiredRoles={[UserRole.USER, UserRole.SALES_PERSON]}>
              <Sales />
            </ProtectedRoute>
          } />
          <Route path="workers" element={
            <ProtectedRoute requiredRoles={[UserRole.USER]}>
              <Worker />
            </ProtectedRoute>
          } />
          <Route path="attendance" element={
            <ProtectedRoute requiredRoles={[UserRole.USER]}>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path="payroll" element={
            <ProtectedRoute requiredRoles={[UserRole.USER]}>
              <Payment />
            </ProtectedRoute>
          } />
          
          {/* Shared routes (Admin + User) */}
          <Route path="production" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <ProductionImproved />
            </ProtectedRoute>
          } />
          <Route path="sales" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Sales />
            </ProtectedRoute>
          } />
          <Route path="attendance" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Reports />
            </ProtectedRoute>
          } />
          
          {/* Profile route for all authenticated users */}
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
