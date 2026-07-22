import React, { useEffect, useState } from 'react';
import DataTable from '../UI/DataTable';
import ExportButton from '../UI/ExportButton';
import api from '../../services/api';
import '../UI/UI.css';

interface DailyReportData {
  summary?: {
    totalPurchaseAmount: number;
    totalSalesAmount: number;
    totalInventoryValue: number;
    totalProductionBatches: number;
  };
  purchases?: {
    oilPurchases: {
      purchases: any[];
      totalAmount: number;
    };
    packagingPurchases: {
      purchases: any[];
      totalAmount: number;
    };
    grandTotal: {
      totalAmount: number;
    };
  };
  sales?: {
    orders: any[];
    totals: {
      totalOrders: number;
      totalAmount: number;
      deliveredOrders: number;
    };
  };
  inventory?: {
    rawOil: any[];
    packaging: any[];
    finishedGoods: any[];
  };
  production?: {
    batches: any[];
    totals: {
      totalBatches: number;
      completedBatches: number;
      totalOilConsumed: number;
    };
  };
}

interface DailyReportsProps {
  onError: (error: string) => void;
  reportType?: 'comprehensive' | 'purchases' | 'sales' | 'inventory' | 'production';
  selectedDate?: string;
  reportData?: DailyReportData | null;
}


