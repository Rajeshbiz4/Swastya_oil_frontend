
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import DataTable from '../UI/DataTable';
import ExportButton from '../UI/ExportButton';
import api from '../../services/api';
import '../UI/UI.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MonthlyPnLData {
  period: string;
  revenue: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  costOfGoodsSold: {
    oilCost: number;
    laborCost: number;
    packagingCost: number;
    total: number;
  };
  grossProfit: {
    amount: number;
    margin: number;
  };
  operationalExpenses: {
    totalPurchases: number;
    oilPurchases: number;
    packagingPurchases: number;
  };
  netProfit: {
    amount: number;
    margin: number;
  };
  production: {
    totalBatches: number;
    totalOilConsumed: number;
    totalProduction: number;
  };
}

interface MonthlySummaryData {
  period: string;
  procurement: {
    oilPurchases: {
      totalQuantity: number;
      totalAmount: number;
      averageRate: number;
      transactionCount: number;
    };
    packagingPurchases: {
      totalQuantity: number;
      totalAmount: number;
      averageRate: number;
      transactionCount: number;
    };
  };
  production: {
    totalBatches: number;
    completedBatches: number;
    totalOilConsumed: number;
    totalProductionQuantity: number;
    efficiency: number;
    totalLaborCost: number;
  };
  sales: {
    totalOrders: number;
    totalValue: number;
    totalQuantity: number;
    averageOrderValue: number;
    efficiency: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    grossMargin: number;
    cashTransactions: number;
    creditTransactions: number;
  };
}

interface MonthlyComparisonData {
  currentPeriod: string;
  previousPeriod: string;
  current: {
    totalSales: number;
    totalOrders: number;
    totalPurchases: number;
    totalProduction: number;
    totalBatches: number;
  };
  previous: {
    totalSales: number;
    totalOrders: number;
    totalPurchases: number;
    totalProduction: number;
    totalBatches: number;
  };
  changes: {
    sales: { amount: number; percentage: number };
    orders: { amount: number; percentage: number };
    purchases: { amount: number; percentage: number };
    production: { amount: number; percentage: number };
    batches: { amount: number; percentage: number };
  };
  trends: {
    salesTrend: string;
    productionTrend: string;
    purchasesTrend: string;
  };
}

interface MonthlyReportData {
  pnl?: MonthlyPnLData;
  summary?: MonthlySummaryData;
  comparison?: MonthlyComparisonData;

  rawOilInventory?: any;
  packagingInventory?: any;
  finishedGoodsInventory?: any;
}

interface MonthlyReportsProps {
  onError: (error: string) => void;

  reportType?:
    | 'comprehensive'
    | 'pnl'
    | 'inventory'
    | 'purchases'
    | 'sales'
    | 'production';

  reportData?: any;

  month: number;
  year: number;

  loading?: boolean;

  fromDate: string;
setFromDate: React.Dispatch<React.SetStateAction<string>>;

toDate: string;
setToDate: React.Dispatch<React.SetStateAction<string>>;

oilType: string;
setOilType: React.Dispatch<React.SetStateAction<string>>;

packagingType: string;
setPackagingType: React.Dispatch<React.SetStateAction<string>>;

productType: string;
setProductType: React.Dispatch<React.SetStateAction<string>>;

}


