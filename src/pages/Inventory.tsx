import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchRawOilInventory, fetchPackagingInventory, fetchFinishedGoodsInventory } from '../store/slices/inventorySlice';
import DataTable from '../components/UI/DataTable';
import './Pages.css';

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'raw-oil' | 'packaging' | 'finished-goods'>('raw-oil');
  const { rawOil, packaging, finishedGoods, isLoading, error } = useAppSelector((state) => state.inventory);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Fetch all inventory data
    dispatch(fetchRawOilInventory());
    dispatch(fetchPackagingInventory());
    dispatch(fetchFinishedGoodsInventory());
  }, [dispatch]);

  // Table columns for different inventory types
  const rawOilColumns = [
    { key: 'batchNumber', title: 'Batch Number', sortable: true },
    { key: 'initialQuantity', title: 'Initial Qty (L)', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'currentQuantity', title: 'Current Qty (L)', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'costPerLiter', title: 'Cost/L', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
    { 
      key: 'totalValue', 
      title: 'Total Value', 
      render: (_: any, record: any) => `₹${(record.currentQuantity * record.costPerLiter).toLocaleString()}`
    },
    { key: 'purchaseDate', title: 'Purchase Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'isActive', title: 'Status', render: (value: boolean) => value ? '✅ Active' : '❌ Inactive' },
  ];

  const packagingColumns = [
    { key: 'skuSize', title: 'SKU Size', sortable: true },
    { key: 'packagingType', title: 'Packaging Type', sortable: true },
    { key: 'quantity', title: 'Current Stock', sortable: true, render: (value: number | undefined) => value ? value.toLocaleString() : '-' },
    { key: 'ratePerUnit', title: 'Avg Rate/Unit', sortable: true, render: (value: number | undefined) => value ? `₹${value.toFixed(2)}` : '-' },
    { 
      key: 'totalValue', 
      title: 'Total Value', 
      render: (_: any, record: any) => record.quantity && record.ratePerUnit ? `₹${(record.quantity * record.ratePerUnit).toLocaleString()}` : '-'
    },
    { key: 'totalPurchasedQuantity', title: 'Total Purchased', sortable: true, render: (value: number | undefined) => value ? value.toLocaleString() : '-' },
    { key: 'totalCost', title: 'Total Cost', sortable: true, render: (value: number | undefined) => value ? `₹${value.toLocaleString()}` : '-' },
    { key: 'invoiceNumber', title: 'Last Invoice #', sortable: true },
    { key: 'invoiceDate', title: 'Last Invoice Date', sortable: true, render: (value: string) => value ? new Date(value).toLocaleDateString() : '-' },
    { key: 'lastUpdated', title: 'Last Updated', sortable: true, render: (value: string) => value ? new Date(value).toLocaleDateString() : '-' },
  ];

  const finishedGoodsColumns = [
    { key: 'skuSize', title: 'SKU Size', sortable: true },
    { key: 'packagingType', title: 'Type', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'unitCost', title: 'Unit Cost', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
    { 
      key: 'totalValue', 
      title: 'Total Value', 
      render: (_: any, record: any) => `₹${(record.quantity * record.unitCost).toLocaleString()}`
    },
    { key: 'productionDate', title: 'Production Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'expiryDate', title: 'Expiry Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'isActive', title: 'Status', render: (value: boolean) => value ? '✅ Active' : '❌ Inactive' },
  ];

  console.log('Packaging Inventory Data:', packaging);
  // Calculate summary statistics
  const calculateSummary = () => {
    const rawOilSummary = {
      totalQuantity: rawOil.reduce((sum, item) => sum + item.currentQuantity, 0),
      totalValue: rawOil.reduce((sum, item) => sum + (item.currentQuantity * item.costPerLiter), 0),
      activeBatches: rawOil.filter(item => item.isActive).length,
    };

    const packagingSummary = {
      totalStock: packaging.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalPurchased: packaging.reduce((sum, item) => sum + (item.totalPurchasedQuantity || 0), 0),
      totalCost: packaging.reduce((sum, item) => sum + ((item.totalPurchasedQuantity || 0) * (item.ratePerUnit || 0)), 0),
      totalTypes: Object.keys(packaging.reduce((acc, item) => {
        const key = item.packagingType;
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)).length,
      lowStockItems: packaging.filter(item => (item.quantity || 0) < 100).length,
    };

    const finishedGoodsSummary = {
      totalQuantity: finishedGoods.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: finishedGoods.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
      activeBatches: finishedGoods.filter(item => item.isActive).length,
    };

    return { rawOilSummary, packagingSummary, finishedGoodsSummary };
  };

  const { rawOilSummary, packagingSummary, finishedGoodsSummary } = calculateSummary();
// console.log('Raw Oil Summary:', rawOilSummary);
console.log('Packaging Summary:', packagingSummary);
// console.log('Finished Goods Summary:', finishedGoodsSummary);
  const getCurrentData = () => {
    switch (activeTab) {
      case 'raw-oil':
        return rawOil;
      case 'packaging':
        // For packaging, show grouped data by packaging type
        const groupedPackaging = packaging.reduce((acc, item) => {
          const key = item.packagingType; // Since skuSize is now packagingType
          if (!acc[key]) {
            acc[key] = {
              _id: key,
              packagingType: key,
              totalPurchased: 0,
              averageRate: 0,
              totalCost: 0,
              itemCount: 0
            };
          }
          acc[key].totalPurchased += item.totalPurchasedQuantity || 0;
          acc[key].totalCost += ((item.totalPurchasedQuantity || 0) * (item.ratePerUnit || 0));
          acc[key].itemCount += 1;
          // Calculate weighted average rate from purchase history
          if (acc[key].totalPurchased > 0) {
            acc[key].averageRate = acc[key].totalCost / acc[key].totalPurchased;
          }
          return acc;
        }, {} as Record<string, any>);
        return Object.values(groupedPackaging);
      case 'finished-goods':
        return finishedGoods;
      default:
        return [];
    }
  };

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'raw-oil':
        return rawOilColumns;
      case 'packaging':
        return [
          { key: 'packagingType', title: 'Packaging Type', sortable: true },
          { key: 'totalPurchased', title: 'Total Purchased', sortable: true, render: (value: number) => value.toLocaleString() },
          { key: 'averageRate', title: 'Average Rate/Unit', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
          { key: 'totalCost', title: 'Total Cost', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
          { key: 'itemCount', title: 'Inventory Items', sortable: true, render: (value: number) => `${value} item${value !== 1 ? 's' : ''}` },
        ];
      case 'finished-goods':
        return finishedGoodsColumns;
      default:
        return [];
    }
  };

  const getSummaryCards = () => {
    switch (activeTab) {
      case 'raw-oil':
        return (
          <div className="inventory-summary">
            <div className="summary-card">
              <h4>Total Quantity</h4>
              <div className="summary-value">{rawOilSummary.totalQuantity.toLocaleString()} L</div>
            </div>
            <div className="summary-card">
              <h4>Total Value</h4>
              <div className="summary-value">₹{rawOilSummary.totalValue.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>Active Batches</h4>
              <div className="summary-value">{rawOilSummary.activeBatches}</div>
            </div>
          </div>
        );
      case 'packaging':
        return (
          <div className="inventory-summary">
            {/* <div className="summary-card">
              <h4>Total Remaining</h4>
              <div className="summary-value">{packagingSummary.totalPurchased.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>Total Inventory Value</h4>
              <div className="summary-value">₹{packagingSummary.totalCost.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>Unique Packaging Types</h4>
              <div className="summary-value">{packagingSummary.totalTypes}</div>
            </div>
            <div className="summary-card">
              <h4>Low Stock Items</h4>
              <div className="summary-value" style={{ color: packagingSummary.lowStockItems > 0 ? '#e74c3c' : '#27ae60' }}>
                {packagingSummary.lowStockItems}
              </div>
            </div> */}
          </div>
        );
      case 'finished-goods':
        return (
          <div className="inventory-summary">
            <div className="summary-card">
              <h4>Total Quantity</h4>
              <div className="summary-value">{finishedGoodsSummary.totalQuantity.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>Total Value</h4>
              <div className="summary-value">₹{finishedGoodsSummary.totalValue.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>Active Batches</h4>
              <div className="summary-value">{finishedGoodsSummary.activeBatches}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Monitor raw materials, packaging, and finished goods inventory</p>
        </div>
        <div className="module-actions">
          <button 
            className="secondary-button"
            onClick={() => {
              dispatch(fetchRawOilInventory());
              dispatch(fetchPackagingInventory());
              dispatch(fetchFinishedGoodsInventory());
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="module-content">
        <div className="filters-section">
          <div className="tab-buttons" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className={activeTab === 'raw-oil' ? 'primary-button' : 'secondary-button'}
              onClick={() => setActiveTab('raw-oil')}
            >
              Raw Oil Inventory
            </button>
            <button
              className={activeTab === 'packaging' ? 'primary-button' : 'secondary-button'}
              onClick={() => setActiveTab('packaging')}
            >
              Packaging Summary
            </button>
            <button
              className={activeTab === 'finished-goods' ? 'primary-button' : 'secondary-button'}
              onClick={() => setActiveTab('finished-goods')}
            >
              Finished Goods
            </button>
          </div>

          {getSummaryCards()}
        </div>

        {activeTab === 'packaging' ? (
          <div className="packaging-cards-grid">
            {packaging?.map((item: any) => (
              <div key={item._id} className="packaging-card">
                <div className="packaging-card-header">
                  <h3>{item.packagingType}</h3>
                </div>
                <div className="packaging-card-body">
                  <div className="packaging-stat">
                 
                    <span className="stat-label">Total Remaining:</span>
                    <span className="stat-value">{item.totalPurchased?.toLocaleString() || 0}</span>
                  </div>
                  <div className="packaging-stat">
                    <span className="stat-label">Avg Rate:</span>
                    <span className="stat-value">₹{item.ratePerUnit?.toFixed(2) || '0.00'}</span>
                  </div>
                  {/* <div className="packaging-stat">
                    <span className="stat-label">Total Value:</span>
                    <span className="stat-value">₹{item.totalCost?.toLocaleString() || '0'}</span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            data={getCurrentData()}
            columns={getCurrentColumns()}
            loading={isLoading}
            rowKey="_id"
          />
        )}
      </div>
    </div>
  );
};

export default Inventory;