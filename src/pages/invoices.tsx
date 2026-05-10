import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store';
import api, { ApiResponse } from '../services/api';
import jsPDF from "jspdf";
import logo from './src/assets/logo.jpeg';
import { appConfig  } from "../config/appConfig";
import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  Invoice
} from '../store/slices/invoiceSlice';
import { fetchFinishedGoodsInventory } from '../store/slices/inventorySlice';
import './Pages.css';
import { toWords } from 'number-to-words';

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: undefined as string | undefined,
    message: ''
  });

  const closePopup = () => setPopup((prev) => ({ ...prev, isOpen: false }));

  const { invoices, loading, error } = useAppSelector((state: any) => state.invoice);
  const finishedGoods = useAppSelector((state: any) => state.inventory?.finishedGoods || []) as Array<{ packagingType: string; oilType: string }>;
  const packagingTypes = Array.from(new Set(finishedGoods.map((item) => item.packagingType).filter(Boolean) as string[])).sort() as string[];
  const oilTypes = Array.from(new Set(finishedGoods.map((item) => item.oilType).filter(Boolean) as string[])).sort() as string[];
  const [packagingRateCache, setPackagingRateCache] = useState<Record<string, number>>({});
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
    packagingTypes.push("14 ltrs");
    packagingTypes.push("1 ltr pp box");
  // Load invoices and finished goods inventory for packaging type options
  useEffect(() => {


    dispatch(fetchInvoices());
    dispatch(fetchFinishedGoodsInventory());
  }, [dispatch]);

  const [products, setProducts] = useState<ProductRow[]>([
    { oilType: "", type: "", rate: "", qty: 0, total: 0 }
  ]);

  useEffect(() => {
    setInvoiceNumber("INV-" + Date.now());
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  type ProductRow = {
    oilType: string;
    type: string;
    rate: number | string;
    qty: number;
    total: number;
  };

  const fetchPackagingTypeRate = async (packagingType: string, oilType: string): Promise<number> => {
    if (!packagingType || !oilType) return 0;

    const cacheKey = `${packagingType}-${oilType}`;
    if (packagingRateCache[cacheKey] !== undefined) {
      return packagingRateCache[cacheKey];
    }

    try {
      const response = await api.get<ApiResponse<{ packagingType: string; oilType: string; ratePerUnit: number; averageRate: number; totalRate: number }>>(
        `/inventory/packaging/rate/${encodeURIComponent(packagingType)}/${encodeURIComponent(oilType)}`
      );

      if (response.data && response.data.data) {
        const totalRate = response.data.data.totalRate || 0;
        setPackagingRateCache((prev) => ({ ...prev, [cacheKey]: totalRate }));
        return totalRate;
      }
    } catch (error: any) {
      console.error('Error fetching packaging rate:', error);
    }

    return 0;
  };

  const handleProductChange = async (
    index: number,
    field: keyof ProductRow,
    value: string
  ) => {
    const updated = [...products];
    const row = { ...updated[index] };

    if (field === "oilType") {
      row.oilType = value;
    } else if (field === "type") {
      row.type = value;
    } else if (field === "qty") {
      row.qty = Number(value) || 0;
    } else if (field === "rate") {
      row.rate = value;
    }

    if (field === "type") {
      if (row.oilType && value) {
        const totalRate = await fetchPackagingTypeRate(value, row.oilType);
        row.rate = totalRate;
      }
    } else if (field === "oilType") {
      if (row.type && value) {
        const totalRate = await fetchPackagingTypeRate(row.type, value);
        row.rate = totalRate;
      }
    }

    const rate = parseFloat(row.rate as string) || Number(row.rate) || 0;
    const qty = Number(row.qty) || 0;
    row.total = rate * qty;
    updated[index] = row;
    setProducts(updated);
  };

  const addRow = () => {
    setProducts([...products, { oilType: "", type: "", rate: "", qty: 0, total: 0 }]);
  };

  const removeRow = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const grandTotal = products.reduce((sum, item) => sum + item.total, 0);


  const handleSave = async () => {
    try {
      setFormLoading(true);
      const validProducts = products.filter(p => p.oilType && p.type && p.qty > 0);

      if (validProducts.length === 0) {
        setPopup({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Please add at least one product with valid oil type, packaging type, and quantity.'
        });
        return;
      }

      const payload = {
        invoiceNumber,
        date,
        customerName,
        contact,
        address,
        gstNo,
        products: products.map(p => ({
          oilType: p.oilType,
          type: p.type,
          rate: Number(p.rate),
          qty: Number(p.qty)
        })),
        note,
        status: 'pending',
        createdBy: 'admin'
      };

      await dispatch(createInvoice(payload));

      for (const product of validProducts) {
        try {
          await api.post('/inventory/finished-goods/reduce', {
            oilType: product.oilType,
            packagingType: product.type,
            quantity: product.qty
          });
        } catch (inventoryErr) {
          console.error('Failed to reduce inventory for product:', product, inventoryErr);
        }
      }

      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Invoice Created',
        message: 'Invoice created successfully ✅'
      });

      setCustomerName('');
      setContact('');
      setAddress('');
      setGstNo(appConfig.company.gstNumber);
      setProducts([{ oilType: '', type: '', rate: '', qty: 0, total: 0 }]);
      setNote('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Invoice Error',
        message: 'Error creating invoice ❌'
      });
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
// doc.setFontSize(16);
// // Set maroon color
// doc.setTextColor(128, 0, 0);
// doc.text(appConfig.company.name, 10, 15);

// // Reset to black for other texts if needed
// doc.setTextColor(0, 0, 0);

//   doc.setFontSize(9);
//   doc.text(appConfig.company.address, 10, 21);
//   doc.text(appConfig.company.contact, 10, 26);
//   doc.text(appConfig.company.email, 10, 31);
//   doc.text("Website: www.swastya.com", 10, 36);

// ================= HEADER =================
  doc.setFontSize(14);
  doc.setTextColor(128, 0, 0);
  doc.text(appConfig.company.name, 105, 12, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(appConfig.company.address, 103, 17, { align: "center" });
  doc.text(`Contact: ${appConfig.company.contact} , ${appConfig.company.contact2}`, 30, 21, { align: "left" });
  doc.text(`(Email-Id): ${appConfig.company.email}`, 90, 21, { align: "left" });
  doc.text(`PAN: ${appConfig.company.PAN}`, 150, 21, { align: "left" });
  doc.text(`GSTIN: ${appConfig.company.gstNumber} / FSSAI NO: ${appConfig.company.FSSAI_LIC_NO}`, 105, 25, { align: "center" });

   // Invoice Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold"); 
  doc.text("TAX INVOICE", 105, 32, { align: "center" });
  doc.setFont("helvetica", "normal"); 
 
  // ================= CUSTOMER + BILL =================
  doc.setFontSize(9);

  doc.rect(10, 36, 95, 30); // left box
  doc.rect(105, 36, 95, 30); // right box

  doc.setFont("helvetica", "bold");  
  doc.text("NAME OF CUSTOMER", 12, 41);
  doc.setFont("helvetica", "normal");  
  doc.text(customerName || "-", 12, 46);
  doc.text(address || "-", 12, 51);
  doc.text(`GSTIN: ${appConfig.company.gstNumber || "-"}`, 12, 56);

  doc.setFont("helvetica", "bold");  
  doc.text("DELIVERED TO", 107, 41);
  doc.setFont("helvetica", "normal");  
  doc.text(customerName || "-", 107, 46);
  doc.text(address || "-", 107, 51);

  // ================= BILL INFO =================
  doc.rect(10, 66, 190, 12);
  doc.text(`Bill No: ${invoiceNumber}`, 12, 73);
  doc.text(`Date: ${new Date(date).toLocaleDateString()}`, 80, 73);
  doc.text(`Contact: ${contact || "-"}`, 140, 73);

 // ================= TABLE =================
  let startY = 80;

  const headers = ["Sr", "Oil Type", "Packaging Type", "Qty", "Rate", "Amount"];
  const colX = [10, 20, 50, 120, 145, 170];
  const rowHeight = 8;
  const minRows = 2;
  doc.setFillColor(230, 230, 230);
  doc.rect(10, startY, 190, rowHeight, "F");

  doc.setFontSize(9);
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 2, startY + 6);
  });

  let y = startY + rowHeight;
  const totalRows = Math.max(products.length, minRows);
  for (let i = 0; i < totalRows; i++) {
    const p = products[i];
    
    //doc.setLineWidth(0.5); // line thickness
    if (p) {
       doc.rect(10, y, 190, rowHeight);
        doc.text("", colX[0] + 2, y + 6);
        doc.text(p.oilType || "-", colX[1] + 2, y + 6);
        doc.text(p.type || "-", colX[2] + 2, y + 6);
        doc.text(String(p.qty || 0), colX[3] + 2, y + 6);
        let adjustedRate = getAdjustedRate(p.total || 0, p.qty || 0, appConfig.tax.cgst + appConfig.tax.sgst);
        doc.text(`${adjustedRate.toFixed(2)}`, colX[4] + 2, y + 6);
        doc.text(`${p.total || 0}`, colX[5] + 2, y + 6);
        //doc.setLineWidth(1.5);
    }
    else {
        // 👉 Empty row (keeps table height fixed)
        doc.text("", colX[0] + 2, y + 6);
      }
        y += rowHeight;
    }
  //});

  // ===== TOTAL SECTION =====
  let boxY = y + 10;
 // ================= TOTAL =================
  const taxable = grandTotal;
  const cgst = taxable * 0.025;
  const sgst = taxable * 0.025;
  const finalTotal = taxable + cgst + sgst;

  doc.rect(110, y + 5, 90, 35);

  doc.text(`Taxable: ${taxable.toFixed(2)}`, 115, y + 12);
  doc.text(`CGST (2.5%): ${cgst.toFixed(2)}`, 115, y + 18);
  doc.text(`SGST (2.5%): ${sgst.toFixed(2)}`, 115, y + 24);

  doc.setFontSize(10);
  doc.text(`TOTAL: ${finalTotal.toFixed(0)}`, 115, y + 32);

  // Draw a line below Sales Tax
  doc.setLineWidth(0.5); // line thickness
  doc.setFont("helvetica", "bold"); 
  doc.text(`Amount in Words: ${convertToWords(finalTotal)}`, 80, boxY + 40);
  doc.setFont("helvetica", "normal"); 
  doc.setLineWidth(0.5); // line thickness
  doc.line(10, boxY + 45, 200, boxY + 45); // horizontal line
  // ================= BANK =================
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");   // Bold text
  doc.text("BANK DETAILS:", 10, y + 12);
  doc.setFont("helvetica", "normal"); // Back to normal
  doc.text(`A/C Name: ${appConfig.bank.name}`, 10, y + 16);
  doc.text(`Bank: ${appConfig.bank.bank}`, 10, y + 20);
  doc.text(`A/C No: ${appConfig.bank.account}`, 10, y + 24);
  doc.text(`IFSC: ${appConfig.bank.ifsc}`, 10, y + 28);

  // ================= TERMS =================
  doc.setFontSize(7);
  doc.text("Terms & Conditions:", 10, y + 38);

  appConfig.terms.forEach((t: string, i: number) => {
    doc.text(`${i + 1}. ${t}`, 10, y + 42 + i * 4);
  });

