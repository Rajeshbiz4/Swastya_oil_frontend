import { reportsAPI } from "../services/api";
import api from "../services/api";
import React, { useState, useEffect } from 'react';
import DailyReports from '../components/Reports/DailyReports';
import MonthlyReports from '../components/Reports/MonthlyReports';
import './Pages.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const Reports: React.FC = () => {
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'monthly'>('daily');

  const [dailyReportData, setDailyReportData] = useState<any>(null);

  const [reportType, setReportType] = useState<
    'comprehensive' | 'purchases' | 'sales' | 'inventory' | 'production'
  >('comprehensive');

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split("T")[0]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [oilType, setOilType] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [productType, setProductType] = useState("");


  const [reportData, setReportData] = useState<any>(null);
  //const [dailyReportData, setDailyReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const generateReport = async () => {
  if (reportfrequency === "daily") {
    await generateDailyReport();
  } else {
    await generateMonthlyReport();
  }
};

const handleGenerateReport = async () => {
  try {
    setLoading(true);
    setError(null);

    let response;
    
   if (reportFrequency === "daily") {

  let endpoint = "";

  switch (reportType) {

    case "purchases":
      endpoint = `/reports/daily/purchases/${selectedDate}`;
      break;

    case "sales":
      endpoint = `/reports/daily/sales/${selectedDate}`;
      break;

    case "inventory":
      endpoint = `/reports/daily/inventory/${selectedDate}`;
      break;

    case "production":
      endpoint = `/reports/daily/production/${selectedDate}`;
      break;

    default:
      endpoint = `/reports/daily/${selectedDate}`;
      break;
  }

  const response = await api.get(endpoint);

  setDailyReportData(response.data.data);

  return;
}


    if (reportFrequency === "monthly") {
      switch (reportType) {

  case "inventory":
    response = await reportsAPI.getMonthlyInventory(
      year,
      month,
      fromDate,
      toDate,
      oilType,
      packagingType,
      productType
    );
    break;

  case "production":
    response =
      await reportsAPI.getMonthlyProductionReport(
        year,
        month
      );
    break;

  case "comprehensive":
    response =
      await reportsAPI.getMonthlyPnL(year, month);
    break;

    case "sales":
    response = await reportsAPI.getMonthlySales(year, month);
    break;

    case "purchases":
    response = await reportsAPI.getMonthlyPurchases(year, month);
    break;

  default:
    response =
      await reportsAPI.getMonthlyPnL(year, month);
}


      console.log(response.data);
      setReportData(response.data.data);
    }

  } catch (err: any) {
    console.error(err);
    setError(err.response?.data?.error?.message || "Failed to generate report");
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  if (reportFrequency === "monthly" && reportType === "inventory") {
    handleGenerateReport();
  }
}, [
  fromDate,
  toDate,
  oilType,
  packagingType,
  productType,
]);

