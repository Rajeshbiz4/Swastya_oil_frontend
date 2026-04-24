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
import ProcurementOil from './pages/ProcurementOil';
import ProcurementPackaging from './pages/ProcurementPackaging';
import OilBatchProcessing from './pages/OilBatchProcessing';
import Inventory from './pages/Inventory';
import ProductionImproved from './pages/ProductionImproved';
import Invoices from './pages/invoices';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Worker from './pages/Worker';
import Attendance from './pages/Attendance';
import Payment from './pages/Payment';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import EmployeeManagement from './pages/EmployeeManagement';
import Batch from './pages/OilBatchProcessing';

// Placeholder components for future implementation
const NotFound = () => <div className="page-placeholder">Page Not Found</div>;

const AppContent: React.FC = () => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If we have a token but no user, fetch the profile
    if (token && !isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [token, isAuthenticated, dispatch]);

  // Create a role-based default redirect
  const getDefaultRoute = () => {
    if (!user) return '/dashboard';
    
    switch (user.role) {
      case UserRole.ADMIN:
        return '/dashboard';
      case UserRole.USER:
        return '/dashboard';
      case UserRole.SALES_PERSON:
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

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
          <Route index element={<Navigate to={getDefaultRoute()} replace />} />
          
          {/* Dashboard - accessible to all roles but shows different content */}
          <Route path="dashboard" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER, UserRole.SALES_PERSON]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes */}
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
          {/* Procurement submenu routes */}
          <Route
            path="procurement"
            element={<Navigate to="/procurement/oil" replace />}
          />
          <Route
            path="procurement/oil"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <ProcurementOil />
              </ProtectedRoute>
            }
          />
          <Route
            path="procurement/packaging"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <ProcurementPackaging />
              </ProtectedRoute>
            }
          />
          <Route
            path="procurement/batch"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <OilBatchProcessing />
              </ProtectedRoute>
            }
          />
          <Route path="reports" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Reports />
            </ProtectedRoute>
          } />

           <Route path="invoices" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Invoices />
            </ProtectedRoute>
          } />
          
          {/* User-only routes */}
          <Route path="inventory" element={
            <ProtectedRoute requiredRoles={[UserRole.USER, UserRole.ADMIN]}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="production" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <ProductionImproved />
            </ProtectedRoute>
          } />
           <Route path="batch" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <Batch />
            </ProtectedRoute>
          } />
          <Route path="employee-management" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <EmployeeManagement />
            </ProtectedRoute>
          } />
          
          <Route path="workers" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Worker />
            </ProtectedRoute>
          } />
          <Route path="attendance" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path="payroll" element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
              <Payment />
            </ProtectedRoute>
          } />
          
          {/* SalesPerson-only routes */}
          <Route path="sales" element={
            <ProtectedRoute requiredRoles={[UserRole.SALES_PERSON]}>
              <Sales />
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
