import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './store';
import { fetchProfile } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Procurement from './pages/Procurement';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Worker from './pages/Worker';
import Attendance from './pages/Attendance';
import Payment from './pages/Payment';

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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="production" element={<Production />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reports" element={<Reports />} />
          <Route path="workers" element={<Worker />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payroll" element={<Payment />} />
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