const handleExcelDownload = async () => {
  try {
    let response;

if (
  reportFrequency === "monthly" &&
  reportType === "comprehensive"
) {
  
  response = await reportsAPI.downloadComprehensiveExcel(
    year,
    month
  );
} else {
  response = await reportsAPI.downloadMonthlyExcel(
    year,
    month,
    reportType
  );
}

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `${reportType}-report-${year}-${month}.xlsx`
    );

    document.body.appendChild(link);

    link.click();

    link.remove();
  } catch (err) {
    console.error(err);
  }
};
const generateInventoryPdf = () => {
  const doc = new jsPDF();

  // ======================
// Header
// ======================

doc.setFillColor(37, 99, 235); // Blue background

doc.rect(0, 0, 210, 32, "F");

doc.setTextColor(255, 255, 255);

doc.setFont("helvetica", "bold");
doc.setFontSize(22);

doc.text("SWASTYA GOLD", 105, 12, {
  align: "center",
});

doc.setFont("helvetica", "normal");
doc.setFontSize(14);

doc.text("Monthly Inventory Report", 105, 21, {
  align: "center",
});

doc.setFontSize(10);

doc.text(
  `Month : ${month}/${year}`,
  15,
  40
);

doc.text(
  `Generated : ${new Date().toLocaleDateString()}`,
  145,
  40
);

// Back to black text
doc.setTextColor(0, 0, 0);


 doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.setFontSize(15);

doc.text("Raw Oil Inventory", 14, 52);

autoTable(doc, {
  startY: 58,

  head: [[
    "Oil Type",
    "Current Qty",
    "Rate/Ltr",
    "Value"
  ]],

  body: reportData.rawOilInventory.inventory.map((item: any) => [
    item.oilType,
    item.currentQuantity.toFixed(2),
    item.costPerLiter.toFixed(2),
    (item.currentQuantity * item.costPerLiter).toFixed(2),
  ]),
});

const finalY =
  (doc as any).lastAutoTable.finalY + 10;

  const packagingStartY =
  finalY + 20;

doc.setFontSize(14);
doc.text("Packaging Inventory", 14, packagingStartY);

autoTable(doc, {
  startY: packagingStartY + 5,

  head: [[
    "Packaging",
    "Quantity",
    "Rate/Unit",
    "Total Cost"
  ]],

  body: reportData.packagingInventory.inventory.map((item: any) => [
    item.packagingType,
    item.quantity,
    item.ratePerUnit.toFixed(2),
    item.totalCost.toFixed(2),
  ]),
});

const packagingFinalY =
  (doc as any).lastAutoTable.finalY + 10;

doc.setFontSize(12);

doc.text(
  `Total Packaging Qty : ${reportData.packagingInventory.totalQuantity}`,
  14,
  packagingFinalY
);

const finishedGoodsY =
  packagingFinalY + 20;

doc.setFontSize(14);

doc.text(
  "Finished Goods Inventory",
  14,
  finishedGoodsY
);

autoTable(doc, {
  startY: finishedGoodsY + 5,

  head: [[
    "Oil Type",
    "Packaging",
    "Quantity",
    "Unit"
  ]],

  body: reportData.finishedGoodsInventory.inventory.map(
    (item: any) => [
      item.oilType,
      item.packagingType,
      item.quantity,
      item.unitType,
    ]
  ),
});

doc.setFontSize(13);

doc.text(
  `Total Quantity : ${reportData.rawOilInventory.totalQuantity.toFixed(2)}`,
  14,
  finalY
);

doc.text(
  `Total Value : ${reportData.rawOilInventory.totalValue.toFixed(2)}`,
  14,
  finalY + 8
);


  doc.save(`Inventory_Report_${month}_${year}.pdf`);
};

const generateProductionPdf = () => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SWASTYA GOLD", 105, 12, {
    align: "center",
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Production Report", 105, 21, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);

  doc.setFontSize(11);
  doc.text(`Month : ${month}/${year}`, 15, 40);

  doc.text(
    `Generated : ${new Date().toLocaleDateString()}`,
    145,
    40
  );

  doc.setFont("helvetica", "bold");
doc.setFontSize(14);

doc.text("Production Details", 14, 55);

autoTable(doc, {
  startY: 60,

  head: [[
    "Batch No",
    "Product",
    "Raw Oil Used",
    "Packaging",
    "Finished Qty",
    "Status",
  ]],

  body: reportData.map((item: any) => [
    item.batchNumber,
    item.productType,
    item.rawOilUsed,
    item.packagingUsed,
    item.finishedQuantity,
    item.status,
  ]),

  theme: "grid",

  headStyles: {
    fillColor: [37, 99, 235],
    textColor: 255,
    halign: "center",
  },

  styles: {
    fontSize: 9,
    cellPadding: 2,
  },
});

  doc.save(`Production_Report_${month}_${year}.pdf`);
};

