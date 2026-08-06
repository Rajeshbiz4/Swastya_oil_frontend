import { reportsAPI } from "../services/api";
import api from "../services/api";
import React, { useState, useEffect } from 'react';
import DailyReports from '../components/Reports/DailyReports';
import MonthlyReports from '../components/Reports/MonthlyReports';
import './Pages.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";



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

const exportDailyExcel = async () => {

  if (!dailyReportData) {
    alert("Please Generate Daily Report First");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Daily Report");

  if (reportType === "production") {

  worksheet.mergeCells("A1:E1");

  const title = worksheet.getCell("A1");
  title.value = `Daily Production Report - ${selectedDate}`;
  title.font = {
    bold: true,
    size: 18,
  };
  title.alignment = {
    horizontal: "center",
  };

  worksheet.addRow([]);

  const header = worksheet.addRow([
    "Batch Number",
    "Product Type",
    "Raw Oil Used",
    "Packaging Used",
    "Finished Quantity",
  ]);

  header.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" },
  };

  if (dailyReportData.production?.length > 0) {

    dailyReportData.production.forEach((item: any) => {
      worksheet.addRow([
        item.batchNumber,
        item.productType,
        item.rawOilUsed,
        item.packagingUsed,
        item.finishedQuantity,
      ]);
    });

  } else {

    worksheet.addRow(["No Data Available"]);

  }

  worksheet.columns.forEach((column) => {
    column.width = 25;
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Daily_Production_Report_${selectedDate}.xlsx`
  );

  return;
}

   // ==========================
  // Title
  // ==========================

  worksheet.mergeCells("A1:H1");

  const title = worksheet.getCell("A1");

  title.value = `Daily Report - ${selectedDate}`;

  title.font = {
    bold: true,
    size: 18,
  };

  title.alignment = {
  horizontal: "center",
  vertical: "middle",
};

  worksheet.addRow([]);

if (reportType === "inventory") {

  // Raw Oil
  let row = worksheet.addRow(["Raw Oil Inventory"]);
  row.font = { bold: true, size: 14 };

  let header = worksheet.addRow([
    "Oil Type",
    "Opening Stock",
    "Purchased Qty",
    "Available Stock"
  ]);

  header.font = {
    bold: true,
    color: { argb: "FFFFFFFF" }
  };

  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" }
  };

  dailyReportData.rawOilInventory.inventory.forEach((item: any) => {
    worksheet.addRow([
      item.oilType,
      item.initialQuantity,
      item.initialQuantity - item.currentQuantity,
      item.currentQuantity
    ]);
  });

  worksheet.addRow([]);

  // ==========================
// Packaging Inventory
// ==========================

let packagingTitle = worksheet.addRow(["Packaging Inventory"]);
packagingTitle.font = {
  bold: true,
  size: 14,
};

const packagingHeader = worksheet.addRow([
  "Packaging Type",
  "Opening Stock",
  "Purchased Qty",
  "Used Qty",
  "Available Stock",
]);

packagingHeader.font = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

packagingHeader.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "1F4E78" },
};

dailyReportData.packagingInventory.inventory.forEach((item: any) => {
  worksheet.addRow([
    item.packagingType,
    item.openingStock ?? 0,
    item.totalPurchased ?? 0,
    item.totalUsed ?? 0,
    item.currentStock ?? item.quantity ?? 0,
  ]);
});

if (dailyReportData.packagingInventory.inventory.length === 0) {
  worksheet.addRow(["No Data Available"]);
}

worksheet.addRow([]);

// ==========================
// Finished Goods Inventory
// ==========================

let finishedTitle = worksheet.addRow(["Finished Goods Inventory"]);
finishedTitle.font = {
  bold: true,
  size: 14,
};

const finishedHeader = worksheet.addRow([
  "Product",
  "Opening Stock",
  "Produced Qty",
  "Sold Qty",
  "Available Stock",
]);

finishedHeader.font = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

finishedHeader.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "1F4E78" },
};

dailyReportData.finishedGoodsInventory.inventory.forEach((item: any) => {
  worksheet.addRow([
    item.product,
    item.openingStock ?? 0,
    item.produced ?? 0,
    item.sold ?? 0,
    item.available ?? 0,
  ]);
});

if (dailyReportData.finishedGoodsInventory.inventory.length === 0) {
  worksheet.addRow(["No Data Available"]);
}

worksheet.addRow([]);

  // Auto Width
worksheet.columns.forEach((column) => {
  column.width = 22;
});

// Border
worksheet.eachRow((row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
});

const buffer = await workbook.xlsx.writeBuffer();

saveAs(
  new Blob([buffer]),
  `Daily_Inventory_Report_${selectedDate}.xlsx`
);

return;

}

  // ==========================
  // Oil Purchases
  // ==========================

  let row = worksheet.addRow(["Oil Purchases"]);

  row.font = {
    bold: true,
    size: 14,
  };

  const oilHeader = worksheet.addRow([
    "Supplier",
    "Oil Type",
    "Quantity",
    "Rate/Liter",
    "Total Amount",
    "Payment Mode",
  ]);

  oilHeader.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
  };

  oilHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1F4E78",
    },
  };

  oilHeader.alignment = {
    horizontal: "center",
  };

  dailyReportData.oilPurchases?.purchases?.forEach((item: any) => {
    worksheet.addRow([
      item.supplierName,
      item.oilType,
      item.quantity,
      item.ratePerLiter,
      item.totalAmount,
      item.paymentMode,
    ]);
  });

  if (
    dailyReportData.oilPurchases?.purchases?.length === 0
  ) {
    worksheet.addRow(["No Data Available"]);
  }

  worksheet.addRow([]);
  worksheet.addRow([]);

  // ==========================
  // Packaging
  // ==========================

  row = worksheet.addRow(["Packaging Purchases"]);

  row.font = {
    bold: true,
    size: 14,
  };

  const packHeader = worksheet.addRow([
    "Supplier",
    "Packaging",
    "Quantity",
    "Rate/Unit",
    "Total Amount",
    "Payment Mode",
  ]);

  packHeader.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
  };

  packHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1F4E78",
    },
  };

  packHeader.alignment = {
    horizontal: "center",
  };

  dailyReportData.packagingPurchases?.purchases?.forEach(
    (item: any) => {
      worksheet.addRow([
        item.supplierName,
        item.packagingType,
        item.quantity,
        item.ratePerUnit,
        item.totalAmount,
        item.paymentMode,
      ]);
    }
  );

  if (
    dailyReportData.packagingPurchases?.purchases?.length === 0
  ) {
    worksheet.addRow(["No Data Available"]);
  }

  // ==========================
  // Auto Width
  // ==========================

  worksheet.columns.forEach((column) => {
    column.width = 22;
  });

  // ==========================
  // Border
  // ==========================

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: "thin",
        },
        left: {
          style: "thin",
        },
        bottom: {
          style: "thin",
        },
        right: {
          style: "thin",
        },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Daily_Report_${selectedDate}.xlsx`
  );
};

const generateDailyInventoryPdf = () => {

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");

  doc.text(
    `Daily Inventory Report - ${selectedDate}`,
    14,
    15
  );
  autoTable(doc, {
  startY: 25,

  head: [[
    "Oil Type",
    "Opening Stock",
    "Purchased Qty",
    "Available Stock"
  ]],

  body:
  dailyReportData.rawOilInventory.inventory.length > 0
    ? dailyReportData.rawOilInventory.inventory.map((item: any) => [
        item.oilType,
        item.initialQuantity,
        Number((item.initialQuantity - item.currentQuantity).toFixed(2)),
        item.currentQuantity,
      ])
    : [["No Data Available", "", "", ""]],


  headStyles: {
    fillColor: [31, 78, 120],
    textColor: 255,
    fontStyle: "bold"
  },

  styles: {
    fontSize: 10,
    cellPadding: 3
  }
});

const rawFinalY = (doc as any).lastAutoTable.finalY + 10;

doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("Packaging Inventory", 14, rawFinalY);

autoTable(doc, {
  startY: rawFinalY + 5,

  head: [[
    "Packaging Type",
    "Opening Stock",
    "Purchased Qty",
    "Used Qty",
    "Available Stock"
  ]],

 body:
  dailyReportData.packagingInventory.inventory.length > 0
    ? dailyReportData.packagingInventory.inventory.map((item: any) => [
        item.packagingType,
        item.openingStock ?? 0,
        item.totalPurchased ?? 0,
        item.totalUsed ?? 0,
        item.currentStock ?? item.quantity ?? 0,
      ])
    : [["No Data Available", "", "", "", ""]],


  headStyles: {
    fillColor: [31, 78, 120],
    textColor: 255,
    fontStyle: "bold",
  },

  styles: {
    fontSize: 10,
    cellPadding: 3,
  },
});

const packagingFinalY = (doc as any).lastAutoTable.finalY + 10;

doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("Finished Goods Inventory", 14, packagingFinalY);

autoTable(doc, {
  startY: packagingFinalY + 5,

  head: [[
    "Product",
    "Opening Stock",
    "Produced Qty",
    "Sold Qty",
    "Available Stock"
  ]],

 body:
  dailyReportData.finishedGoodsInventory.inventory.length > 0
    ? dailyReportData.finishedGoodsInventory.inventory.map((item: any) => [
        item.product,
        item.openingStock ?? 0,
        item.produced ?? 0,
        item.sold ?? 0,
        item.available ?? 0,
      ])
    : [["No Data Available", "", "", "", ""]],


  headStyles: {
    fillColor: [31, 78, 120],
    textColor: 255,
    fontStyle: "bold",
  },

  styles: {
    fontSize: 10,
    cellPadding: 3,
  },
});

doc.save(`Daily_Inventory_Report_${selectedDate}.pdf`);

};

const generateDailyPurchasePdf = () => {
  const doc = new jsPDF();

  // ======================
  // Header
  // ======================
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Daily Purchase Report - ${selectedDate}`, 14, 15);

  // ======================
  // Oil Purchases
  // ======================

  doc.setFontSize(14);
  doc.text("Oil Purchases", 14, 28);

  autoTable(doc, {
    startY: 33,

    head: [[
      "Supplier",
      "Oil Type",
      "Quantity",
      "Rate/Liter",
      "Total Amount"
    ]],

    body:
      dailyReportData.oilPurchases?.purchases?.length > 0
        ? dailyReportData.oilPurchases.purchases.map((item: any) => [
            item.supplierName,
            item.oilType,
            item.quantity,
            item.ratePerLiter,
            item.totalAmount,
          ])
        : [["No Data Available", "", "", "", ""]],

    headStyles: {
      fillColor: [31, 78, 120],
      textColor: 255,
      fontStyle: "bold",
    },

    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  // ======================
  // Packaging Purchases
  // ======================

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.text("Packaging Purchases", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,

    head: [[
      "Supplier",
      "Packaging",
      "Quantity",
      "Rate/Unit",
      "Total Amount"
    ]],

    body:
      dailyReportData.packagingPurchases?.purchases?.length > 0
        ? dailyReportData.packagingPurchases.purchases.map((item: any) => [
            item.supplierName,
            item.packagingType,
            item.quantity,
            item.ratePerUnit,
            item.totalAmount,
          ])
        : [["No Data Available", "", "", "", ""]],

    headStyles: {
      fillColor: [31, 78, 120],
      textColor: 255,
      fontStyle: "bold",
    },

    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  doc.save(`Daily_Purchases_Report_${selectedDate}.pdf`);
};

const generateDailyProductionPdf = () => {
   const doc = new jsPDF();

   doc.setFontSize(18);
   doc.setFont("helvetica", "bold");
   doc.text(`Daily Production Report - ${selectedDate}`, 14, 15);

   autoTable(doc, {
      startY: 25,
      head: [[
         "Batch Number",
         "Product Type",
         "Raw Oil Used",
         "Packaging Used",
         "Finished Quantity"
      ]],

      body:
         dailyReportData?.length > 0
            ? dailyReportData.map((item: any) => [
                item.batchNumber,
                item.productType,
                item.rawOilUsed,
                item.packagingUsed,
                item.finishedQuantity,
              ])
            : [["No Data Available", "", "", "", ""]],

      headStyles: {
         fillColor: [31, 78, 120],
         textColor: 255,
      }
   });

   doc.save(`Daily_Production_Report_${selectedDate}.pdf`);
};


const handleExcelDownload = async () => {

 if (reportFrequency === "daily") {
    exportDailyExcel();
    return;
}


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


  if (reportFrequency === "daily" && reportType === "inventory") {
    generateDailyInventoryPdf();
    return;
}

if (reportFrequency === "daily" && reportType === "purchases") {
  generateDailyPurchasePdf();
  return;
}

if (reportFrequency === "daily" && reportType === "production") {
    generateDailyProductionPdf();
    return;
}


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