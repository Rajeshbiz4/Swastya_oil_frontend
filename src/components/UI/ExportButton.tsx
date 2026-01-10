import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './UI.css';

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  disabled?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  title = 'Report',
  disabled = false,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      
      // Generate Excel file
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setIsExporting(true);
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 22);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      
      if (data.length === 0) {
        doc.text('No data available', 14, 50);
      } else {
        // Get column headers from first data item
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header] || ''));
        
        // Create table
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 40,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });
      }
      
      // Save PDF
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`export-button-group ${className}`}>
      <button
        onClick={exportToExcel}
        disabled={disabled || isExporting || data.length === 0}
        className="export-button excel-button"
        title="Export to Excel"
      >
        {isExporting ? 'Exporting...' : '📊 Excel'}
      </button>
      <button
        onClick={exportToPDF}
        disabled={disabled || isExporting || data.length === 0}
        className="export-button pdf-button"
        title="Export to PDF"
      >
        {isExporting ? 'Exporting...' : '📄 PDF'}
      </button>
    </div>
  );
};

export default ExportButton;