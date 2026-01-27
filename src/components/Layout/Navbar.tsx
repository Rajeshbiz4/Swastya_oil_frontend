import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { APP_NAME } from '../../utils/constants';

const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>{APP_NAME}</h1>
      </div>
      
      {isAuthenticated && user && (
        <div className="navbar-user">
          <span className="user-info">
            Welcome, {user.username} ({user.role})
          </span>
          <button 
            className="logout-btn"
            onClick={handleLogout} 
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;