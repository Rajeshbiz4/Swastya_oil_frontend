import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../utils/constants';

interface NavItem {
  label: string;
  path: string;
  roles?: UserRole[];
}

// Admin-only menus
const adminMenuItems: NavItem[] = [
  { 
    label: 'Booking', 
    path: '/booking',
    roles: [UserRole.ADMIN]
  },
  { 
    label: 'Procurement', 
    path: '/procurement',
    roles: [UserRole.ADMIN]
  },
];

// Non-admin user menus
const userMenuItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard',
    roles: [UserRole.PURCHASE_MANAGER, UserRole.PRODUCTION_SUPERVISOR, UserRole.SALES_MANAGER, UserRole.ACCOUNTANT, UserRole.VIEWER]
  },
  { 
    label: 'Inventory', 
    path: '/inventory',
    roles: [UserRole.PURCHASE_MANAGER, UserRole.PRODUCTION_SUPERVISOR, UserRole.SALES_MANAGER]
  },
  { 
    label: 'Production', 
    path: '/production',
    roles: [UserRole.PRODUCTION_SUPERVISOR]
  },
  { 
    label: 'Sales', 
    path: '/sales',
    roles: [UserRole.SALES_MANAGER]
  },
  {
    label: 'Workers',
    path: '/workers',
    roles: [UserRole.PRODUCTION_SUPERVISOR]
  },
  {
    label: 'Attendance',
    path: '/attendance',
    roles: [UserRole.PRODUCTION_SUPERVISOR]
  },
  {
    label: 'Payroll',
    path: '/payroll',
    roles: [UserRole.ACCOUNTANT]
  },
  { 
    label: 'Reports', 
    path: '/reports',
    roles: [UserRole.ACCOUNTANT, UserRole.VIEWER, UserRole.SALES_MANAGER, UserRole.PRODUCTION_SUPERVISOR, UserRole.PURCHASE_MANAGER]
  },
];

// Combined navigation items
const navigationItems: NavItem[] = [...adminMenuItems, ...userMenuItems];

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