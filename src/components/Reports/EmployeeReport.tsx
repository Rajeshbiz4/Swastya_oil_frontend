import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchWorkers } from "../../store/slices/workerSlice";
import "../../pages/Pages.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EmployeeReport: React.FC = () => {
  const dispatch = useAppDispatch();

  const { workers, loading } = useAppSelector((state) => state.worker);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchWorkers({}));
  }, [dispatch]);

  const filteredWorkers = workers.filter((emp: any) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Employee Report");

  // Title
  worksheet.mergeCells("A1:E1");

  const title = worksheet.getCell("A1");
  title.value = "Employee Report";

  title.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFF" },
  };

  title.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" },
  };

  worksheet.getRow(1).height = 30;

  // Empty Row
  worksheet.addRow([]);

  // Header
  const header = worksheet.addRow([
    "Employee Name",
    "Role",
    "Salary",
    "Joining Date",
    "Status",
  ]);

  header.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data
  filteredWorkers.forEach((emp: any) => {
    const row = worksheet.addRow([
      emp.name,
      emp.designation || "-",
      emp.monthlySalary
        ? `₹${emp.monthlySalary}`
        : emp.dailyWage
        ? `₹${emp.dailyWage * 30}`
        : "-",
      emp.joiningDate
        ? new Date(emp.joiningDate).toLocaleDateString()
        : "-",
      emp.isActive ? "Active" : "Inactive",
    ]);

    row.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  worksheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 18 },
    { width: 20 },
    { width: 15 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Employee_Report_${new Date().getTime()}.xlsx`
  );
};

const exportToPDF = () => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Employee Report", 105, 15, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    14,
    25
  );

  // Table
  autoTable(doc, {
    startY: 35,
    head: [[
      "Employee Name",
      "Role",
      "Salary",
      "Joining Date",
      "Status"
    ]],
    body: filteredWorkers.map((emp: any) => [
      emp.name,
      emp.designation || "-",
      emp.monthlySalary
        ? `₹${emp.monthlySalary}`
        : emp.dailyWage
        ? `₹${emp.dailyWage * 30}`
        : "-",
      emp.joiningDate
        ? new Date(emp.joiningDate).toLocaleDateString()
        : "-",
      emp.isActive ? "Active" : "Inactive",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: "center",
    },
    bodyStyles: {
      halign: "center",
    },
    styles: {
      fontSize: 10,
    },
  });

  doc.save("Employee_Report.pdf");
};

  return (
  <div className="employee-report-container">
      {/* Search */}
      <div className="employee-report-search">
        <input
          type="text"
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="employee-search-input"
        />
      </div>

      {/* White Card */}
      <div className="table-section">

        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Salary</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredWorkers.length > 0 ? (
                filteredWorkers.map((emp: any) => (
                  <tr key={emp._id}>
                    <td>{emp.name}</td>

                    <td>{emp.designation || "-"}</td>

                    <td>
                      {emp.monthlySalary
                        ? `₹${emp.monthlySalary}`
                        : emp.dailyWage
                        ? `₹${emp.dailyWage * 30}`
                        : "-"}
                    </td>

                    <td>
                      {emp.joiningDate
                        ? new Date(emp.joiningDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          emp.isActive ? "active" : "inactive"
                        }`}
                      >
                        {emp.isActive ? "✓ Active" : "✗ Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    No Data Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
       <div className="employee-report-actions">
  <button className="btn btn-excel" onClick={exportToExcel}>
    📊 Excel
  </button>

  <button className="btn btn-pdf" onClick={exportToPDF}>
    📄 PDF
  </button>
</div>

      </div>
    </div>
  );
};

export default EmployeeReport;