import { reportsAPI } from "../services/api";
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355
import DailyReports from '../components/Reports/DailyReports';
import MonthlyReports from '../components/Reports/MonthlyReports';
import './Pages.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";




const Reports: React.FC = () => {
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'monthly'>('daily');

  const [reportType, setReportType] = useState<
    'comprehensive' | 'purchases' | 'sales' | 'inventory' | 'production'
  >('comprehensive');

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [oilType, setOilType] = useState("");
const [packagingType, setPackagingType] = useState("");
const [productType, setProductType] = useState("");


  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };
const handleGenerateReport = async () => {
  try {
    setLoading(true);
    setError(null);

    let response;
<<<<<<< HEAD
     
=======
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355

    if (reportFrequency === "monthly") {
      switch (reportType) {
        case "inventory":
<<<<<<< HEAD
       response = await reportsAPI.getMonthlyInventory(
  year,
  month,
  fromDate,
  toDate,
  oilType,
  packagingType,
  productType
);

=======
          response = await reportsAPI.getMonthlyInventory(year, month);
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355
          break;

        case "comprehensive":
          response = await reportsAPI.getMonthlyPnL(year, month);
          break;

        default:
          response = await reportsAPI.getMonthlyPnL(year, month);
      }

      console.log(response.data);
      setReportData(response.data.data);
    }

<<<<<<< HEAD

=======
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355
  } catch (err: any) {
    console.error(err);
    setError(err.response?.data?.error?.message || "Failed to generate report");
  } finally {
    setLoading(false);
  }
};
<<<<<<< HEAD
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


=======
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355

const handleExcelDownload = async () => {
  try {
    const response = await reportsAPI.downloadMonthlyExcel(
      year,
      month,
      reportType
    );

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

/*
const handlePdfDownload = async () => {
  try {
    const response = await reportsAPI.downloadMonthlyPdf(
      year,
      month,
      reportType
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;

    link.download = `${reportType}-${year}-${month}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  }
};*/

const handlePdfDownload = () => {

  if (!reportData) {
    alert("Please generate report first.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("SWASTYA GOLD", 70, 15);

  doc.setFontSize(14);
  doc.text("Monthly Inventory Report", 60, 25);

  doc.setFontSize(11);

  doc.text(`Month : ${month}/${year}`, 14, 40);

  doc.text(
    `Generated : ${new Date().toLocaleDateString()}`,
    14,
    48
  );

  // Raw Oil Table

  autoTable(doc, {
    startY: 60,

    head: [["Oil Type", "Quantity", "Rate", "Value"]],

    body:
      reportData.rawOilInventory?.inventory?.map((item: any) => [

        item.oilType || "-",

        item.currentQuantity,

        item.costPerLiter,

        (item.currentQuantity || 0) *
          (item.costPerLiter || 0),

      ]) || [],
  });

  // Packaging

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,

    head: [["Packaging", "Quantity"]],

    body:
      reportData.packagingInventory?.inventory?.map(
        (item: any) => [

          item.packagingType || item.name,

          item.quantity,

        ]
      ) || [],
  });

  // Finished Goods

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,

    head: [["Product", "Quantity", "Value"]],

    body:
      reportData.finishedGoodsInventory?.inventory?.map(
        (item: any) => [

          item.productName || item.batchNumber,

          item.quantity,

          (item.quantity || 0) *
            (item.unitCost || 0),

        ]
      ) || [],
  });

  doc.save(
    `Inventory_Report_${month}_${year}.pdf`
  );

};



  const getReportComponent = () => {
    if (reportFrequency === 'daily') {
      return (
        <DailyReports
          onError={handleError}
          reportType={reportType}
        />
      );
    }

    return (
<<<<<<< HEAD
     <MonthlyReports
=======
      <MonthlyReports
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355
    onError={handleError}
    reportType={reportType}
    reportData={reportData}
    loading={loading}
<<<<<<< HEAD

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

=======
    />
>>>>>>> d561161e326838e9ed8a5acfcf50b07b43c37355
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