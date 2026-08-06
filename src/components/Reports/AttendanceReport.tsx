import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { getAttendanceReport } from "../../store/slices/attendanceSlice";
import "../../pages/Pages.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AttendanceReport: React.FC = () => {
  const dispatch = useAppDispatch();

  const { attendanceReport, loading } = useAppSelector(
    (state) => state.attendance
  );

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`
  );

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const [year, month] = selectedMonth.split("-").map(Number);

    dispatch(
      getAttendanceReport({
        month,
        year,
      })
    );
  }, [dispatch, selectedMonth]);

  const filteredData = attendanceReport.filter((emp) =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExcelExport = async () => {
  if (filteredData.length === 0) {
    alert("No attendance report available.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Report");

  // Company Name
  worksheet.mergeCells("A1:F1");
  const companyCell = worksheet.getCell("A1");
  companyCell.value = "SWASTYA OIL INDUSTRIES";
  companyCell.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFF" },
  };
  companyCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  companyCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" },
  };

  // Report Title
  worksheet.mergeCells("A2:F2");
  const titleCell = worksheet.getCell("A2");
  titleCell.value = "MONTHLY ATTENDANCE REPORT";
  titleCell.font = {
    bold: true,
    size: 15,
  };
  titleCell.alignment = {
    horizontal: "center",
  };

  // Month
  worksheet.mergeCells("A3:F3");
  const monthName = new Date(selectedMonth + "-01").toLocaleString(
    "default",
    {
      month: "long",
      year: "numeric",
    }
  );

  worksheet.getCell("A3").value = monthName;
  worksheet.getCell("A3").alignment = {
    horizontal: "center",
  };
  worksheet.getCell("A3").font = {
    bold: true,
    size: 13,
  };

  worksheet.addRow([]);

  // Header
  const headerRow = worksheet.addRow([
    "Employee Name",
    "Designation",
    "Present Days",
    "Absent Days",
    "Half Days",
    "Overtime (Hrs)",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data
  filteredData.forEach((emp) => {
    const row = worksheet.addRow([
      emp.employeeName,
      emp.designation,
      emp.presentDays,
      emp.absentDays,
      emp.halfDays,
      emp.overtimeHours,
    ]);

    row.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
      };

      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  worksheet.addRow([]);

  worksheet.addRow([
    `Generated On : ${new Date().toLocaleDateString()}`,
  ]);

  worksheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Attendance_Report_${selectedMonth}.xlsx`
  );
};

const handlePdfExport = () => {
  if (filteredData.length === 0) {
    alert("No attendance report available.");
    return;
  }

  const doc = new jsPDF();

  // Company Name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SWASTYA OIL INDUSTRIES", 105, 18, { align: "center" });

  // Report Title
  doc.setFontSize(14);
  doc.text("MONTHLY ATTENDANCE REPORT", 105, 28, {
    align: "center",
  });

  // Month
  const monthName = new Date(selectedMonth + "-01").toLocaleString(
    "default",
    {
      month: "long",
      year: "numeric",
    }
  );

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Month : ${monthName}`, 14, 40);

  doc.text(
    `Generated On : ${new Date().toLocaleDateString()}`,
    14,
    47
  );

  autoTable(doc, {
    startY: 55,
    head: [[
      "Employee Name",
      "Designation",
      "Present",
      "Absent",
      "Half Day",
      "OT (Hrs)"
    ]],

    body: filteredData.map((emp) => [
      emp.employeeName,
      emp.designation || "-",
      emp.presentDays,
      emp.absentDays,
      emp.halfDays,
      emp.overtimeHours,
    ]),

    headStyles: {
      fillColor: [31, 78, 121],
      textColor: 255,
      halign: "center",
    },

    bodyStyles: {
      halign: "center",
    },

    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  doc.save(`Attendance_Report_${selectedMonth}.pdf`);
};

  return (
    <div>
      {/* Search + Month */}
        <div className="attendance-report-header table-header">
        <input
        type="text"
        placeholder="Search by employee name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="employee-search-input"
    />

    <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="employee-search-input month-input"
    />
</div>

      {/* Table */}
      <div className="table-section">
        <div className="table-wrapper">
          <table className="data-table attendance-report-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Half Days</th>
                <th>Overtime (Hrs)</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((emp, index) => (
                  <tr key={index}>
                    <td>{emp.employeeName}</td>
                    <td>{emp.designation || "-"}</td>
                    <td>{emp.presentDays}</td>
                    <td>{emp.absentDays}</td>
                    <td>{emp.halfDays}</td>
                    <td>{emp.overtimeHours}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No Attendance Report Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="employee-report-actions">
          <button
            className="btn btn-excel"
            onClick={handleExcelExport}
            >
            📊 Excel
        </button>

          <button
  className="btn btn-pdf"
  onClick={handlePdfExport}
>
  📄 PDF
</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;