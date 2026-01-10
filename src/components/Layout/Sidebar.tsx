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

const navigationItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { 
    label: 'Procurement', 
    path: '/procurement',
    roles: [UserRole.ADMIN, UserRole.PURCHASE_MANAGER]
  },
  { 
    label: 'Inventory', 
    path: '/inventory',
    roles: [UserRole.ADMIN, UserRole.PURCHASE_MANAGER, UserRole.PRODUCTION_SUPERVISOR, UserRole.SALES_MANAGER]
  },
  { 
    label: 'Production', 
    path: '/production',
    roles: [UserRole.ADMIN, UserRole.PRODUCTION_SUPERVISOR]
  },
  { 
    label: 'Sales', 
    path: '/sales',
    roles: [UserRole.ADMIN, UserRole.SALES_MANAGER]
  },
  {
    label: 'Workers',
    path: '/workers',
    roles: [UserRole.ADMIN, UserRole.PRODUCTION_SUPERVISOR]
  },
  {
    label: 'Attendance',
    path: '/attendance',
    roles: [UserRole.ADMIN, UserRole.PRODUCTION_SUPERVISOR]
  },
  {
    label: 'Payroll',
    path: '/payroll',
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT]
  },
  { 
    label: 'Reports', 
    path: '/reports',
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER, UserRole.SALES_MANAGER, UserRole.PRODUCTION_SUPERVISOR, UserRole.PURCHASE_MANAGER]
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