//   // ================= TOTAL =================
// const totalTax = cgst + sgst;

// let summaryX = 110;
// let summaryY = y + 5;
// let boxWidth = 90;
// let lineHeight = 6;

// // Box
// doc.rect(summaryX, summaryY, boxWidth, 40);

// // Header
// doc.setFont("helvetica", "bold");
// doc.text("TAX SUMMARY", summaryX + 5, summaryY + 6);

// // Values
// doc.setFont("helvetica", "normal");

// doc.text(`Taxable Value:`, summaryX + 5, summaryY + 14);
// doc.text(`${taxable.toFixed(2)}`, summaryX + 70, summaryY + 14);

// doc.text(`CGST (2.5%):`, summaryX + 5, summaryY + 20);
// doc.text(`${cgst.toFixed(2)}`, summaryX + 70, summaryY + 20);

// doc.text(`SGST (2.5%):`, summaryX + 5, summaryY + 26);
// doc.text(`${sgst.toFixed(2)}`, summaryX + 70, summaryY + 26);

// // Total Tax (NEW SECTION)
// doc.setFont("helvetica", "bold");
// doc.text(`Total Tax:`, summaryX + 5, summaryY + 32);
// doc.text(`${totalTax.toFixed(2)}`, summaryX + 70, summaryY + 32);

