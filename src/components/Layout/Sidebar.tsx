import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  roles?: UserRole[];
}

// Navigation items with role-based access
const navigationItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard',
    roles: [UserRole.ADMIN] // Admin only
  },
  { 
    label: 'User Management', 
    path: '/users',
    roles: [UserRole.ADMIN] // Admin only
  },
  { 
    label: 'Booking', 
    path: '/booking',
    roles: [UserRole.ADMIN] // Admin only
  },
  { 
    label: 'Procurement', 
    path: '/procurement',
    roles: [UserRole.ADMIN] // Admin only
  },
  { 
    label: 'Reports', 
    path: '/reports',
    roles: [UserRole.ADMIN] // Admin only
  },
  { 
    label: 'Inventory', 
    path: '/inventory',
    roles: [UserRole.USER] // User only
  },
  { 
    label: 'Production', 
    path: '/production',
    roles: [UserRole.USER] // User only
  },
  { 
    label: 'Sales', 
    path: '/sales',
    roles: [UserRole.USER, UserRole.SALES_PERSON] // User and SalesPerson
  },
  {
    label: 'Workers',
    path: '/workers',
    roles: [UserRole.USER] // User only
  },
  {
    label: 'Attendance',
    path: '/attendance',
    roles: [UserRole.USER] // User only
  },
  {
    label: 'Payroll',
    path: '/payroll',
    roles: [UserRole.USER] // User only
  },
  { 
    label: 'My Profile', 
    path: '/profile',
    roles: [UserRole.ADMIN, UserRole.USER, UserRole.SALES_PERSON] // All can access
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const hasAccess = (item: NavItem): boolean => {
    if (!user || !item.roles) return true;
    return item.roles.includes(user.role);
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {navigationItems
            .filter(hasAccess)
            .map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => 
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;