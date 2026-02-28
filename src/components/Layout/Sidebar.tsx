import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  roles?: UserRole[];
  children?: NavItem[];
}

// Navigation items with role-based access
const navigationItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard',
    roles: [UserRole.ADMIN, UserRole.USER, UserRole.SALES_PERSON] // All roles can access dashboard
  },
  // Admin-only navigation
  // { 
  //   label: 'User Management', 
  //   path: '/users',
  //   roles: [UserRole.ADMIN]
  // },
  { 
    label: 'Booking', 
    path: '/booking',
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Procurement',
    path: '',
    roles: [UserRole.ADMIN],
    children: [
      { label: 'Oil Purchases', path: '/procurement/oil', roles: [UserRole.ADMIN] },
      { label: 'Packaging Purchases', path: '/procurement/packaging', roles: [UserRole.ADMIN] },
    ],
  },
  { 
    label: 'Reports', 
    path: '/reports',
    roles: [UserRole.ADMIN]
  },
  // User-only navigation
  { 
    label: 'Inventory', 
    path: '/inventory',
    roles: [UserRole.USER]
  },
  { 
    label: 'Production', 
    path: '/production',
    roles: [UserRole.USER]
  },
  {
    label: 'Workers',
    path: '/workers',
    roles: [UserRole.USER]
  },
  {
    label: 'Attendance',
    path: '/attendance',
    roles: [UserRole.USER]
  },
  {
    label: 'Payroll',
    path: '/payroll',
    roles: [UserRole.USER]
  },
  // SalesPerson-only navigation
  { 
    label: 'Sales', 
    path: '/sales',
    roles: [UserRole.SALES_PERSON]
  },
  // Shared navigation (all roles)
  // { 
  //   label: 'Profile', 
  //   path: '/profile',
  //   roles: [UserRole.ADMIN, UserRole.USER, UserRole.SALES_PERSON]
  // },
];

const Sidebar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const hasAccess = (item: NavItem): boolean => {
    if (!user || !item.roles) return true;
    return item.roles.includes(user.role);
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <ul>
          {navigationItems
            .filter(hasAccess)
            .map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <li key={item.label} className="nav-group">
                    <span className="nav-link group-label">{item.label}</span>
                    <ul className="nav-sublist">
                      {item.children.filter(hasAccess).map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              isActive ? 'nav-link active' : 'nav-link'
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
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
              );
            })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;