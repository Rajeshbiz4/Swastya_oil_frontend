import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchRawOilInventory, fetchPackagingInventory, fetchFinishedGoodsInventory } from '../store/slices/inventorySlice';
import { fetchOilPurchaseSummary, fetchPackagingPurchaseSummary } from '../store/slices/procurementSlice';
import { fetchRecentActivity } from '../store/slices/auditSlice';
import { UserRole } from '../types';
import './Pages.css';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { rawOil, packaging, finishedGoods, isLoading } = useAppSelector((state) => state.inventory);
  const { oilSummary, packagingSummary, isLoading: procurementLoading } = useAppSelector((state) => state.procurement);
  const { recentLogs, isLoading: auditLoading } = useAppSelector((state) => state.audit);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch data based on user role
    if (user?.role === UserRole.ADMIN) {
      // Admin can see all data
      dispatch(fetchRawOilInventory());
      dispatch(fetchPackagingInventory());
      dispatch(fetchFinishedGoodsInventory());
      dispatch(fetchOilPurchaseSummary());
      dispatch(fetchPackagingPurchaseSummary());
      dispatch(fetchRecentActivity());
    } else if (user?.role === UserRole.USER) {
      // User can see inventory data
      dispatch(fetchRawOilInventory());
      dispatch(fetchPackagingInventory());
      dispatch(fetchFinishedGoodsInventory());
    } else if (user?.role === UserRole.SALES_PERSON) {
      // SalesPerson can see finished goods for sales
      dispatch(fetchFinishedGoodsInventory());
    }
  }, [dispatch, user?.role]);

  const calculateTotals = () => {
    if (!Array.isArray(rawOil) || !Array.isArray(packaging) || !Array.isArray(finishedGoods)) {
      return {
        totalRawOil: 0,
        totalRawOilValue: 0,
        totalPackaging: 0,
        totalFinishedGoods: 0,
        totalFinishedGoodsValue: 0,
      };
    }
    
    const totalRawOil = rawOil.reduce((sum, item) => sum + item.currentQuantity, 0);
    const totalRawOilValue = rawOil.reduce((sum, item) => sum + (item.currentQuantity * item.costPerLiter), 0);
    const totalPackaging = packaging.reduce((sum, item) => sum + item.currentStock, 0);
    const totalFinishedGoods = finishedGoods.reduce((sum, item) => sum + item.quantity, 0);
    const totalFinishedGoodsValue = finishedGoods.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    return {
      totalRawOil,
      totalRawOilValue,
      totalPackaging,
      totalFinishedGoods,
      totalFinishedGoodsValue,
    };
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          { label: 'Add Oil Purchase', action: 'oil-purchase', path: '/procurement' },
          { label: 'Manage Bookings', action: 'booking', path: '/booking' },
          { label: 'User Management', action: 'users', path: '/users' },
          { label: 'View Reports', action: 'reports', path: '/reports' }
        ];
      case UserRole.USER:
        return [
          { label: 'Manage Inventory', action: 'inventory', path: '/inventory' },
          { label: 'Create Production Batch', action: 'production', path: '/production' },
          { label: 'Manage Workers', action: 'workers', path: '/workers' },
          { label: 'Record Attendance', action: 'attendance', path: '/attendance' }
        ];
      case UserRole.SALES_PERSON:
        return [
          { label: 'New Sales Order', action: 'sales', path: '/sales' },
          { label: 'View Inventory', action: 'inventory-view', path: '/dashboard' },
          { label: 'My Profile', action: 'profile', path: '/profile' }
        ];
      default:
        return [];
    }
  };

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const totals = calculateTotals();

  if (isLoading || procurementLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return (
          <>
            {/* Admin Dashboard - Full Overview */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">🛢️</div>
                <div className="stat-content">
                  <h3>Raw Oil Inventory</h3>
                  <div className="stat-value">{totals.totalRawOil.toLocaleString()} L</div>
                  <div className="stat-subtext">
                    Value: ₹{totals.totalRawOilValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>Packaging Inventory</h3>
                  <div className="stat-value">{totals.totalPackaging.toLocaleString()}</div>
                  <div className="stat-subtext">Units in stock</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Finished Goods</h3>
                  <div className="stat-value">{totals.totalFinishedGoods.toLocaleString()}</div>
                  <div className="stat-subtext">
                    Value: ₹{totals.totalFinishedGoodsValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Inventory Value</h3>
                  <div className="stat-value">
                    ₹{(totals.totalRawOilValue + totals.totalFinishedGoodsValue).toLocaleString()}
                  </div>
                  <div className="stat-subtext">Current valuation</div>
                </div>
              </div>
            </div>

            {/* Procurement Summary Section */}
            {/* <div className="dashboard-section">
              <h2>Procurement Summary</h2>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon">🛢️</div>
                  <div className="stat-content">
                    <h3>Oil Purchases</h3>
                    <div className="stat-value">{oilSummary?.totalPurchases || 0}</div>
                    <div className="stat-subtext">
                      Total: ₹{(oilSummary?.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="stat-subtext">
                      Quantity: {(oilSummary?.totalQuantity || 0).toLocaleString()} L
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <h3>Packaging Purchases</h3>
                    <div className="stat-value">{packagingSummary?.totalPurchases || 0}</div>
                    <div className="stat-subtext">
                      Total: ₹{(packagingSummary?.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="stat-subtext">
                      Quantity: {(packagingSummary?.totalQuantity || 0).toLocaleString()} Units
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💳</div>
                  <div className="stat-content">
                    <h3>Payment Status</h3>
                    <div className="stat-value">
                      ₹{((oilSummary?.unpaidAmount || 0) + (packagingSummary?.unpaidAmount || 0)).toLocaleString()}
                    </div>
                    <div className="stat-subtext">Pending payments</div>
                    <div className="stat-subtext">
                      Paid: ₹{((oilSummary?.paidAmount || 0) + (packagingSummary?.paidAmount || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>Average Rates</h3>
                    <div className="stat-value">₹{(oilSummary?.averageRate || 0).toFixed(2)}/L</div>
                    <div className="stat-subtext">Oil average rate</div>
                    <div className="stat-subtext">
                      Packaging: ₹{(packagingSummary?.averageRate || 0).toFixed(2)}/Unit
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </>
        );

      case UserRole.USER:
        return (
          <>
            {/* User Dashboard - Production Focus */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">🛢️</div>
                <div className="stat-content">
                  <h3>Raw Oil Available</h3>
                  <div className="stat-value">{totals.totalRawOil.toLocaleString()} L</div>
                  <div className="stat-subtext">For production use</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>Packaging Stock</h3>
                  <div className="stat-value">{totals.totalPackaging.toLocaleString()}</div>
                  <div className="stat-subtext">Units available</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Finished Products</h3>
                  <div className="stat-value">{totals.totalFinishedGoods.toLocaleString()}</div>
                  <div className="stat-subtext">Ready for sale</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👷</div>
                <div className="stat-content">
                  <h3>Production Status</h3>
                  <div className="stat-value">Active</div>
                  <div className="stat-subtext">Production line running</div>
                </div>
              </div>
            </div>
          </>
        );

      case UserRole.SALES_PERSON:
        return (
          <>
            {/* SalesPerson Dashboard - Sales Focus */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Available for Sale</h3>
                  <div className="stat-value">{totals.totalFinishedGoods.toLocaleString()}</div>
                  <div className="stat-subtext">Finished products</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Inventory Value</h3>
                  <div className="stat-value">₹{totals.totalFinishedGoodsValue.toLocaleString()}</div>
                  <div className="stat-subtext">Total sales potential</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Sales Target</h3>
                  <div className="stat-value">85%</div>
                  <div className="stat-subtext">Monthly progress</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Orders Today</h3>
                  <div className="stat-value">12</div>
                  <div className="stat-subtext">New orders</div>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.username}! ({user?.role})</p>
      </div>

      {renderRoleSpecificContent()}

      <div className="dashboard-content">
        {/* Recent Activity - Only for Admin */}
        {/* {user?.role === UserRole.ADMIN && (
          <div className="dashboard-section">
            <h2>Recent Activity</h2>
            {auditLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading recent activity...</p>
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="activity-list">
                {recentLogs.map((log) => (
                  <div key={log._id} className="activity-item">
                    <div className="activity-icon">
                      {log.action === 'CREATE' && '➕'}
                      {log.action === 'UPDATE' && '✏️'}
                      {log.action === 'DELETE' && '🗑️'}
                      {log.action === 'read' && '👁️'}
                      {!['CREATE', 'UPDATE', 'DELETE', 'read'].includes(log.action) && '📝'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">
                        <span className="activity-action">{log.action}</span>
                        <span className="activity-resource">{log.resource}</span>
                      </div>
                      <p className="activity-description">{log.description}</p>
                      <div className="activity-meta">
                        <span className="activity-user">by {log.username}</span>
                        <span className="activity-time">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="activity-placeholder">
                <p>No recent activity yet.</p>
              </div>
            )}
          </div>
        )} */}

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            {getQuickActions().map((action) => (
              <button 
                key={action.action}
                className="action-button"
                onClick={() => handleQuickAction(action.path)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;