const handlePdfDownload = async () => {
if (
  reportFrequency === "monthly" &&
  reportType === "purchases"
) {
  const response = await reportsAPI.downloadPurchasesPdf(
    year,
    month
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = `purchases-${year}-${month}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  return;
}

  if (
  reportFrequency === "monthly" &&
  reportType === "comprehensive"
) {
  try {
    const response =
      await reportsAPI.downloadComprehensivePdf(
        year,
        month
      );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;

    link.download = `comprehensive-${year}-${month}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    return;
  } catch (err) {
    console.error(err);
    return;
  }
}

    if (!reportData) {

        alert("Please Generate Report First");

        return;

    }

    switch(reportType){

        case "comprehensive":

            generateComprehensivePdf();

            break;

        case "purchases":

            generatePurchasePdf();

            break;

        case "sales":

            generateSalesPdf();

            break;

        case "inventory":

            generateInventoryPdf();

            break;

        case "production":

            generateProductionPdf();

            break;

        default:

            generateInventoryPdf();

    }

}

  const getReportComponent = () => {
    if (reportFrequency === 'daily') {
      return (
        <DailyReports
          onError={handleError}
          reportType={reportType}
          selectedDate={selectedDate}
          reportData={dailyReportData}

        />
      );
    }

    return (
     <MonthlyReports
    onError={handleError}
    reportType={reportType}
    reportData={reportData}
    loading={loading}

    month={month}
    year={year}

    fromDate={fromDate}
    setFromDate={setFromDate}

    toDate={toDate}
    setToDate={setToDate}

    oilType={oilType}
    setOilType={setOilType}

    packagingType={packagingType}
    setPackagingType={setPackagingType}

    productType={productType}
    setProductType={setProductType}
/>

    );
  };

  return (
    <div className="module-page">

      <div className="module-header">
        <div>
          <h1>Reports</h1>
          <p>Select report type and frequency to generate your business insights</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="module-content">

        <div className="report-filter-panel">

          {/* LEFT SIDE */}
          <div className="report-filter-container">

            {/* Report Type */}
            <div className="report-filter-item">
              <label className="report-filter-label">
                Report Type
              </label>

              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="report-filter-select"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="purchases">Purchases Only</option>
                <option value="sales">Sales Only</option>
                <option value="inventory">Inventory Only</option>
                <option value="production">Production Only</option>
              </select>
            </div>

            {/* Frequency */}
            <div className="report-filter-item">
              <label className="report-filter-label">
                Frequency
              </label>

              <select
                value={reportFrequency}
                onChange={(e) =>
                  setReportFrequency(e.target.value as 'daily' | 'monthly')
                }
                className="report-filter-select"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {reportFrequency === "daily" && (
  <div className="report-filter-item">
    <label className="report-filter-label">
      Date
    </label>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="report-filter-select"
    />
  </div>
)}




            {reportFrequency === 'monthly' && (
              <>
              {/* Month */}
<div className="report-filter-item">
  <label className="report-filter-label">
    Month
  </label>

  <select
    value={month}
    onChange={(e) => setMonth(Number(e.target.value))}
    className="report-filter-select"
  >
    {Array.from({ length: 12 }, (_, i) => (
      <option key={i + 1} value={i + 1}>
        {new Date(0, i).toLocaleString("default", {
          month: "long",
        })}
      </option>
    ))}
  </select>
</div>
{/* Year */}
<div className="report-filter-item">
  <label className="report-filter-label">
    Year
  </label>

  <select
    value={year}
    onChange={(e) => setYear(Number(e.target.value))}
    className="report-filter-select"
  >
    {Array.from({ length: 5 }, (_, i) => {
      const currentYear = new Date().getFullYear() - i;

      return (
        <option key={currentYear} value={currentYear}>
          {currentYear}
        </option>
      );
    })}
  </select>
</div>
           
              </>
            )}

          </div>

          {/* RIGHT SIDE */}
          <div className="report-actions">

           <button
    className="report-btn generate-btn"
    onClick={handleGenerateReport}
>
    {loading ? "Generating..." : "Generate Report"}
</button>

           <button
  className="report-btn excel-btn"
  onClick={handleExcelDownload}
>
  Excel
</button>

<button
    className="report-btn pdf-btn"
    onClick={handlePdfDownload}
>
    PDF
</button>


          </div>

        </div>

        {getReportComponent()}

      </div>

    </div>
  );
};



export default Reports;