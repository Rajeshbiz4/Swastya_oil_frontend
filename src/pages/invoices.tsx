import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store';
import api, { ApiResponse } from '../services/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { time } from 'node:console';
import { timeStamp } from 'node:console';

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

  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<any | null>(null);

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
    packagingTypes.push("14 Liter Cane");
  // Load invoices and finished goods inventory for packaging type options
  useEffect(() => {


    dispatch(fetchInvoices());
    dispatch(fetchFinishedGoodsInventory());
  }, [dispatch]);

  const [products, setProducts] = useState<ProductRow[]>([
    { oilType: "", type: "", rate: "", qty: 0, total: 0 }
  ]);

  const randomInvoiceNo =
  `INV-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  useEffect(() => {
    setInvoiceNumber(randomInvoiceNo);
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

const getHSNCodeForOilType = (oilType: string): string => {
  //read code from appConfig based on oil type
  const hsnCodes = appConfig.products.hsnCodes;
  switch (oilType.toLowerCase()) {  
    case 'coconut_oil':
      return hsnCodes.COCONUT_OIL;
    case 'sunflower_oil':
      return hsnCodes.SUNFLOWER_OIL;
    case 'soyabean_oil':
      return hsnCodes.SOYABEAN_OIL;
    case 'mustard_oil':
      return hsnCodes.MUSTARD_OIL;
    case 'groundnut_oil':
      return hsnCodes.GROUNDNUT_OIL;
    case 'olive_oil':
      return hsnCodes.OLIVE_OIL;
  }
  return hsnCodes.DEFAULT;
};

const generateInvoicePdf = (invoiceData?: any) => {
  const data = invoiceData || {
    invoiceNumber,
    date,
    customerName,
    contact,
    address,
    gstNo,
    products,
    note
  };

  const doc = new jsPDF();

  // ================= HEADER =================
  doc.setFontSize(14);
  doc.setTextColor(128, 0, 0);
  doc.text(appConfig.company.name, 105, 12, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  doc.text(appConfig.company.address, 105, 17, { align: "center" });
  doc.text(`Contact: ${appConfig.company.contact}, ${appConfig.company.contact2}`, 10, 22);
  doc.text(`Email: ${appConfig.company.email}`, 105, 22, { align: "center" });
  doc.text(`PAN: ${appConfig.company.PAN}`, 170, 22, { align: "right" });

  doc.text(
    `GSTIN: ${appConfig.company.gstNumber} / FSSAI NO: ${appConfig.company.FSSAI_LIC_NO}`,
    105,
    27,
    { align: "center" }
  );

  // ================= TITLE =================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 34, { align: "center" });
  doc.setFont("helvetica", "normal");

  // ================= CUSTOMER BOX =================
  doc.rect(10, 38, 95, 32);
  doc.rect(105, 38, 95, 32);

  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Buyer (Bill To)", 12, 44);

  doc.setFont("helvetica", "normal");
  doc.text(data.customerName || "-", 12, 50);
  doc.text(data.address || "-", 12, 56);
  doc.text(`GSTIN/UIN : ${data.gstNo || "-"}`, 12, 62);

  doc.setFont("helvetica", "bold");
  doc.text("Consignee (Ship To)", 107, 44);

  doc.setFont("helvetica", "normal");
  doc.text(data.customerName || "-", 107, 50);
  doc.text(data.address || "-", 107, 56);

  // ================= INVOICE INFO =================
  doc.rect(10, 70, 190, 16);

  doc.setFontSize(8);
  doc.text(`Invoice No: ${data.invoiceNumber}`, 12, 77);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 80, 77);
  doc.text(`Contact: ${data.contact || "-"}`, 145, 77);

  // ================= PRODUCT TABLE =================
  const gstPercent = appConfig.tax.cgst + appConfig.tax.sgst;

  const tableBody = data.products.map((p: any, index: number) => {
    const total = Number(p.total) || Number(p.rate) * Number(p.qty);
    const taxableAmount = total / (1 + gstPercent / 100);
    const actualRate = taxableAmount / Number(p.qty || 1);

    return [
      index + 1,
      p.oilType || "-",
      p.type || "-",
      getHSNCodeForOilType(p.oilType) || "-",
      p.qty || 0,
      (taxableAmount * (appConfig.tax.cgst / 100)).toFixed(2),
      (taxableAmount * (appConfig.tax.sgst / 100)).toFixed(2),
      actualRate.toFixed(2),
      taxableAmount.toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: 90,
    head: [[
      "Sr",
      "Description of Goods",
      "Packing",
      "HSN/SAC",
      "Qty",
      `CGST (${appConfig.tax.cgst}%)`,
      `SGST (${appConfig.tax.sgst}%)`,
      "Rate",
      "Amount",
    ]],
    body: tableBody,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontStyle: "bold",
    },
    theme: "grid",
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { halign: "center", cellWidth: 25 },
      4: { halign: "right", cellWidth: 15 },
      5: { halign: "right", cellWidth: 15 },
      6: { halign: "right", cellWidth: 15 },
      7: { halign: "right", cellWidth: 15 },
      8: { halign: "right", cellWidth: 30 },
    },
  });

  // ================= TOTALS =================
  const taxable = data.products.reduce((sum: number, p: any) => {
    const total = Number(p.total) || Number(p.rate) * Number(p.qty);
    return sum + total / (1 + gstPercent / 100);
  }, 0);

  const cgst = taxable * (appConfig.tax.cgst / 100);
  const sgst = taxable * (appConfig.tax.sgst / 100);
  const totalTax = cgst + sgst;
  const finalTotal = taxable + totalTax;

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // ================= GST SUMMARY TABLE =================
  autoTable(doc, {
    startY: finalY,
    head: [[
      "Taxable Value",
      `CGST (${appConfig.tax.cgst}%)`,
      `SGST (${appConfig.tax.sgst}%)`,
      "Total Tax",
    ]],
    body: [[
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      totalTax.toFixed(2),
    ]],
    foot: [[
      "Total",
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      totalTax.toFixed(2),
    ]],
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: "bold",
    },
    theme: "grid",
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // ================= GRAND TOTAL =================
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total :  ${finalTotal.toFixed(2)}`, 135, finalY);

  // ================= AMOUNT IN WORDS =================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    `Amount Chargeable (in words): ${convertToWords(Math.round(finalTotal))} Rupees Only`,
    10,
    finalY + 8
  );

  // ================= BANK DETAILS =================
  let bankY = finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.text("BANK DETAILS", 10, bankY);

  doc.setFont("helvetica", "normal");
  doc.text(`A/C Name : ${appConfig.bank.name}`, 10, bankY + 6);
  doc.text(`Bank : ${appConfig.bank.bank}`, 10, bankY + 12);
  doc.text(`A/C No : ${appConfig.bank.account}`, 10, bankY + 18);
  doc.text(`IFSC : ${appConfig.bank.ifsc}`, 10, bankY + 24);

  // ================= TERMS & CONDITIONS =================
  let termsY = bankY + 45;

  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions:", 10, termsY);

  doc.setFont("helvetica", "normal");

  appConfig.terms.forEach((term: string, index: number) => {
    doc.text(`${index + 1}. ${term}`, 10, termsY + 7 + index * 6);
  });

  // ================= SIGNATURE =================
  doc.setFont("helvetica", "bold");

  doc.text(`For ${appConfig.company.name}`, 145, termsY + 20);
  doc.text("Authorized Signatory", 145, termsY + 45);

  // ================= FOOTER =================
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("This is a Computer Generated Invoice", 10, 285);

  return doc;
};

