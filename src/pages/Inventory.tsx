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
    { key: 'packagingType', title: 'Type', sortable: true },
    { key: 'openingStock', title: 'Opening Stock', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'totalPurchased', title: 'Purchased', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'totalUsed', title: 'Used', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'currentStock', title: 'Current Stock', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'lastUpdated', title: 'Last Updated', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
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

  // Calculate summary statistics
  const calculateSummary = () => {
    const rawOilSummary = {
      totalQuantity: rawOil.reduce((sum, item) => sum + item.currentQuantity, 0),
      totalValue: rawOil.reduce((sum, item) => sum + (item.currentQuantity * item.costPerLiter), 0),
      activeBatches: rawOil.filter(item => item.isActive).length,
    };

    const packagingSummary = {
      totalStock: packaging.reduce((sum, item) => sum + item.currentStock, 0),
      totalTypes: packaging.length,
      lowStockItems: packaging.filter(item => item.currentStock < 100).length,
    };

    const finishedGoodsSummary = {
      totalQuantity: finishedGoods.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: finishedGoods.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
      activeBatches: finishedGoods.filter(item => item.isActive).length,
    };

    return { rawOilSummary, packagingSummary, finishedGoodsSummary };
  };

  const { rawOilSummary, packagingSummary, finishedGoodsSummary } = calculateSummary();

  const getCurrentData = () => {
    switch (activeTab) {
      case 'raw-oil':
        return rawOil;
      case 'packaging':
        return packaging;
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
        return packagingColumns;
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
            <div className="summary-card">
              <h4>Total Stock</h4>
              <div className="summary-value">{packagingSummary.totalStock.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <h4>SKU Types</h4>
              <div className="summary-value">{packagingSummary.totalTypes}</div>
            </div>
            <div className="summary-card">
              <h4>Low Stock Items</h4>
              <div className="summary-value">{packagingSummary.lowStockItems}</div>
            </div>
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
              Packaging Inventory
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

        <DataTable
          data={getCurrentData()}
          columns={getCurrentColumns()}
          loading={isLoading}
          rowKey="_id"
        />
      </div>
    </div>
  );
};

export default Inventory;