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
    label: 'Masters',
    path: '',
    roles: [UserRole.ADMIN],
    children: [
      { label: 'Vendor Management', path: '/vendors', roles: [UserRole.ADMIN] },
      { label: 'Customer Management', path: '/customers', roles: [UserRole.ADMIN] },
    ],
  },
  {
    label: 'Procurement',
    path: '',
    roles: [UserRole.ADMIN],
    children: [
      { label: 'Oil Purchases', path: '/procurement/oil', roles: [UserRole.ADMIN] },
      { label: 'Packaging Purchases', path: '/procurement/packaging', roles: [UserRole.ADMIN] },
      { label: 'Batch Processing', path: '/procurement/batch', roles: [UserRole.ADMIN] },
    ],
  },
  //    { 
  //   label: 'Batch', 
  //   path: '/Batch',
  //   roles: [UserRole.ADMIN]
  // },
  
    { 
    label: 'Production', 
    path: '/production',
    roles: [UserRole.USER]
  },
   { 
    label: 'Invoices', 
    path: '/invoices',
    roles: [UserRole.ADMIN]
  },
  { 
    label: 'Inventory', 
    path: '/inventory',
    roles: [UserRole.ADMIN]
  },
  { 
    label: 'Reports', 
    path: '/reports',
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Application Settings',
    path: '/settings',
    roles: [UserRole.ADMIN]
  },
  // User-only navigation

  {
    label: 'Employee Management',
    path: '/employees',
    roles: [UserRole.USER, UserRole.ADMIN]
  },
  {
    label: 'Maintenance',
    path: '/maintenance',
    roles: [UserRole.ADMIN, UserRole.USER]
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

//console.log("Sidebar User:", user);
//console.log("Sidebar Role:", user?.role);

const Sidebar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

 /*navigationItems.forEach(item => {
    console.log(
      item.label,
      item.roles,
      item.roles?.includes(user?.role as UserRole)
    );
  });*/

  const hasAccess = (item: NavItem): boolean => {
    if (!user || !item.roles) return true;
    return item.roles.includes(user.role);
  };

  /*const hasAccess = (item: NavItem): boolean => {
  return true;
};
*/
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