const handlePrintPreview = (invoiceData?: any) => {
  const data = invoiceData || {
    invoiceNumber,
    date,
    customerName,
    contact,
    address,
    gstNo,
    products,
    note
  };

  setSelectedInvoiceForPdf(data);

  const doc = generateInvoicePdf(data);
  const blobUrl:any = doc.output("bloburl");

  setPdfUrl(blobUrl);
  setShowPreview(true);
};

const handleShareInvoiceOnWhatsApp = async () => {
  try {
    const data = selectedInvoiceForPdf || {
      invoiceNumber,
      date,
      customerName,
      contact,
      address,
      gstNo,
      products,
      note
    };

    if (!data.products || data.products.length === 0) {
      setPopup({
        isOpen: true,
        type: "warning",
        title: "Invoice Not Ready",
        message: "Please open invoice preview first before sharing."
      });
      return;
    }

    const doc = generateInvoicePdf(data);
    const pdfBlob = doc.output("blob");

    const file = new File(
      [pdfBlob],
      `Invoice_${data.invoiceNumber || "invoice"}.pdf`,
      { type: "application/pdf" }
    );

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Invoice PDF",
        text: `Invoice #${data.invoiceNumber} for ${data.customerName || "Customer"}`
      });

      setPopup({
        isOpen: true,
        type: "success",
        title: "Invoice Shared",
        message: "Invoice PDF shared successfully."
      });
    } else {
      doc.save(`Invoice_${data.invoiceNumber || "invoice"}.pdf`);

      setPopup({
        isOpen: true,
        type: "warning",
        title: "Sharing Not Supported",
        message: "Direct sharing is not supported on this device. Invoice downloaded instead."
      });
    }
  } catch (err: any) {
    console.error("Error sharing invoice:", err);

    setPopup({
      isOpen: true,
      type: "error",
      title: "Share Failed",
      message: err.message || "Failed to share invoice PDF."
    });
  }
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

  const getTaxExclusiveValues = (inclusiveTotal:number, qty:number, gstPercent:any = 5) => {
    const taxableAmount = inclusiveTotal / (1 + gstPercent / 100);
    const actualRate = taxableAmount / qty;

    return {
      taxableAmount,
      actualRate,
    };
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
    // { key: 'rate', title: 'Rate', render: (v: number) => `${v}` },
    {
  key: 'products', // must match your data field
  title: 'Total',
  render: (products: { type: string; rate: number; qty: number }[]) => {
    if (!products || products.length === 0) return "0";

    const total = products.reduce((sum, p) => {
      const rate = Number(p.rate) || 0;
      const qty = Number(p.qty) || 0;
      return sum + rate * qty;
    }, 0);

    return `${total}`;
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
          <button
          style={{ ...styles.button, ...styles.primaryBtn }}
          onClick={() => {
            const invoiceData = {
              invoiceNumber: row.invoiceNumber,
              date: row.date,
              customerName: row.customerName,
              contact: row.contact,
              address: row.address,
              gstNo: row.gstNo || "-",
              note: row.note || row.remarks || "",
              products: row.products.map((p: any) => ({
                oilType: p.oilType,
                type: p.type,
                rate: Number(p.rate),
                qty: Number(p.qty),
                total: Number(p.total) || Number(p.rate) * Number(p.qty),
              })),
            };

            handlePrintPreview(invoiceData);
          }}
        >
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
        <input style={styles.input} placeholder="GST No" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
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
        <button style={{ ...styles.button, ...styles.primaryBtn }}  onClick={() => handlePrintPreview()}>Print</button>
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
              onClick={handleShareInvoiceOnWhatsApp}
            >
              Share on WhatsApp
            </button>

           <button
            style={{ ...styles.button, ...styles.primaryBtn }}
            onClick={() => {
              const data = selectedInvoiceForPdf || {
                invoiceNumber,
                date,
                customerName,
                contact,
                address,
                gstNo,
                products,
                note
              };

              const doc = generateInvoicePdf(data);
              doc.save(`Invoice_${data.invoiceNumber || "invoice"}.pdf`);
            }}
          >
            Download
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