// // Final Total line
// doc.setFont("helvetica", "bold");
// doc.text(`Grand Total:`, summaryX + 5, summaryY + 38);
// doc.text(`${finalTotal.toFixed(2)}`, summaryX + 70, summaryY + 38);

// // ================= AMOUNT IN WORDS (separate line below box) =================
// doc.setFont("helvetica", "normal");
// doc.setFontSize(8);

// doc.line(10, summaryY + 45, 200, summaryY + 45);

// doc.text(
//   `Amount in Words: ${convertToWords(finalTotal)}`,
//   10,
//   summaryY + 52
// );

   // ================= SIGNATURE =================
   y = 260;
  doc.setFontSize(9);
  doc.text("For " + appConfig.company.name, 140, y);
  doc.text("Authorized Signatory", 140, y + 20);

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 10, 280);

  // Preview
  const blobUrl = doc.output("bloburl");
  setPdfUrl(blobUrl);
  setShowPreview(true);
};

 const convertToWords = (num: number) => {
    if (!num) return "";
    const [rupees, paise] = num.toString().split(".");
    let words = toWords(Number(rupees)) + " rupees";
    if (paise) {
      words += " and " + toWords(Number(paise)) + " paise";
    }
    return words.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  
const getAdjustedRate = (finalTotal:number, quantity: number, gstPercent: number) => {
  return finalTotal / (quantity * (1 + gstPercent / 100));
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
            setGstNo(appConfig.company.gstNumber);
            setNote(row.note);
            setProducts(row.products.map(p => ({
              oilType: p.oilType,
              type: p.type,
              rate: Number(p.rate),
              qty: Number(p.qty),
              total: Number(p.rate) * Number(p.qty)
            })));
            setTimeout(() => handlePrintPreview(), 0);
            
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
        <input style={styles.input} placeholder="GST No (optional)" value={appConfig.company.gstNumber} onChange={(e) => setGstNo(e.target.value)} readOnly />
      </div>

      <h3>Product Details</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Oil Type</th>
            <th style={styles.th}>Packaging Type</th>
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
                <select
                  style={styles.input}
                  value={item.oilType}
                  onChange={(e) => handleProductChange(index, "oilType", e.target.value)}
                >
                  <option value="">Select Oil Type</option>
                  {oilTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </td>
              <td style={styles.td}>
                <select
                  style={styles.input}
                  value={item.type}
                  onChange={(e) => handleProductChange(index, "type", e.target.value)}
                >
                  <option value="">Select Packaging Type</option>
                  {packagingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </td>
              <td style={styles.td}>
                <input
                  style={styles.input}
                  type="number"
                  value={item.rate}                  
                  onChange={(e) => handleProductChange(index, "rate", e.target.value)}
                />
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
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Oil Type</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Packaging Type</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Qty</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Rate</th>
              <th style={{ padding: '6px', border: '1px solid #ccc' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((p, idx) => (
              <tr key={idx}>
                <td style={{ padding: '6px', border: '1px solid #ccc' }}>{p.oilType}</td>
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