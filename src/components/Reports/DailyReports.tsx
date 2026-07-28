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
 oilPurchases?: {
    purchases: any[];
    totals: any;
};

packagingPurchases?: {
    purchases: any[];
    totals: any;
    breakdown?: any;
};

grandTotal?: any;

  sales?: {
    orders: any[];
    totals: {
      totalOrders: number;
      totalAmount: number;
      deliveredOrders: number;
    };
  };
  rawOilInventory?: {
  inventory: any[];
  totals: any;
};

packagingInventory?: {
  inventory: any[];
  totals: any;
};

finishedGoodsInventory?: {
  inventory: any[];
  totals: any;
};

grandTotals?: any;

  production?: any[];
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
  const [purchaseTab, setPurchaseTab] = useState<
  "oil" | "packaging"
  >("oil");
    
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
    if (reportData.oilPurchases || reportData.packagingPurchases) {
     reportData.oilPurchases.purchases?.forEach((purchase, index) => {
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

      reportData.packagingPurchases.purchases?.forEach((purchase, index) => {
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

const oilData = reportData?.oilPurchases?.purchases || [];
const packagingData = reportData?.packagingPurchases?.purchases || [];

console.log("Oil Data:", oilData);
console.log("Packaging Data:", packagingData);

 const renderPurchasesSection = () => {
    if (!reportData?.oilPurchases) return null;

    return (
        <div className="report-table-wrapper">
            <DataTable
                columns={
                    purchaseTab === "oil"
                        ? [
                              {
                                  key: "supplierName",
                                  title: "Supplier",
                              },
                              {
                                  key: "oilType",
                                  title: "Oil Type",
                              },
                              {
                                  key: "quantity",
                                  title: "Quantity",
                              },
                              {
                                  key: "ratePerLiter",
                                  title: "Rate/Liter",
                                  render: (value: number) =>
                                      `₹${value?.toLocaleString()}`,
                              },
                              {
                                  key: "totalAmount",
                                  title: "Total Amount",
                                  render: (value: number) =>
                                      `₹${value?.toLocaleString()}`,
                              },
                          ]
                        : [
                              {
                                  key: "supplierName",
                                  title: "Supplier",
                              },
                              {
                                  key: "packagingType",
                                  title: "Packaging",
                              },
                              {
                                  key: "quantity",
                                  title: "Quantity",
                              },
                              {
                                  key: "ratePerUnit",
                                  title: "Rate",
                                  render: (value: number) =>
                                      `₹${value?.toLocaleString()}`,
                              },
                              {
                                  key: "totalAmount",
                                  title: "Total Amount",
                                  render: (value: number) =>
                                      `₹${value?.toLocaleString()}`,
                              },
                          ]
                }

                
                data={purchaseTab === "oil" ? oilData : packagingData}

                loading={loading}
            />
        </div>
    );
};

const renderComprehensiveSection = () => {
  if (!reportData) return null;

 return (
  <div className="daily-summary-grid">

    <div className="daily-summary-card">
      <h3>Revenue</h3>

      <div className="daily-summary-row">
        <span>Total Sales</span>
        <strong>₹{reportData.sales?.totals?.totalAmount || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Total Orders</span>
        <strong>{reportData.sales?.totals?.totalOrders || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Delivered Orders</span>
        <strong>{reportData.sales?.totals?.deliveredOrders || 0}</strong>
      </div>
    </div>

    <div className="daily-summary-card">
      <h3>Purchases</h3>

      <div className="daily-summary-row">
        <span>Oil Purchases</span>
        <strong>{reportData.purchases?.oilPurchases?.purchases?.length || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Packaging Purchases</span>
        <strong>{reportData.purchases?.packagingPurchases?.purchases?.length || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Total Purchase</span>
        <strong>₹{reportData.purchases?.grandTotal?.totalAmount || 0}</strong>
      </div>
    </div>

    <div className="daily-summary-card">
      <h3>Inventory</h3>

      <div className="daily-summary-row">
        <span>Raw Oil</span>
        <strong>{reportData.inventory?.rawOilInventory?.inventory?.length || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Packaging</span>
        <strong>{reportData.inventory?.packagingInventory?.inventory?.length || 0}</strong>
      </div>

      <div className="daily-summary-row">
        <span>Finished Goods</span>
        <strong>{reportData.inventory?.finishedGoodsInventory?.inventory?.length || 0}</strong>
      </div>
    </div>

    <div className="daily-summary-card">
      <h3>Production</h3>

      <div className="daily-summary-row">
        <span>Total Batches</span>
        <strong>{reportData.production?.totals?.totalBatches || 0}</strong>
      </div>
    </div>

<div className="daily-summary-card">
  <h3>Sales</h3>

  <div className="daily-summary-row">
    <span>Total Orders</span>
    <strong>{reportData.sales?.totals?.totalOrders || 0}</strong>
  </div>

  <div className="daily-summary-row">
    <span>Delivered Orders</span>
    <strong>{reportData.sales?.totals?.deliveredOrders || 0}</strong>
  </div>

  <div className="daily-summary-row">
    <span>Total Sales</span>
    <strong>₹{reportData.sales?.totals?.totalAmount || 0}</strong>
  </div>
</div>

<div className="daily-summary-card">
  <h3>Summary</h3>

  <div className="daily-summary-row">
    <span>Purchase Amount</span>
    <strong>₹{reportData.summary?.totalPurchaseAmount || 0}</strong>
  </div>

  <div className="daily-summary-row">
    <span>Inventory Value</span>
    <strong>₹{reportData.summary?.totalInventoryValue || 0}</strong>
  </div>

  <div className="daily-summary-row">
    <span>Production Batches</span>
    <strong>{reportData.summary?.totalProductionBatches || 0}</strong>
  </div>
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
  const productionData = reportData?.production || [];

  const columns = [
    { key: "batchNumber", title: "Batch Number" },
    { key: "productType", title: "Product Type" },
    { key: "rawOilUsed", title: "Raw Oil Used" },
    { key: "packagingUsed", title: "Packaging Used" },
    { key: "finishedQuantity", title: "Finished Quantity" },
  ];

  return (
    <DataTable
      data={productionData}
      columns={columns}
      loading={loading}
    />
  );
};

  const renderInventorySection = () => {
  if (!reportData) return null;

  const rawOilData =
  reportData?.rawOilInventory?.inventory || [];

const packagingData =
  reportData?.packagingInventory?.inventory || [];

const finishedGoodsData =
  reportData?.finishedGoodsInventory?.inventory || [];


 const rawOilColumns = [
  { key: "oilType", title: "Oil Type" },
  { key: "initialQuantity", title: "Opening Stock" },
  { key: "totalOilPurchases", title: "Purchased Qty" },
  { key: "currentQuantity", title: "Available Stock" }
];



const packagingColumns = [
  { key: "packagingType", title: "Packaging Type" },
  { key: "openingStock", title: "Opening Stock" },
  { key: "totalPurchased", title: "Purchased Qty" },
  { key: "totalUsed", title: "Consumed Qty" },
  { key: "currentStock", title: "Available Stock" }
];


  const finishedGoodsColumns = [
  { key: "product", title: "Product" },
  { key: "openingStock", title: "Opening Stock" },
  { key: "produced", title: "Produced Qty" },
  { key: "sold", title: "Sold Qty" },
  { key: "available", title: "Available Stock" },
];



 return (
  <div className="report-section">

    {/* Tabs Card */}

  {inventoryTab === "rawOil" && (
    <DataTable
      data={rawOilData}
      columns={rawOilColumns}
      loading={loading}
    />
  )}

  {inventoryTab === "packaging" && (
    <DataTable
      data={packagingData}
      columns={packagingColumns}
      loading={loading}
    />
  )}

  {inventoryTab === "finishedGoods" && (
    <DataTable
      data={finishedGoodsData}
      columns={finishedGoodsColumns}
      loading={loading}
    />
  )}

 

  </div>
);
};

return (
  <div>
    {/* Filters */}
    <div className="report-content">

     <div className="report-header">
  <h2 className="report-title">
          Daily Report -{" "}
          {new Date(selectedDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h2>
      </div>

{reportType === "inventory" && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    }}
  >
    <button
      className={inventoryTab === "rawOil" ? "btn-primary" : "btn-secondary"}
      onClick={() => setInventoryTab("rawOil")}
    >
      Raw Oil
    </button>

    <button
      className={inventoryTab === "packaging" ? "btn-primary" : "btn-secondary"}
      onClick={() => setInventoryTab("packaging")}
    >
      Packaging Material
    </button>

    <button
      className={inventoryTab === "finishedGoods" ? "btn-primary" : "btn-secondary"}
      onClick={() => setInventoryTab("finishedGoods")}
    >
      Finished Goods
    </button>
  </div>
)}

   {reportType === "purchases" && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    }}
  >
  <button
    className={purchaseTab === "oil" ? "btn-primary" : "btn-secondary"}
    onClick={() => setPurchaseTab("oil")}
  >
    Oil Purchases
  </button>

  <button
    className={purchaseTab === "packaging" ? "btn-primary" : "btn-secondary"}
    onClick={() => setPurchaseTab("packaging")}
  >
    Packaging Purchases
  </button>
 

  </div>
)}
      {/* Table */}
      <div className="report-filters-content">
        {loading ? (
          <div className="report-loading">
            <div className="loading-spinner"></div>
            <p>Generating report...</p>
          </div>
        ) : reportData ? (
      <>
  {reportType === "comprehensive" && renderComprehensiveSection()}

  {reportType === "purchases" && renderPurchasesSection()}

  {reportType === "inventory" && renderInventorySection()}

  {reportType === "production" && renderProductionSection()}

  {reportType === "sales" && renderSalesSection()}
</>

        ) : (
          <div className="report-no-data">
            <h3>No Report Generated</h3>
            <p>
              Select your filters and click "Generate Report" to view daily
              report data.
            </p>
          </div>
        )}
      </div>

    </div>
  </div>
);

};

export default DailyReports;