const MonthlyReports: React.FC<MonthlyReportsProps> = ({
  onError,
  reportType: propReportType = 'comprehensive',
  reportData: externalReportData,
  loading: externalLoading,



  month,
  year,

  fromDate,
  setFromDate,

  toDate,
  setToDate,

  oilType,
  setOilType,

  packagingType,
  setPackagingType,

  productType,
  setProductType,
  

}) => {
  
  const [purchaseTab, setPurchaseTab] = useState<"oilf" | "packaging">("oil");
  

  const reportType = propReportType;


  const [reportData, setReportData] = useState<MonthlyReportData | null>(
    externalReportData ?? null
  );

  const [loading, setLoading] = useState(
    externalLoading ?? false
  );
  useEffect(() => {
  setReportData(externalReportData ?? null);
}, [externalReportData]);

useEffect(() => {
  setLoading(externalLoading ?? false);
}, [externalLoading]);


  const [inventoryTab, setInventoryTab] = useState<
    'rawOil' | 'packaging' | 'finishedGoods'
  >('rawOil');


  // rest of your code...

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      onError('');
      
      const reportData: MonthlyReportData = {};
      
      if (reportType === 'pnl') {
        // Fetch P&L report only
        const pnlResponse = await api.get(`/reports/monthly/pnl/${year}/${month}`);
        if (pnlResponse.data.success) {
          reportData.pnl = pnlResponse.data.data;
        }
      } else {
        // Fetch comprehensive report (P&L + Summary + Comparison)
        const [pnlResponse, summaryResponse, comparisonResponse] = await Promise.all([
          api.get(`/reports/monthly/pnl/${year}/${month}`),
          api.get(`/reports/monthly/summary/${year}/${month}`),
          api.get(`/reports/monthly/comparison/${year}/${month}`)
        ]);
        
        if (pnlResponse.data.success) {
          reportData.pnl = pnlResponse.data.data;
        }
        if (summaryResponse.data.success) {
          reportData.summary = summaryResponse.data.data;
        }
        if (comparisonResponse.data.success) {
          reportData.comparison = comparisonResponse.data.data;
        }
      }
      
      setReportData(reportData);
    } catch (err: any) {
      onError(err.response?.data?.error?.message || 'Failed to fetch monthly report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = () => {
    if (!reportData) return [];

    const exportData: any[] = [];

    // Add P&L summary
    if (reportData.pnl) {
      exportData.push({
        Section: 'Profit & Loss Summary',
        'Total Revenue': reportData.pnl.revenue.totalSales || 0,
        'Cost of Goods Sold': reportData.pnl.costOfGoodsSold.total || 0,
        'Gross Profit': reportData.pnl.grossProfit.amount || 0,
        'Gross Profit Margin': `${reportData.pnl.grossProfit.margin?.toFixed(2) || 0}%`,
        'Net Profit': reportData.pnl.netProfit.amount || 0,
        'Net Profit Margin': `${reportData.pnl.netProfit.margin?.toFixed(2) || 0}%`,
      });

      // Add cost breakdown
      exportData.push({
        Section: 'Cost Breakdown',
        'Oil Cost': reportData.pnl.costOfGoodsSold.oilCost || 0,
        'Labor Cost': reportData.pnl.costOfGoodsSold.laborCost || 0,
        'Packaging Cost': reportData.pnl.costOfGoodsSold.packagingCost || 0,
        'Total COGS': reportData.pnl.costOfGoodsSold.total || 0,
      });

      // Add operational expenses
      exportData.push({
        Section: 'Operational Expenses',
        'Oil Purchases': reportData.pnl.operationalExpenses.oilPurchases || 0,
        'Packaging Purchases': reportData.pnl.operationalExpenses.packagingPurchases || 0,
        'Total Purchases': reportData.pnl.operationalExpenses.totalPurchases || 0,
      });
    }

    // Add production summary
    if (reportData.summary) {
      exportData.push({
        Section: 'Production Summary',
        'Total Batches': reportData.summary.production.totalBatches || 0,
        'Completed Batches': reportData.summary.production.completedBatches || 0,
        'Oil Consumed (L)': reportData.summary.production.totalOilConsumed || 0,
        'Total Production': reportData.summary.production.totalProductionQuantity || 0,
        'Production Efficiency': `${reportData.summary.production.efficiency?.toFixed(2) || 0}%`,
        'Total Labor Cost': reportData.summary.production.totalLaborCost || 0,
      });

      // Add procurement summary
      exportData.push({
        Section: 'Procurement Summary',
        'Oil Purchased (L)': reportData.summary.procurement.oilPurchases.totalQuantity || 0,
        'Oil Purchase Amount': reportData.summary.procurement.oilPurchases.totalAmount || 0,
        'Packaging Purchased': reportData.summary.procurement.packagingPurchases.totalQuantity || 0,
        'Packaging Purchase Amount': reportData.summary.procurement.packagingPurchases.totalAmount || 0,
      });

      // Add sales summary
      exportData.push({
        Section: 'Sales Summary',
        'Total Orders': reportData.summary.sales.totalOrders || 0,
        'Total Sales Value': reportData.summary.sales.totalValue || 0,
        'Total Quantity Sold': reportData.summary.sales.totalQuantity || 0,
        'Average Order Value': reportData.summary.sales.averageOrderValue || 0,
        'Sales Efficiency': `${reportData.summary.sales.efficiency?.toFixed(2) || 0}%`,
        'Pending Orders': reportData.summary.sales.pendingOrders || 0,
        'Delivered Orders': reportData.summary.sales.deliveredOrders || 0,
      });
    }

    // Add month-over-month comparison
    if (reportData.comparison) {
      exportData.push({
        Section: 'Month-over-Month Comparison',
        'Current Sales': reportData.comparison.current.totalSales,
        'Previous Sales': reportData.comparison.previous.totalSales,
        'Sales Growth': `${reportData.comparison.changes.sales.percentage?.toFixed(2) || 0}%`,
        'Current Production': reportData.comparison.current.totalProduction,
        'Previous Production': reportData.comparison.previous.totalProduction,
        'Production Growth': `${reportData.comparison.changes.production.percentage?.toFixed(2) || 0}%`,
        'Sales Trend': reportData.comparison.trends.salesTrend,
        'Production Trend': reportData.comparison.trends.productionTrend,
      });
    }

    return exportData;
  };

  const renderSummaryCards = () => {
    if (!reportData?.pnl) return null;

    return (
      <div className="report-summary-cards">
        <div className="report-summary-card">
          <h4>Total Revenue</h4>
          <div className="report-summary-value">
            ₹{reportData.pnl.revenue.totalSales?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
            {reportData.pnl.revenue.totalOrders || 0} orders
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Gross Profit</h4>
          <div className="report-summary-value">
            ₹{reportData.pnl.grossProfit.amount?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
            {reportData.pnl.grossProfit.margin?.toFixed(2) || 0}% margin
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Net Profit</h4>
          <div className="report-summary-value">
            ₹{reportData.pnl.netProfit.amount?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
            {reportData.pnl.netProfit.margin?.toFixed(2) || 0}% margin
          </div>
        </div>
        <div className="report-summary-card">
          <h4>Total Production</h4>
          <div className="report-summary-value">
            {reportData.pnl.production.totalProduction?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
            {reportData.pnl.production.totalBatches || 0} batches
          </div>
        </div>
      </div>
    );
  };

  const renderCostBreakdownChart = () => {
    if (!reportData?.pnl?.costOfGoodsSold) return null;

    const data = {
      labels: ['Oil Cost', 'Labor Cost', 'Packaging Cost'],
      datasets: [
        {
          data: [
            reportData.pnl.costOfGoodsSold.oilCost || 0,
            reportData.pnl.costOfGoodsSold.laborCost || 0,
            reportData.pnl.costOfGoodsSold.packagingCost || 0,
          ],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
          ],
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: 'Cost of Goods Sold Breakdown',
        },
      },
    };

    return (
      <div className="report-section">
        <h3 className="report-section-title">Cost Breakdown</h3>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Pie data={data} options={options} />
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Oil Cost:</strong> ₹{reportData.pnl.costOfGoodsSold.oilCost?.toLocaleString() || 0}</p>
          <p><strong>Labor Cost:</strong> ₹{reportData.pnl.costOfGoodsSold.laborCost?.toLocaleString() || 0}</p>
          <p><strong>Packaging Cost:</strong> ₹{reportData.pnl.costOfGoodsSold.packagingCost?.toLocaleString() || 0}</p>
          <p><strong>Total COGS:</strong> ₹{reportData.pnl.costOfGoodsSold.total?.toLocaleString() || 0}</p>
        </div>
      </div>
    );
  };

  const renderProductionChart = () => {
    if (!reportData?.summary?.production) return null;

    // Create a simple production metrics chart
    const data = {
      labels: ['Total Batches', 'Completed Batches', 'Oil Consumed (L)', 'Production Quantity'],
      datasets: [
        {
          label: 'Production Metrics',
          data: [
            reportData.summary.production.totalBatches,
            reportData.summary.production.completedBatches,
            reportData.summary.production.totalOilConsumed / 1000, // Convert to thousands for better visualization
            reportData.summary.production.totalProductionQuantity / 1000, // Convert to thousands
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Production Analysis',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="report-section">
        <h3 className="report-section-title">Production Analysis</h3>
        <Bar data={data} options={options} />
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Total Batches:</strong> {reportData.summary.production.totalBatches || 0}</p>
          <p><strong>Completed Batches:</strong> {reportData.summary.production.completedBatches || 0}</p>
          <p><strong>Oil Consumed:</strong> {reportData.summary.production.totalOilConsumed?.toLocaleString() || 0} L</p>
          <p><strong>Total Production:</strong> {reportData.summary.production.totalProductionQuantity?.toLocaleString() || 0}</p>
          <p><strong>Efficiency:</strong> {reportData.summary.production.efficiency?.toFixed(2) || 0}%</p>
          <p><strong>Labor Cost:</strong> ₹{reportData.summary.production.totalLaborCost?.toLocaleString() || 0}</p>
        </div>
      </div>
    );
  };

  const renderSalesAnalysis = () => {
    if (!reportData?.summary?.sales) return null;

    const data = {
      labels: ['Total Orders', 'Pending Orders', 'Delivered Orders'],
      datasets: [
        {
          data: [
            reportData.summary.sales.totalOrders,
            reportData.summary.sales.pendingOrders,
            reportData.summary.sales.deliveredOrders,
          ],
          backgroundColor: [
            '#36A2EB',
            '#FF6384',
            '#4BC0C0',
          ],
          hoverBackgroundColor: [
            '#36A2EB',
            '#FF6384',
            '#4BC0C0',
          ],
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: 'Sales Order Status Distribution',
        },
      },
    };

    return (
      <div className="report-section">
        <h3 className="report-section-title">Sales Analysis</h3>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Pie data={data} options={options} />
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Total Orders:</strong> {reportData.summary.sales.totalOrders || 0}</p>
          <p><strong>Total Value:</strong> ₹{reportData.summary.sales.totalValue?.toLocaleString() || 0}</p>
          <p><strong>Total Quantity:</strong> {reportData.summary.sales.totalQuantity?.toLocaleString() || 0}</p>
          <p><strong>Average Order Value:</strong> ₹{reportData.summary.sales.averageOrderValue?.toLocaleString() || 0}</p>
          <p><strong>Sales Efficiency:</strong> {reportData.summary.sales.efficiency?.toFixed(2) || 0}%</p>
        </div>
      </div>
    );
  };

  const renderMonthlyComparison = () => {
    if (!reportData?.comparison) return null;

    const data = {
      labels: ['Sales', 'Production', 'Purchases', 'Orders', 'Batches'],
      datasets: [
        {
          label: 'Current Month',
          data: [
            reportData.comparison.current.totalSales,
            reportData.comparison.current.totalProduction,
            reportData.comparison.current.totalPurchases,
            reportData.comparison.current.totalOrders,
            reportData.comparison.current.totalBatches,
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Previous Month',
          data: [
            reportData.comparison.previous.totalSales,
            reportData.comparison.previous.totalProduction,
            reportData.comparison.previous.totalPurchases,
            reportData.comparison.previous.totalOrders,
            reportData.comparison.previous.totalBatches,
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Month-over-Month Comparison (${reportData.comparison.currentPeriod} vs ${reportData.comparison.previousPeriod})`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="report-section">
        <h3 className="report-section-title">Monthly Comparison</h3>
        <Bar data={data} options={options} />
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Sales Growth:</strong> {reportData.comparison.changes.sales.percentage?.toFixed(2) || 0}% ({reportData.comparison.trends.salesTrend})</p>
          <p><strong>Production Growth:</strong> {reportData.comparison.changes.production.percentage?.toFixed(2) || 0}% ({reportData.comparison.trends.productionTrend})</p>
          <p><strong>Purchase Growth:</strong> {reportData.comparison.changes.purchases.percentage?.toFixed(2) || 0}% ({reportData.comparison.trends.purchasesTrend})</p>
          <p><strong>Order Growth:</strong> {reportData.comparison.changes.orders.percentage?.toFixed(2) || 0}%</p>
          <p><strong>Batch Growth:</strong> {reportData.comparison.changes.batches.percentage?.toFixed(2) || 0}%</p>
        </div>
      </div>
    );
  };

  const renderFinancialSummary = () => {
    if (!reportData?.summary?.financial) return null;

    const data = {
      labels: ['Cash Transactions', 'Credit Transactions'],
      datasets: [
        {
          data: [
            reportData.summary.financial.cashTransactions,
            reportData.summary.financial.creditTransactions,
          ],
          backgroundColor: [
            '#4BC0C0',
            '#FF9F40',
          ],
          hoverBackgroundColor: [
            '#4BC0C0',
            '#FF9F40',
          ],
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: 'Transaction Mode Distribution',
        },
      },
    };

    return (
      <div className="report-section">
        <h3 className="report-section-title">Financial Summary</h3>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Pie data={data} options={options} />
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <p><strong>Total Revenue:</strong> ₹{reportData.summary.financial.totalRevenue?.toLocaleString() || 0}</p>
          <p><strong>Total Expenses:</strong> ₹{reportData.summary.financial.totalExpenses?.toLocaleString() || 0}</p>
          <p><strong>Gross Margin:</strong> ₹{reportData.summary.financial.grossMargin?.toLocaleString() || 0}</p>
          <p><strong>Cash Transactions:</strong> {reportData.summary.financial.cashTransactions || 0}</p>
          <p><strong>Credit Transactions:</strong> {reportData.summary.financial.creditTransactions || 0}</p>
        </div>
      </div>
    );
  };

const renderInventorySection = () => {
  switch (inventoryTab) {
    case 'rawOil':
      return (
        <DataTable
          columns={[
            { key: 'oilType', title: 'Oil Type' },
            { key: 'openingStock', title: 'Opening Stock' },
            { key: 'purchased', title: 'Purchased Qty' },
            { key: 'consumed', title: 'Consumed Qty' },
            { key: 'available', title: 'Available Stock' },
          ]}
          data={
  reportData?.rawOilInventory?.inventory?.map((item: any) => ({
    oilType: item.oilType,
    openingStock: item.openingStock ?? 0,
    purchased: item.purchased ?? 0,
    consumed: item.consumed ?? 0,
    available: item.currentQuantity ?? 0,
  })) || []
}

        />
      );

    case 'packaging':
      return (
        <DataTable
          columns={[
            { key: 'packagingType', title: 'Packaging Type' },
            { key: 'openingStock', title: 'Opening Stock' },
            { key: 'purchased', title: 'Purchased Qty' },
            { key: 'consumed', title: 'Consumed Qty' },
            { key: 'available', title: 'Available Stock' },
          ]}
         data={
  reportData?.packagingInventory?.inventory?.map((item: any) => ({
    packagingType: item.packagingType || item.name,
    openingStock: item.openingStock ?? 0,
    purchased: item.purchased ?? 0,
    consumed: item.consumed ?? 0,
    available: item.available ?? item.quantity ?? 0,
  })) || []
}

        />
      );

    case 'finishedGoods':
      return (
        <DataTable
          columns={[
            { key: 'product', title: 'Product' },
            { key: 'openingStock', title: 'Opening Stock' },
            { key: 'produced', title: 'Produced Qty' },
            { key: 'sold', title: 'Sold Qty' },
            { key: 'available', title: 'Available Stock' },
          ]}
           data={
  reportData?.finishedGoodsInventory?.inventory?.map((item: any) => ({
    
    //product: item.productName || item.batchNumber,
    product:
  item.productName ||
  item.product?.name ||
  item.product ||
  item.name ||
  item.finishedGoodName ||
  item.oilType ||
  item.batchNumber ||
  "-",
  
    openingStock: item.openingStock ?? 0,
    produced: item.produced ?? 0,
    sold: item.sold ?? 0,
    available: item.available ?? item.quantity ?? 0,
  })) || []
}

        />
      );

    default:
      return null;
  }
};


  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div>
      {/* Filters */}
      
            
      {/* Report Content */}
      {loading ? (
        <div className="report-loading">
          <div className="loading-spinner"></div>
          <p>Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="report-content">
          <div className="report-header">

  <h2 className="report-title">
  Monthly Report - {getMonthName(month)} {year}
  </h2>

  <div className="inventory-report-filters">

    <div className="filter-item">
      <label>From Date</label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
      />
    </div>

    <div className="filter-item">
      <label>To Date</label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
      />
    </div>

    {reportType === "inventory" && inventoryTab === "rawOil" && (
      <div className="filter-item">
        <label>Oil Type</label>
        <select
          value={oilType}
          onChange={(e) => setOilType(e.target.value)}
        >
          <option value="">All</option>
          <option value="SOYABEAN_OIL">Soyabean Oil</option>
          <option value="GROUNDNUT_OIL">Groundnut Oil</option>
          <option value="SUNFLOWER_OIL">Sunflower Oil</option>
        </select>
      </div>
    )}

    {reportType === "production" && (
      <div className="filter-item">
        <label>Oil Type</label>
        <select
          value={oilType}
          onChange={(e) => setOilType(e.target.value)}
        >
          <option value="">All</option>
          <option value="SOYABEAN_OIL">Soyabean Oil</option>
          <option value="GROUNDNUT_OIL">Groundnut Oil</option>
          <option value="SUNFLOWER_OIL">Sunflower Oil</option>
        </select>
      </div>
    )}

  </div>

</div>


          {reportType === 'inventory' && (
  <div
    style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    }}
  >
    <button
      className={inventoryTab === 'rawOil' ? 'btn-primary' : 'btn-secondary'}
      onClick={() => setInventoryTab('rawOil')}
    >
      Raw Oil
    </button>

    <button
      className={inventoryTab === 'packaging' ? 'btn-primary' : 'btn-secondary'}
      onClick={() => setInventoryTab('packaging')}
    >
      Packaging Material
    </button>

    <button
      className={inventoryTab === 'finishedGoods' ? 'btn-primary' : 'btn-secondary'}
      onClick={() => setInventoryTab('finishedGoods')}
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


 {reportType === 'inventory' && renderInventorySection()}

  {reportType === "production" && (
  <DataTable
    columns={[
      { key: "batchNumber", title: "Batch Number" },
      { key: "productType", title: "Product Type" },
      { key: "rawOilUsed", title: "Raw Oil Used" },
      { key: "packagingUsed", title: "Packaging Used" },
      { key: "finishedQuantity", title: "Finished Quantity" },
    ]}
    data={reportData || []}
  />
)}

{reportType === "sales" && (

  reportData && reportData.length > 0 ? (

    <DataTable
      columns={[
        { key: "orderNumber", title: "Order Number" },
        { key: "customerName", title: "Customer" },
        { key: "orderDate", title: "Order Date" },
        { key: "totalAmount", title: "Amount" },
        { key: "status", title: "Status" },
      ]}
      data={reportData}
    />

  ) : (

    <div
      style={{
        textAlign: "center",
        padding: "40px",
        fontSize: "22px",
        fontWeight: "bold",
        color: "#888",
      }}
    >
      No Data Available
    </div>

  )

)}


{reportType === "purchases" && (
  <DataTable
    columns={
      purchaseTab === "oil"
        ? [
            { key: "supplierName", title: "Supplier" },
            { key: "oilType", title: "Oil Type" },
            { key: "quantity", title: "Quantity" },
            { key: "ratePerLiter", title: "Rate/Liter" },
            { key: "totalAmount", title: "Total Amount" },
          ]
        : [
            { key: "supplierName", title: "Supplier" },
            { key: "packagingType", title: "Packaging" },
            { key: "quantity", title: "Quantity" },
            { key: "ratePerUnit", title: "Rate" },
            { key: "totalAmount", title: "Total Amount" },
          ]
    }
    data={
      purchaseTab === "oil"
        ? reportData?.oilPurchases?.purchases || []
        : reportData?.packagingPurchases?.purchases || []
    }
  />
)}


{reportType === "comprehensive" && reportData && (

<div>

    <h3>Revenue</h3>

    <table className="report-table">
        <tbody>
            <tr>
                <td>Total Sales</td>
                <td>{reportData.revenue?.totalSales}</td>
            </tr>

            <tr>
                <td>Total Orders</td>
                <td>{reportData.revenue?.totalOrders}</td>
            </tr>

            <tr>
                <td>Average Order Value</td>
                <td>{reportData.revenue?.averageOrderValue}</td>
            </tr>
        </tbody>
    </table>

    <h3>Cost Of Goods Sold</h3>

    <table className="report-table">
        <tbody>
            <tr>
                <td>Oil Cost</td>
                <td>{reportData.costOfGoodsSold?.oilCost}</td>
            </tr>

            <tr>
                <td>Labor Cost</td>
                <td>{reportData.costOfGoodsSold?.laborCost}</td>
            </tr>

            <tr>
                <td>Packaging Cost</td>
                <td>{reportData.costOfGoodsSold?.packagingCost}</td>
            </tr>

            <tr>
                <td>Total</td>
                <td>{reportData.costOfGoodsSold?.total}</td>
            </tr>
        </tbody>
    </table>

    <h3>Gross Profit</h3>

    <table className="report-table">
        <tbody>

            <tr>
                <td>Amount</td>
                <td>{reportData.grossProfit?.amount}</td>
            </tr>

            <tr>
                <td>Margin</td>
                <td>{reportData.grossProfit?.margin}%</td>
            </tr>

        </tbody>
    </table>

    <h3>Operational Expenses</h3>

    <table className="report-table">
        <tbody>

            <tr>
                <td>Total Purchases</td>
                <td>{reportData.operationalExpenses?.totalPurchases}</td>
            </tr>

            <tr>
                <td>Oil Purchases</td>
                <td>{reportData.operationalExpenses?.oilPurchases}</td>
            </tr>

            <tr>
                <td>Packaging Purchases</td>
                <td>{reportData.operationalExpenses?.packagingPurchases}</td>
            </tr>

        </tbody>
    </table>

    <h3>Net Profit</h3>

    <table className="report-table">
        <tbody>

            <tr>
                <td>Amount</td>
                <td>{reportData.netProfit?.amount}</td>
            </tr>

            <tr>
                <td>Margin</td>
                <td>{reportData.netProfit?.margin}%</td>
            </tr>

        </tbody>
    </table>

    <h3>Production</h3>

    <table className="report-table">
        <tbody>

            <tr>
                <td>Total Batches</td>
                <td>{reportData.production?.totalBatches}</td>
            </tr>

            <tr>
                <td>Total Oil Consumed</td>
                <td>{reportData.production?.totalOilConsumed}</td>
            </tr>

            <tr>
                <td>Total Production</td>
                <td>{reportData.production?.totalProduction}</td>
            </tr>

        </tbody>
    </table>

</div>

)}

        </div>
      ) : (
        <div className="report-no-data">
          <h3>No Report Generated</h3>
          <p>Select your filters and click "Generate Report".</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReports;