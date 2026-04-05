import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { useDispatch, useSelector } from 'react-redux';
import { useAppSelector } from '../store';
import jsPDF from "jspdf";
import logo from './src/assets/logo.jpeg';

import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  Invoice
} from '../store/slices/invoiceSlice';
import './Pages.css';

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontFamily: "Arial"
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px"
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  },
  th: {
    background: "#f5f5f5",
    padding: "10px",
    border: "1px solid #ddd"
  },
  td: {
    padding: "8px",
    border: "1px solid #ddd"
  },
  button: {
    padding: "8px 14px",
    marginRight: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  primaryBtn: {
    background: "#007bff",
    color: "white"
  },
  dangerBtn: {
    background: "#dc3545",
    color: "white"
  },
  successBtn: {
    background: "#28a745",
    color: "white"
  }
};


const getTodayDate = () => new Date().toISOString().split('T')[0];

const InvoicePage: React.FC = () => {
  const dispatch = useDispatch<any>();

   const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [note, setNote] = useState("");

 const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const { invoices, loading, error } = useAppSelector((state: any) => state.invoice);
//    console.log("Invoices from store:", invoices);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoiceDate: getTodayDate(),
    customerName: '',
    product: '',
    quantity: 0,
    rate: 0,
    totalAmount: 0,
    paidAmount: 0,
    remarks: '',
  });

  // Load invoices
  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

   const [products, setProducts] = useState([
    { type: "", rate: "", qty: "", total: 0 }
  ]);

  useEffect(() => {
    setInvoiceNumber("INV-" + Date.now());
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleProductChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;

    if (field === "rate" || field === "qty") {
      const rate = parseFloat(updated[index].rate) || 0;
      const qty = parseFloat(updated[index].qty) || 0;
      updated[index].total = rate * qty;
    }

    setProducts(updated);
  };

  const addRow = () => {
    setProducts([...products, { type: "", rate: "", qty: "", total: 0 }]);
  };

  const removeRow = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const grandTotal = products.reduce((sum, item) => sum + item.total, 0);


   const handleSave = async () => {
  try {
    setFormLoading(true);

    const payload = {
      invoiceNumber,
      date,
      customerName,
      contact,
      address,
      gstNo,
      products: products.map(p => ({
        type: p.type,
        rate: Number(p.rate),
        qty: Number(p.qty)
      })),
      note,
      status: "pending",
      createdBy: "admin" // change as per login user
    };

    await dispatch(createInvoice(payload));

    alert("Invoice Created Successfully ✅");

    // Reset form
    setCustomerName("");
    setContact("");
    setAddress("");
    setGstNo("");
    setProducts([{ type: "", rate: "", qty: "", total: 0 }]);
    setNote("");

    setShowForm(false);

  } catch (err) {
    console.error(err);
    // alert("Error creating invoice ❌");
  } finally {
    setFormLoading(false);
  }
};
  

   // Generate PDF and show in modal
const handlePrintPreview = () => {
    console.log("Generating PDF preview with data:", {
      invoiceNumber,
      date,
      customerName,
      contact,
      address,
      gstNo,
      note
    })  ;
  const doc = new jsPDF();

//   🔹 Logo (add your path)
//   try {
//     doc.addImage("./src/assets/logo.jpeg", "JPEG", 10, 10, 100, 40,  "",
//     "FAST",
//     130);
//   } catch (e) {}

  // 🔹 Company Info
doc.setFontSize(16);
// Set maroon color
doc.setTextColor(128, 0, 0);
doc.text("Swastya Shakti Gold Pvt Ltd", 10, 15);

// Reset to black for other texts if needed
doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  doc.text("Address: Pune, Maharashtra, India", 10, 21);
  doc.text("Mobile: +91 9876543210", 10, 26);
  doc.text("Email: info@swastya.com", 10, 31);
  doc.text("Website: www.swastya.com", 10, 36);

  // 🔹 Invoice Title
  doc.setFontSize(20);
  doc.setTextColor(128, 0, 0);
  doc.text("INVOICE", 150, 18);
doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNumber}`, 150, 28);

  const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const year = d.getFullYear();
  return `${day}-${month}-${year}`; // DD-MM-YYYY
};

// Usage
doc.text(`Date: ${formatDate(date)}`, 150, 34);

//   doc.text(`Date: ${date}`, 150, 34);

  // 🔹 Bill To
  doc.setFontSize(10);
  doc.text("Bill To:", 10, 55);
  doc.text(customerName || "-", 10, 62);
  doc.text(`Contact: ${contact || "-"}`, 10, 68);
  doc.text(`Address: ${address || "-"}`, 10, 74);

  // ===== TABLE =====
 let startY = 90;

const colX = {
  item: 10,
  desc: 35,
  qty: 90,
  rate: 110,
  discount: 140,
  total: 170
};

// Set light blue background color
doc.setFillColor(173, 216, 230); // light blue

// Draw header background
doc.rect(10, startY, 190, 8, "F"); // "F" = fill only

// Set bold font for header
doc.setFont("helvetica", "bold");
doc.setFontSize(9);

// Header text
doc.text("Item #", colX.item + 2, startY + 6);
doc.text("Description", colX.desc + 2, startY + 6);
doc.text("Qty", colX.qty + 2, startY + 6);
doc.text("Unit price", colX.rate + 2, startY + 6);
doc.text("Discount", colX.discount + 2, startY + 6);
doc.text("Price", colX.total + 2, startY + 6);

// Reset font to normal for table rows
doc.setFont("helvetica", "normal");

  // Column lines (only for header + rows)
  let tableHeight = products.length * 8 + 8;
  Object.values(colX).forEach((x) => {
    doc.line(x, startY, x, startY + tableHeight);
  });

  // Rows (ONLY actual records ✅)
  let y = startY + 8;

  products.forEach((p, i) => {
    doc.rect(10, y, 190, 8);

    doc.text(`A00${i + 1}`, colX.item + 2, y + 6);
    doc.text(p.type || "-", colX.desc + 2, y + 6);
    doc.text(String(p.qty || 0), colX.qty + 2, y + 6);
    doc.text(String(p.rate || 0), colX.rate + 2, y + 6);
    doc.text("-", colX.discount + 2, y + 6);
    doc.text(String(p.total || 0), colX.total + 2, y + 6);

    y += 8;
  });

  // ===== TOTAL SECTION =====
  let boxY = y + 10;



  doc.setFontSize(9);

  doc.text("Invoice Subtotal", 122, boxY + 8);
 doc.text(`Rs. ${grandTotal}`, 170, boxY + 8);

 // Draw bottom border for Subtotal row
doc.setLineWidth(0.2); // optional: line thickness
doc.line(120, boxY + 10, 200, boxY + 10); // x1,y1 to x2,y2

  doc.text("Tax Rate", 122, boxY + 16);
  doc.text("0.00%", 170, boxY + 16);

  doc.setLineWidth(0.2); // line thickness
doc.line(120, boxY + 20, 200, boxY + 20); // x1, y1, x2, y2

  doc.text("Sales Tax", 122, boxY + 24);
  doc.text(`Rs. ${grandTotal * 0.00}`, 170, boxY + 24);

    // Draw a line below Sales Tax
doc.setLineWidth(0.2); // line thickness
doc.line(120, boxY + 28, 200, boxY + 28); // x1, y1, x2, y2

  doc.text("TOTAL", 122, boxY + 32);
  doc.text(`Rs. ${grandTotal}`, 170, boxY + 32);

  // Draw a line below Sales Tax
doc.setLineWidth(0.5); // line thickness
doc.line(120, boxY + 36, 200, boxY + 36); // x1, y1, x2, y2

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 10, 280);

  // Preview
  const blobUrl = doc.output("bloburl");
  setPdfUrl(blobUrl);
  setShowPreview(true);
};

  

  // Handle form change
  const handleChange = (name: string, value: any) => {
    const updated = { ...formData, [name]: value };

    if (name === 'quantity' || name === 'rate') {
      updated.totalAmount = updated.quantity * updated.rate;
    }

    setFormData(updated);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);

      if (editingInvoice) {
        await dispatch(updateInvoice({
          id: editingInvoice._id,
          data: formData
        }));
      } else {
        await dispatch(createInvoice(formData));
      }

      setShowForm(false);
      setEditingInvoice(null);

    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete invoice?')) return;

    await dispatch(deleteInvoice(id));
  };

  // Columns
  const columns = [
    //invoiceNumber
     {
      key: 'invoiceNumber',
      title: 'Invoice Number',
    },
    {
      key: 'date',
      title: 'Date',
      render: (v: string) => new Date(v).toLocaleDateString()
    },
    { key: 'customerName', title: 'Customer' },
    // { key: 'product', title: 'Product' },
    // { key: 'quantity', title: 'Qty' },
    // { key: 'rate', title: 'Rate', render: (v: number) => `₹${v}` },
    {
  key: 'products', // must match your data field
  title: 'Total',
  render: (products: { type: string; rate: number; qty: number }[]) => {
    if (!products || products.length === 0) return "₹0";

    const total = products.reduce((sum, p) => {
      const rate = Number(p.rate) || 0;
      const qty = Number(p.qty) || 0;
      return sum + rate * qty;
    }, 0);

    return `₹${total}`;
  }
},
   
    {
  key: 'status',
  title: 'Status',
  render: (status: string) => {
    const value = status || 'Pending';
    const color = value.toLowerCase() === 'paid' ? 'green' : 'red';

    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {value}
      </span>
    );
  }
},
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: Invoice) => (
        <>
          <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={() => {
            // setEditingInvoice(row);
            // setShowForm(true);
            
            console.log("View invoice:", row);
            setInvoiceNumber(row.invoiceNumber);
            setDate(row.date);
            setCustomerName(row.customerName);
            setContact(row.contact);
            setAddress(row.address);
            setGstNo(row.gstNo);
            setNote(row.note);
            handlePrintPreview();
            
          }}>
            View
          </button>
        </>
      )
    }
  ];

  // FORM UI
  if (showForm) {
    return (
     <div style={styles.container}>
      <h2 style={{ marginBottom: 20 }}>Invoice Form</h2>

      <div style={styles.row}>
        <input style={styles.input} value={invoiceNumber} readOnly />
        <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div style={styles.row}>
        <input style={styles.input} placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input style={styles.input} placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>

      <div style={styles.row}>
        <input style={styles.input} placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input style={styles.input} placeholder="GST No (optional)" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
      </div>

      <h3>Product Details</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Rate</th>
            <th style={styles.th}>Qty</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item, index) => (
            <tr key={index}>
              <td style={styles.td}>
                <input style={styles.input} value={item.type} onChange={(e) => handleProductChange(index, "type", e.target.value)} />
              </td>
              <td style={styles.td}>
                <input style={styles.input} type="number" value={item.rate} onChange={(e) => handleProductChange(index, "rate", e.target.value)} />
              </td>
              <td style={styles.td}>
                <input style={styles.input} type="number" value={item.qty} onChange={(e) => handleProductChange(index, "qty", e.target.value)} />
              </td>
              <td style={styles.td}>{item.total}</td>
              <td style={styles.td}>
                <button style={{ ...styles.button, ...styles.dangerBtn }} onClick={() => removeRow(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button style={{ ...styles.button, ...styles.primaryBtn, marginTop: 10 }} onClick={addRow}>Add Row</button>

      <h3 style={{ marginTop: 20 }}>Grand Total: ₹ {grandTotal}</h3>

      <textarea
        style={{ ...styles.input, marginTop: 10, width: "100%" }}
        rows="3"
        placeholder="Add Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <button style={{ ...styles.button, ...styles.successBtn }} onClick={handleSave}>Save</button>
        <button style={{ ...styles.button }} onClick={() => setShowForm(false)}>Cancel</button>
        <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={handlePrintPreview}>Print</button>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ background: "white", padding: 10, width: "80%", height: "90%" }}>
            <iframe title="PDF Preview" src={pdfUrl} width="100%" height="90%" />
            <div style={{ marginTop: 10 }}>
              <button style={{ ...styles.button }} onClick={() => setShowPreview(false)}>Close</button>
            </div>

          </div>
        </div>
      )}
    </div>


    );
  }

  // LIST UI
  return (
    <div className="module-page">

         {showPreview && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{ background: "white", padding: 10, width: "80%", height: "90%" }}>
            <iframe title="PDF Preview" src={pdfUrl} width="100%" height="90%" />
            <div style={{ marginTop: 10 }}>
              <button style={{ ...styles.button }} onClick={() => setShowPreview(false)}>Close</button>

                 <button
  style={{ ...styles.button, ...styles.successBtn }}
  onClick={() => {
    // Inside your InvoicePage component
  const doc = new jsPDF();
  // 🔹 Your invoice content (logo, header, products, total, etc.)
  doc.setFontSize(14);
  doc.setTextColor(128, 0, 0); // maroon color
  doc.text("Swastya Shakti Gold Pvt Ltd", 10, 15);
  // ... rest of your invoice PDF generation code

  // Generate Blob from PDF
  const pdfBlob = doc.output("blob");

  // Create File object
  const file = new File([pdfBlob], `Invoice_${invoiceNumber}.pdf`, { type: "application/pdf" });

  // Use Web Share API (mobile only)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({
      files: [file],
      title: "Invoice PDF",
      text: `Invoice #${invoiceNumber} for ${customerName}`
    }).then(() => {
      console.log("Shared successfully via WhatsApp or other apps!");
    }).catch((err) => {
      console.error("Error sharing:", err);
    });
  } else {
    alert("Your device does not support sharing files. You can download the PDF instead.");
    doc.save(`Invoice_${invoiceNumber}.pdf`);
  }
  }}
>
  Share on WhatsApp
</button>

 <button
  style={{ ...styles.button, ...styles.primaryBtn }}
  onClick={() => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${invoiceNumber || 'invoice'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }}
>
 DownLoad
</button>
            </div>


          </div>
        </div>
      )}

      <h1>Invoice Management</h1>

      {error && <div className="error-message">{error}</div>}

      <button style={{ ...styles.button, ...styles.primaryBtn, marginTop: 10, marginBottom: 10 }} onClick={() => setShowForm(true)}>
        + Create Invoice
      </button>

  <DataTable
  data={invoices}
  columns={columns}
  loading={loading}
  rowKey="_id"
  expandable={(invoice) => (
    <div style={{
      padding: '12px 20px',
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Products Table */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Products</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee', textAlign: 'left' }}>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Type</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Qty</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Rate</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((p, idx) => (
              <tr key={idx}>
                <td style={{ padding: '6px', border: '1px solid #ccc' }}>{p.type}</td>
                <td style={{ padding: '6px', border: '1px solid #ccc' }}>{p.qty}</td>
                <td style={{ padding: '6px', border: '1px solid #ccc' }}>₹{p.rate}</td>
                <td style={{ padding: '6px', border: '1px solid #ccc' }}>₹{p.qty * p.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes / Remarks */}
      {invoice.remarks && (
        <div style={{
          padding: '8px',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#555'
        }}>
          <strong>Note:</strong> {invoice.remarks}
        </div>
      )}
    </div>
  )}
/>
    </div>
  );
};

export default InvoicePage;