//const DailyReports: React.FC<DailyReportsProps> = ({ onError, reportType: propReportType = 'comprehensive', selectedDate: propSelectedDate }) => {
const DailyReports: React.FC<DailyReportsProps> = ({
    onError,
    reportType: propReportType = 'comprehensive',
    selectedDate: propSelectedDate,
    reportData
}) => {
    
const reportType = propReportType;
  const selectedDate = propSelectedDate;
  //const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const [inventoryTab, setInventoryTab] = useState<
    "rawOil" | "packaging" | "finishedGoods"
    >("rawOil");

    
  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      onError('');
      
      let endpoint = '';
      switch (reportType) {
        case 'purchases':
          endpoint = `/reports/daily/purchases/${selectedDate}`;
          break;
        case 'sales':
          endpoint = `/reports/daily/sales/${selectedDate}`;
          break;
        case 'inventory':
          endpoint = `/reports/daily/inventory/${selectedDate}`;
          break;
        case 'production':
          endpoint = `/reports/daily/production/${selectedDate}`;
          break;
        case 'comprehensive':
          endpoint = `/reports/daily/${selectedDate}`;
          break;
      }
      
      const response = await api.get(endpoint);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (err: any) {
      onError(err.response?.data?.error?.message || 'Failed to fetch daily report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  /*useEffect(() => {
  fetchDailyReport();
}, [selectedDate, reportType]);
*/


  const getExportData = () => {
    if (!reportData) return [];

    const exportData: any[] = [];

    // Add summary data
    if (reportData.summary) {
      exportData.push({
        Section: 'Summary',
        'Total Purchase Amount': reportData.summary.totalPurchaseAmount || 0,
        'Total Sales Amount': reportData.summary.totalSalesAmount || 0,
        'Total Inventory Value': reportData.summary.totalInventoryValue || 0,
        'Total Production Batches': reportData.summary.totalProductionBatches || 0,
      });
    }

    // Add purchases data
    if (reportData.purchases) {
      reportData.purchases.oilPurchases.purchases?.forEach((purchase, index) => {
        exportData.push({
          Section: 'Oil Purchases',
          Index: index + 1,
          Supplier: purchase.supplierName,
          Quantity: purchase.quantity,
          'Rate Per Liter': purchase.ratePerLiter,
          'Total Amount': purchase.totalAmount,
          'Payment Mode': purchase.paymentMode,
          'Invoice Date': purchase.invoiceDate,
        });
      });

      reportData.purchases.packagingPurchases.purchases?.forEach((purchase, index) => {
        exportData.push({
          Section: 'Packaging Purchases',
          Index: index + 1,
          Supplier: purchase.supplierName,
          'SKU Size': purchase.skuSize,
          'Packaging Type': purchase.packagingType,
          Quantity: purchase.quantity,
          'Rate Per Unit': purchase.ratePerUnit,
          'Total Amount': purchase.totalAmount,
          'Payment Mode': purchase.paymentMode,
        });
      });
    }

    // Add sales data
    if (reportData.sales) {
      reportData.sales.orders?.forEach((order, index) => {
        exportData.push({
          Section: 'Sales Orders',
          Index: index + 1,
          'Order Number': order.orderNumber,
          Distributor: order.distributorName,
          'Total Amount': order.totalAmount,
          'Payment Mode': order.paymentMode,
          Status: order.status,
          'Order Date': order.orderDate,
        });
      });
    }

    // Add production data
    if (reportData.production) {
      reportData.production.batches?.forEach((batch, index) => {
        exportData.push({
          Section: 'Production Batches',
          Index: index + 1,
          'Batch Number': batch.batchNumber,
          'Production Date': batch.productionDate,
          'Oil Consumed': batch.totalOilConsumed,
          'Total Labor Cost': batch.totalLaborCost,
          Status: batch.status,
        });
      });
    }

    return exportData;
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;

    return (
      <div className="report-summary-cards">
        <div className="report-summary-card">
          <h4>Total Purchases</h4>
          <div className="report-summary-value">
            ₹{reportData.summary.totalPurchaseAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Total Sales</h4>
          <div className="report-summary-value">
            ₹{reportData.summary.totalSalesAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Inventory Value</h4>
          <div className="report-summary-value">
            ₹{reportData.summary.totalInventoryValue?.toLocaleString() || 0}
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Production Batches</h4>
          <div className="report-summary-value">
            {reportData.summary.totalProductionBatches || 0}
          </div>
        </div>
      </div>
    );
  };

  const renderPurchasesSection = () => {
    if (!reportData?.purchases) return null;

    const oilColumns = [
      { key: 'supplierName', title: 'Supplier', sortable: true },
      { key: 'quantity', title: 'Quantity (L)', sortable: true },
      { key: 'ratePerLiter', title: 'Rate/L', sortable: true },
      { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value?.toLocaleString()}` },
      { key: 'paymentMode', title: 'Payment Mode', sortable: true },
      { key: 'invoiceDate', title: 'Invoice Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    ];

    const packagingColumns = [
      { key: 'supplierName', title: 'Supplier', sortable: true },
      { key: 'skuSize', title: 'SKU Size', sortable: true },
      { key: 'packagingType', title: 'Type', sortable: true },
      { key: 'quantity', title: 'Quantity', sortable: true },
      { key: 'ratePerUnit', title: 'Rate/Unit', sortable: true },
      { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value?.toLocaleString()}` },
      { key: 'paymentMode', title: 'Payment Mode', sortable: true },
    ];

    return (
      <div className="report-section">
        <h3 className="report-section-title">Purchases</h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4>Oil Purchases</h4>
          <DataTable
            data={reportData.purchases.oilPurchases.purchases || []}
            columns={oilColumns}
            loading={loading}
          />
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
            Total: ₹{reportData.purchases.oilPurchases.totalAmount?.toLocaleString() || 0}
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4>Packaging Purchases</h4>
          <DataTable
            data={reportData.purchases.packagingPurchases.purchases || []}
            columns={packagingColumns}
            loading={loading}
          />
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
            Total: ₹{reportData.purchases.packagingPurchases.totalAmount?.toLocaleString() || 0}
          </p>
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'right' }}>
          Grand Total: ₹{reportData.purchases.grandTotal?.totalAmount?.toLocaleString() || 0}
        </div>
      </div>
    );
  };

  const renderSalesSection = () => {
    if (!reportData?.sales) return null;

    const columns = [
      { key: 'orderNumber', title: 'Order Number', sortable: true },
      { key: 'distributorName', title: 'Distributor', sortable: true },
      { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value?.toLocaleString()}` },
      { key: 'paymentMode', title: 'Payment Mode', sortable: true },
      { key: 'status', title: 'Status', sortable: true },
      { key: 'orderDate', title: 'Order Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    ];

    return (
      <div className="report-section">
        <h3 className="report-section-title">Sales Orders</h3>
        <DataTable
          data={reportData.sales.orders || []}
          columns={columns}
          loading={loading}
        />
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Total Orders:</strong> {reportData.sales.totals?.totalOrders || 0}</p>
          <p><strong>Total Amount:</strong> ₹{reportData.sales.totals?.totalAmount?.toLocaleString() || 0}</p>
          <p><strong>Delivered Orders:</strong> {reportData.sales.totals?.deliveredOrders || 0}</p>
        </div>
      </div>
    );
  };

  const renderProductionSection = () => {
    if (!reportData?.production) return null;

    const columns = [
      { key: 'batchNumber', title: 'Batch Number', sortable: true },
      { key: 'productionDate', title: 'Production Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
      { key: 'totalOilConsumed', title: 'Oil Consumed (L)', sortable: true },
      { key: 'totalLaborCost', title: 'Labor Cost', sortable: true, render: (value: number) => `₹${value?.toLocaleString()}` },
      { key: 'status', title: 'Status', sortable: true },
    ];

    return (
      <div className="report-section">
        <h3 className="report-section-title">Production Batches</h3>
        <DataTable
          data={reportData.production.batches || []}
          columns={columns}
          loading={loading}
        />
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Total Batches:</strong> {reportData.production.totals?.totalBatches || 0}</p>
          <p><strong>Completed Batches:</strong> {reportData.production.totals?.completedBatches || 0}</p>
          <p><strong>Oil Consumed:</strong> {reportData.production.totals?.totalOilConsumed?.toLocaleString() || 0} L</p>
        </div>
      </div>
    );
  };

  /*const renderInventorySection = () => {
    if (!reportData?.inventory) return null;

    const rawOilColumns = [
      { key: 'batchNumber', title: 'Batch Number', sortable: true },
      { key: 'currentQuantity', title: 'Current Quantity (L)', sortable: true },
      { key: 'costPerLiter', title: 'Cost/L', sortable: true, render: (value: number) => `₹${value?.toFixed(2)}` },
      { key: 'purchaseDate', title: 'Purchase Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    ];

    const packagingColumns = [
      { key: 'packagingType', title: 'Packaging Type', sortable: true },
      { key: 'quantity', title: 'Quantity', sortable: true, render: (value: number) => value.toLocaleString() },
      { key: 'ratePerUnit', title: 'Rate/Unit', sortable: true, render: (value: number) => `₹${value?.toFixed(2)}` },
    ];

    const finishedGoodsColumns = [
      { key: 'skuSize', title: 'SKU Size', sortable: true },
      { key: 'packagingType', title: 'Type', sortable: true },
      { key: 'quantity', title: 'Quantity', sortable: true },
      { key: 'unitCost', title: 'Unit Cost', sortable: true, render: (value: number) => `₹${value?.toFixed(2)}` },
      { key: 'productionDate', title: 'Production Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    ];

    return (
      <div className="report-section">
        <h3 className="report-section-title">Inventory Status</h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4>Raw Oil Inventory</h4>
          <DataTable
            data={reportData.inventory.rawOil || []}
            columns={rawOilColumns}
            loading={loading}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4>Packaging Inventory</h4>
          <DataTable
            data={reportData.inventory.packaging || []}
            columns={packagingColumns}
            loading={loading}
          />
        </div>

        <div>
          <h4>Finished Goods Inventory</h4>
          <DataTable
            data={reportData.inventory.finishedGoods || []}
            columns={finishedGoodsColumns}
            loading={loading}
          />
        </div>
      </div>
    );
  }; */ 

  const renderInventorySection = () => {
  if (!reportData?.inventory) return null;

  const rawOilColumns = [
    { key: 'batchNumber', title: 'Batch Number', sortable: true },
    { key: 'currentQuantity', title: 'Current Quantity (L)', sortable: true },
    {
      key: 'costPerLiter',
      title: 'Cost/L',
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2)}`
    },
    {
      key: 'purchaseDate',
      title: 'Purchase Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  const packagingColumns = [
    { key: 'packagingType', title: 'Packaging Type', sortable: true },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (value: number) => value?.toLocaleString()
    },
    {
      key: 'ratePerUnit',
      title: 'Rate/Unit',
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2)}`
    },
  ];

  const finishedGoodsColumns = [
    { key: 'skuSize', title: 'SKU Size', sortable: true },
    { key: 'packagingType', title: 'Type', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true },
    {
      key: 'unitCost',
      title: 'Unit Cost',
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2)}`
    },
    {
      key: 'productionDate',
      title: 'Production Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  return (
    <div className="report-section">
      <h3 className="report-section-title">Inventory Status</h3>

      <div className="inventory-tabs">
        <button
          className={inventoryTab === 'rawOil' ? 'active' : ''}
          onClick={() => setInventoryTab('rawOil')}
        >
          Raw Oil
        </button>

        <button
          className={inventoryTab === 'packaging' ? 'active' : ''}
          onClick={() => setInventoryTab('packaging')}
        >
          Packaging Material
        </button>

        <button
          className={inventoryTab === 'finishedGoods' ? 'active' : ''}
          onClick={() => setInventoryTab('finishedGoods')}
        >
          Finished Goods
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {inventoryTab === 'rawOil' && (
          <>
            <h4>Raw Oil Inventory</h4>
            <DataTable
              data={reportData.inventory.rawOil || []}
              columns={rawOilColumns}
              loading={loading}
            />
          </>
        )}

        {inventoryTab === 'packaging' && (
          <>
            <h4>Packaging Material Inventory</h4>
            <DataTable
              data={reportData.inventory.packaging || []}
              columns={packagingColumns}
              loading={loading}
            />
          </>
        )}

        {inventoryTab === 'finishedGoods' && (
          <>
            <h4>Finished Goods Inventory</h4>
            <DataTable
              data={reportData.inventory.finishedGoods || []}
              columns={finishedGoodsColumns}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

  return (
    <div>
      {/* Filters */}
      <div className="report-filters">
        <div className="report-filters-header">
          <h3 className="report-filters-title">Daily Report Filters</h3>
           
        </div>
        
        <div className="report-filters-content">
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="report-loading">
          <div className="loading-spinner"></div>
          <p>Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="report-content">
          <div className="report-header">
            <h2 className="report-title">Daily Report - {new Date(selectedDate).toLocaleDateString()}</h2>
            <ExportButton
              data={getExportData()}
              filename={`daily-report-${selectedDate}`}
              title={`Daily Report - ${selectedDate}`}
            />
          </div>

          {reportType === 'comprehensive' && renderSummaryCards()}
          
          <div className="report-sections">
            {(reportType === 'comprehensive' || reportType === 'purchases') && renderPurchasesSection()}
            {(reportType === 'comprehensive' || reportType === 'sales') && renderSalesSection()}
            {(reportType === 'comprehensive' || reportType === 'production') && renderProductionSection()}
            {(reportType === 'comprehensive' || reportType === 'inventory') && renderInventorySection()}
          </div>
        </div>
      ) : (
        <div className="report-no-data">
          <h3>No Report Generated</h3>
          <p>Select your filters and click "Generate Report" to view daily report data.</p>
        </div>
      )}
    </div>
  );
};

export default DailyReports;