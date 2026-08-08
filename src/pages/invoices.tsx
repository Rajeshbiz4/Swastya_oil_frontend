import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store';
import api, { ApiResponse } from '../services/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import QRCode from "qrcode";

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
  const [irn, setIrn] = useState("");
  const [ackNo, setAckNo] = useState("");
  const [ackDate, setAckDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [stateName, setStateName] = useState(" ");
  const [note, setNote] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [distance, setDistance] = useState("");
  const [ewayBillNumber, setEwayBillNumber] = useState("");
  const [dispatchAddress, setDispatchAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

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
  
  // Load invoices and finished goods inventory for packaging type options
  useEffect(() => {


    dispatch(fetchInvoices());
    dispatch(fetchFinishedGoodsInventory());
  }, [dispatch]);
  useEffect(() => {
  generateInvoiceIds();
}, []);

  const [products, setProducts] = useState<ProductRow[]>([
    { oilType: "", type: "", rate: "", qty: 0, total: 0 }
  ]);

  const generateInvoiceIds = () => {

  setInvoiceNumber(
    `INV-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`
  );

  setIrn(
    `IRN-${Date.now()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`
  );

  setAckNo(
    `ACK-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`
  );

  setEwayBillNumber(
    `EWB-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`
  );

  setAckDate(
    new Date().toLocaleDateString("en-IN")
  );

  setDate(
    new Date().toISOString().split("T")[0]
  );
};



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
      // const response = await api.get<ApiResponse<{ packagingType: string; oilType: string; ratePerUnit: number; averageRate: number; totalRate: number }>>(
      //   `/inventory/packaging/rate/${encodeURIComponent(packagingType)}/${encodeURIComponent(oilType)}`
      // );

      const response = await api.get<ApiResponse<{
        packagingType: string;
        oilType: string;
        ratePerUnit: number;
        averageRate: number;
        totalRate: number;
        packageSize: number;
        finalRate: number;
      }>>(
        `/inventory/packaging/rate/${encodeURIComponent(packagingType)}/${encodeURIComponent(oilType)}`
      );

      // if (response.data && response.data.data) {
      //   const totalRate = response.data.data.totalRate || 0;
      //   setPackagingRateCache((prev) => ({ ...prev, [cacheKey]: totalRate }));
      //   return totalRate;
      // }
      if (response.data && response.data.data) {
        const {
          finalRate,
          totalRate,
          packageSize
        } = response.data.data;

        console.log(
          'Packaging Rate Calculation:',
          {
            packagingType,
            oilType,
            totalRate,
            packageSize,
            finalRate
          }
        );

        const invoiceRate = finalRate ?? 0;

        setPackagingRateCache((prev) => ({
          ...prev,
          [cacheKey]: invoiceRate
        }));

        return invoiceRate;
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

    // if (field === "type") {
    //   if (row.oilType && value) {
    //     const totalRate = await fetchPackagingTypeRate(value, row.oilType);
    //     row.rate = totalRate;
    //   }
    // } else if (field === "oilType") {
    //   if (row.type && value) {
    //     const totalRate = await fetchPackagingTypeRate(row.type, value);
    //     row.rate = totalRate;
    //   }
    // }

    if (field === "type") {
      if (row.oilType && value) {
        const invoiceRate =
          await fetchPackagingTypeRate(
            value,
            row.oilType
          );

        row.rate = invoiceRate;
      }

    } else if (field === "oilType") {

      if (row.type && value) {
        const invoiceRate =
          await fetchPackagingTypeRate(
            row.type,
            value
          );

        row.rate = invoiceRate;
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
    const vehicleRegex =
  /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    try {
      setFormLoading(true);
      const validProducts = products.filter(p => p.oilType && p.type && p.qty > 0);

        if (!/^\d{10}$/.test(contact)) {
  setPopup({
    isOpen: true,
    type: "warning",
    title: "Validation Error",
    message: "Contact number must be 10 digits"
  });
  return;
}

/*
if (!vehicleRegex.test(vehicleNumber)) {
  setPopup({
    isOpen: true,
    type: "warning",
    title: "Validation Error",
    message:
      "Enter valid Vehicle Number (Example: MH15AB1234)"
  });
  return;
}
 

if (!distance || isNaN(Number(distance))) {
  setPopup({
    isOpen: true,
    type: "warning",
    title: "Validation Error",
    message:
      "Distance must be numeric"
  });
  return;
} 
    
*/

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
        irn,
        ackNo,
        ackDate,
        invoiceNumber,
        date,
        customerName,
        contact,
        address,
        gstNo,
        stateName,

        vehicleNumber,
        transporterName,
        driverName,
        distance,
        ewayBillNumber,
        dispatchAddress,
        destinationAddress,
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
      
      console.log("SAVE CLICKED");
      console.log("PAYLOAD =", payload);

        //await dispatch(createInvoice(payload));

      const result = await dispatch(createInvoice(payload));

      console.log("RESULT =", result);  

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
      generateInvoiceIds();

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

// ============================================================
// DROP-IN REPLACEMENT for generateInvoicePdf in InvoicePage.tsx
// Uses jsPDF + jspdf-autotable  —  same imports already present
// ============================================================

const generateInvoicePdf = async (invoiceData?: any) => {
  const data = invoiceData || {
    irn,
    ackNo,
    ackDate,

    invoiceNumber,
    date,
    customerName,
    contact,
    address,
    gstNo,
    stateName,
    products,
    note,
    vehicleNumber,
    transporterName,
    driverName,
    distance,
    ewayBillNumber,
    dispatchAddress,
    destinationAddress,
  };


  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const upiString =
  `upi://pay?pa=${appConfig.bank.upiId}` +
  `&pn=${encodeURIComponent(appConfig.bank.name)}` +
  `&cu=INR`;
  const qrImage = await QRCode.toDataURL(upiString);
  const PW = 210; // page width
  const M  = 10; // margin

  const gstPercent = appConfig.tax.cgst + appConfig.tax.sgst;

  // ── helpers ──────────────────────────────────────────────
  const hLine = (y: number, x1 = M, x2 = PW - M) => {
    doc.setDrawColor(180, 180, 180);
    doc.line(x1, y, x2, y);
  };
  const vLine = (x: number, y1: number, y2: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.line(x, y1, x, y2);
  };
  const box = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(160, 160, 160);
    doc.rect(x, y, w, h);
  };
  const bold   = (sz = 8) => { doc.setFont("helvetica", "bold");   doc.setFontSize(sz); };
  const normal = (sz = 8) => { doc.setFont("helvetica", "normal"); doc.setFontSize(sz); };
  const fmt    = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

 // ================= TOP HEADER =================

bold(15);
doc.setTextColor(0, 0, 0);

doc.text(
  "TAX INVOICE",
  105,
  10,
  { align: "center" }
);

// IRN Details (Left Side)

normal(8);

doc.text("IRN", 10, 22);
doc.text(":", 25, 22);
doc.text(
  data.irn || "-",
  27,
  22
);

doc.text("Ack No.", 10, 28);
doc.text(":", 25, 28);

normal(8);

doc.text(
  data.ackNo || "-",
  27,
  28
);


doc.text("Ack Date", 10, 34);
doc.text(":", 25, 34);
doc.text(
  data.date
    ? new Date(data.date).toLocaleDateString("en-IN")
    : "-",
  27,
  34
);


// QR BOX (Right Side)

doc.rect(165, 7, 35, 32);

bold(8);

doc.text(
  "e-Invoice",
  180,
  5,
  { align: "center" }
);

normal(8);

doc.addImage(
  qrImage,
  "PNG",
  167,
  9,
  30,
  27
);


// Divider Line

doc.setDrawColor(180, 180, 180);
// =================================================
// COMPANY + PARTY DETAILS SECTION - DYNAMIC HEIGHT
// Buyer and Consignee in same row
// =================================================

const sectionTop = 40;

const sectionX = 10;
const sectionW = 190;
const sectionEndX = sectionX + sectionW; // 200

const companyW = 105;
const companyEndX = sectionX + companyW; // 115

const rightX = companyEndX;
const rightW = 85;
const rightMidX = 155;

const partyColW = 95;
const buyerX = sectionX;
const consigneeX = sectionX + partyColW; // 105
const partyDividerX = consigneeX;

const textX = 45;
const lineH = 4;
const smallLineH = 3.8;

const companyPan =
  (appConfig.company as any).PAN ||
  (appConfig.company as any).panNumber ||
  "-";

// ================= MULTILINE VALUES =================

const companyAddressLines = doc.splitTextToSize(
  appConfig.company.address || "-",
  66
);

const buyerAddressLines = doc.splitTextToSize(
  data.address || "-",
  88
);

const consigneeAddressLines = doc.splitTextToSize(
  data.destinationAddress || data.address || "-",
  88
);

const invoiceNoLines = doc.splitTextToSize(
  data.invoiceNumber || "-",
  36
);

const ewayBillLines = doc.splitTextToSize(
  data.ewayBillNumber || "-",
  36
);

const transporterLines = doc.splitTextToSize(
  data.transporterName || "-",
  38
);

// =================================================
// TOP ROW HEIGHT: COMPANY + INVOICE DETAILS
// =================================================

const companyNameY = sectionTop + 5;
const companyAddressY = sectionTop + 11;

const companyGstY =
  companyAddressY + companyAddressLines.length * smallLineH + 3;

const companyPanY = companyGstY + 4;
const companyEmailY = companyPanY + 4;

const topRowHeight = Math.max(
  58,
  companyEmailY + 5 - sectionTop
);

const topRowBottom = sectionTop + topRowHeight;

// =================================================
// PARTY ROW HEIGHT: BUYER + CONSIGNEE SAME ROW
// =================================================

const getPartyBlockHeight = (addressLines: string[]) => {
  return (
    5 + // label
    5 + // customer name
    4 + // party code
    addressLines.length * lineH +
    2 +
    5 + // GST
    5 + // State
    5   // bottom padding
  );
};

const partyStartY = topRowBottom;

const partyRowHeight = Math.max(
  42,
  getPartyBlockHeight(buyerAddressLines),
  getPartyBlockHeight(consigneeAddressLines)
);

const sectionBottom = partyStartY + partyRowHeight;
const sectionHeight = sectionBottom - sectionTop;

// =================================================
// DRAW MAIN STRUCTURE
// =================================================

doc.setDrawColor(160, 160, 160);

// Full outer box
doc.rect(sectionX, sectionTop, sectionW, sectionHeight);

// Top row separator between company and invoice details
doc.line(companyEndX, sectionTop, companyEndX, topRowBottom);

// Separator between top row and buyer/consignee row
doc.line(sectionX, topRowBottom, sectionEndX, topRowBottom);

// Buyer/Consignee vertical divider
doc.line(partyDividerX, partyStartY, partyDividerX, sectionBottom);

// =================================================
// COMPANY DETAILS
// =================================================

// Logo
doc.addImage(
  logo,
  "PNG",
  12,
  sectionTop + 3,
  29,
  15
);

bold(11);
doc.text(
  appConfig.company.name || "-",
  textX,
  companyNameY
);

normal(8);
doc.text(
  companyAddressLines,
  textX,
  companyAddressY
);

normal(8);
doc.text(
  `GST: ${appConfig.company.gstNumber || "-"}`,
  textX,
  companyGstY
);

normal(8);
doc.text(
  `PAN: ${companyPan}`,
  textX,
  companyPanY
);

normal(8);
doc.text(
  appConfig.company.email || "-",
  textX,
  companyEmailY
);

// =================================================
// RIGHT SIDE INVOICE DETAILS
// =================================================

doc.line(rightMidX, sectionTop, rightMidX, topRowBottom);

doc.line(rightX, sectionTop + 18, sectionEndX, sectionTop + 18);
doc.line(rightX, sectionTop + 36, sectionEndX, sectionTop + 36);
doc.line(rightX, sectionTop + 54, sectionEndX, sectionTop + 54);

// Invoice No
bold(8);
doc.text("Invoice No.", rightX + 2, sectionTop + 5);

normal(7);
doc.text(invoiceNoLines, rightX + 2, sectionTop + 10);

// Date
bold(8);
doc.text("Dated", rightMidX + 2, sectionTop + 5);

normal(8);
doc.text(
  data.date ? new Date(data.date).toLocaleDateString("en-IN") : "-",
  rightMidX + 2,
  sectionTop + 10
);

// e-Way Bill
bold(8);
doc.text("e-Way Bill No.", rightX + 2, sectionTop + 23);

normal(7);
doc.text(ewayBillLines, rightX + 2, sectionTop + 28);

// Mode/Terms
bold(8);
doc.text("Mode/Terms", rightMidX + 2, sectionTop + 23);

normal(8);
doc.text("Credit", rightMidX + 2, sectionTop + 28);

// Vehicle No
bold(8);
doc.text("Vehicle No.", rightX + 2, sectionTop + 41);

normal(8);
doc.text(data.vehicleNumber || "-", rightX + 2, sectionTop + 46);

// Transporter
bold(8);
doc.text("Transporter", rightMidX + 2, sectionTop + 41);

normal(7);
doc.text(transporterLines, rightMidX + 2, sectionTop + 46);

// =================================================
// BUYER + CONSIGNEE SAME ROW
// =================================================

const drawPartyBlock = (
  title: string,
  x: number,
  yStart: number,
  name: string,
  addressLines: string[],
  gstNumber: string,
  state: string
) => {
  let y = yStart + 5;

  normal(8);
  doc.text(title, x + 2, y);

  y += 5;
  bold(8);
  doc.text(name || "-", x + 2, y);

  y += 5;
  normal(7.5);
  doc.text("Party Code :", x + 2, y);

  y += 4;
  normal(7.5);
  doc.text(addressLines, x + 2, y);

  y += addressLines.length * lineH + 2;
  normal(7.5);
  doc.text(`GSTIN/UIN : ${gstNumber || "-"}`, x + 2, y);

  y += 5;
  normal(7.5);
  doc.text(`State Name : ${state || "-"}`, x + 2, y);
};

// Buyer left side
drawPartyBlock(
  "Buyer (Bill to) :",
  buyerX,
  partyStartY,
  data.customerName || "-",
  buyerAddressLines,
  data.gstNo || "-",
  data.stateName || "-"
);

// Consignee right side
drawPartyBlock(
  "Consignee (Ship to) :",
  consigneeX,
  partyStartY,
  data.customerName || "-",
  consigneeAddressLines,
  data.gstNo || "-",
  data.stateName || "-"
);

// Product table starts after dynamic full section
const csBottom = sectionBottom;


  // ── PRODUCT TABLE ──────────────────────────────────────

  const productRows = data.products.map((p: any, i: number) => {
    const total       = Number(p.total) || Number(p.rate) * Number(p.qty);
    const taxableAmt  = total / (1 + gstPercent / 100);
    const actualRate  = taxableAmt / (Number(p.qty) || 1);
    return [
      p.oilType || "-",
      getHSNCodeForOilType(p.oilType) || "-",
      p.qty || 0,
      fmt(p.rate || 0),
      fmt(total),
      fmt(actualRate),
      "Nos",
      fmt(taxableAmt),
    ];
  });

  const taxable    = data.products.reduce((s: number, p: any) => {
    const tot = Number(p.total) || Number(p.rate) * Number(p.qty);
    return s + tot / (1 + gstPercent / 100);
  }, 0);
  const cgst       = taxable * (appConfig.tax.cgst / 100);
  const sgst       = taxable * (appConfig.tax.sgst / 100);
  const totalTax   = cgst + sgst;
  const finalTotal = taxable + totalTax;

  const tableBody = [
    ...productRows,
    
     
  ];

  autoTable(doc, {
    startY: csBottom,
    startX: M,
    head: [[
      "Description of Goods",
      "HSN",
      "Qty",
      "Unit Rate",
      "Inclusive Tax Rate",
      "Taxable Rate",
      "per",
      "Taxable Value"
    ]],
    body: tableBody,
    styles: { fontSize: 6.5, cellPadding: 1.5, valign: "middle", overflow: "ellipsize", lineColor: [255, 255, 255], lineWidth: 0 },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: "bold", fontSize: 7, halign: "center", valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.2 },
    theme: "plain",
    tableWidth: "fixed",
    margin: { left: M, right: M },
    columnStyles: {
      0: { cellWidth: 70, halign: "left", borderRight: { width: 0.2, color: [0, 0, 0] } },
      1: { cellWidth: 14, halign: "center", borderRight: { width: 0.2, color: [0, 0, 0] } },
      2: { cellWidth: 10, halign: "right", borderRight: { width: 0.2, color: [0, 0, 0] } },
      3: { cellWidth: 16, halign: "right", borderRight: { width: 0.2, color: [0, 0, 0] } },
      4: { cellWidth: 32, halign: "right", borderRight: { width: 0.2, color: [0, 0, 0] } },
      5: { cellWidth: 14, halign: "right", borderRight: { width: 0.2, color: [0, 0, 0] } },
      6: { cellWidth: 10, halign: "center", borderRight: { width: 0.2, color: [0, 0, 0] } },
      7: { cellWidth: 24, halign: "right" },
    },
  });
const tableEndY = (doc as any).lastAutoTable.finalY;

bold(8);

doc.text(
  fmt(taxable),
  M + 188,
  tableEndY + 6,
  { align: "right" }
);

let taxY = tableEndY + 18;

doc.text("Output CGST 2.5%", 50, taxY);
doc.text("2.50", 160, taxY);
doc.text("%", 170, taxY);
doc.text(fmt(cgst), 195, taxY, { align: "right" });

taxY += 8;

doc.text("Output SGST 2.5%", 50, taxY);
doc.text("2.50", 160, taxY);
doc.text("%", 170, taxY);
doc.text(fmt(sgst), 195, taxY, { align: "right" });

taxY += 8;

doc.text("Round Off - Sales", 50, taxY);
doc.text("0.00", 195, taxY, { align: "right" });


  // Add outer borders manually
const tableStartY = csBottom;
const fixedTableBottom = Math.max(210, csBottom + 75);

// Fixed bottom where Total row should start
 
if (tableEndY < fixedTableBottom) {
  doc.line(M, tableStartY, M, fixedTableBottom);
  doc.line(M + 190, tableStartY, M + 190, fixedTableBottom);

  // column lines
  let xPos = M;
  const colWidths = [70, 14, 10, 16, 32, 14, 10, 24];

  for (let i = 0; i < colWidths.length - 1; i++) {
    xPos += colWidths[i];
    doc.line(xPos, tableStartY, xPos, fixedTableBottom);
  }

  doc.line(M, fixedTableBottom, M + 190, fixedTableBottom);
}

let totalRowY = fixedTableBottom;


// ── TOTAL ROW (Separate) ────────────────────────────────

  doc.setDrawColor(0);
  doc.setLineWidth(0);
  
  // Total row outer borders
  doc.rect(M, totalRowY, 190, 8);
  
  // Vertical lines for columns
  let xPos = M;
  const colWidths = [70, 14, 10, 16, 32, 14, 10, 24];
  for (let i = 0; i < colWidths.length - 1; i++) {
    xPos += colWidths[i];
    doc.line(xPos, totalRowY, xPos, totalRowY + 8);
  }

  bold(8);
  doc.text("Total", M + 2, totalRowY + 4.5, { valign: "middle" });
  
  // Amount in the last column, right-aligned
  bold(10);
  doc.setCharSpace(0);
  doc.text(
  `${fmt(finalTotal)}`,
  196,
  totalRowY + 5,
  { align: "right" }
);
  let finalY = totalRowY + 2;

  // Amount in words
  finalY += 6;

  doc.rect(10, finalY, 190, 9);

  bold(8);
  doc.text(
    "Amount Chargeable (in words)",
    12,
    finalY + 4
  );

  bold(10);
  doc.text(
    `${convertToWords(Math.round(finalTotal))} Only`,
    12,
    finalY + 8
  );

  finalY += 9;

  // ── GST SUMMARY TABLE ──────────────────────────────────

  autoTable(doc, {
  startY: finalY,
  startX: M,
  tableWidth: 190,
  margin: { left: M, right: M },

  head: [
    [
      { content: "HSN/SAC", rowSpan: 2 },
      { content: "Taxable\nValue", rowSpan: 2 },
      { content: "Central Tax", colSpan: 2 },
      { content: "State Tax", colSpan: 2 },
      { content: "Total\nTax Amount", rowSpan: 2 }
    ],
    [
      "Rate",
      "Amount",
      "Rate",
      "Amount"
    ]
  ],

  body: [[
    getHSNCodeForOilType(data.products[0]?.oilType || ""),
    fmt(taxable),
    `${appConfig.tax.cgst}%`,
    fmt(cgst),
    `${appConfig.tax.sgst}%`,
    fmt(sgst),
    fmt(totalTax)
  ]],

  foot: [[
    "Total",
    fmt(taxable),
    "",
    fmt(cgst),
    "",
    fmt(sgst),
    fmt(totalTax)
  ]],

  theme: "grid",

  styles: {
    fontSize: 7,
    cellPadding: 0.8,
    lineColor: [0, 0, 0],
    lineWidth: 0.2,
    textColor: 0,
    valign: "middle"
  },

  headStyles: {
    fillColor: [255, 255, 255],
    textColor: 0,
    fontStyle: "bold",
    halign: "center",
    valign: "middle",
    fontSize: 7
  },

  footStyles: {
    fillColor: [255, 255, 255],
    textColor: 0,
    fontStyle: "bold",
    fontSize: 7
  },

  columnStyles: {
  0: { cellWidth: 45, halign: "left" },
  1: { cellWidth: 32, halign: "right" },

  2: { cellWidth: 16, halign: "center" },
  3: { cellWidth: 27, halign: "right" },

  4: { cellWidth: 16, halign: "center" },
  5: { cellWidth: 27, halign: "right" },

  6: { cellWidth: 27, halign: "right" }
}

});


  finalY = (doc as any).lastAutoTable.finalY;
  const decY = finalY;

  doc.rect(10, decY, 190, 37);

bold(8);
doc.text(
  "Tax Amount (in words) :",
  12,
  decY + 4
);

const taxAmountInWords =
  totalTax > 0
    ? `${convertToWords(Math.round(totalTax))} Only`
    : "";

normal(8);
doc.text(
  taxAmountInWords,
  45,
  decY + 4
);

bold(8);
doc.text(
  "Remarks:",
  12,
  decY + 8
);

normal(10);
doc.text(
  String(data.vehicleNumber || ""),
  12,
  decY + 12
);

bold(8);
doc.text(
  "Company's PAN",
  12,
  decY + 16
);

doc.text(
  ":",
  36,
  decY + 16
);

bold(8);
doc.text(
  appConfig.company.PAN,
  40,
  decY + 16
);

bold(10);

doc.text(
  "Declaration",
  12,
  decY + 20
);

normal(8)
doc.text(
  appConfig.invoice.termsAndConditions,
  12,
  decY + 23,
  {
    lineGap:0.5
  }
);

// ================= RIGHT =================

bold(10);
doc.text(
  `for ${appConfig.company.name}`,
  170,
  decY + 20,
  { align: "center" }
);

// Signatory
normal(7);
doc.text(
  "Authorised Signatory",
  170,
  decY + 30,
  { align: "center" }
);
 finalY = decY + 37;

normal(7);

doc.text(
  "SUBJECT TO PUNE JURISDICTION",
  PW / 2,
  286,
  { align: "center" }
);

doc.setTextColor(120, 120, 120);

doc.text(
  "This is a Computer Generated Invoice",
  PW / 2,
  290,
  { align: "center" }
);

doc.setTextColor(0, 0, 0);


  // Footer page 2
  normal(7);

doc.text(
  "SUBJECT TO PUNE JURISDICTION",
  PW / 2,
  286,
  { align: "center" }
);

doc.setTextColor(120, 120, 120);

doc.text(
  "This is a Computer Generated Invoice",
  PW / 2,
  290,
  { align: "center" }
);

doc.setTextColor(0, 0, 0);

  return doc;
};

  const handlePrintPreview = async (invoiceData?: any) => {
  const data = invoiceData || {
    irn,
    ackNo,
    ackDate,
    invoiceNumber,
    date,
    customerName,
    contact,
    address,
    gstNo,
    stateName,
    products,
    note,

    vehicleNumber,
    transporterName,
    driverName,
    distance,
    ewayBillNumber,
    dispatchAddress,
    destinationAddress
  };

  setSelectedInvoiceForPdf(data);

  const doc = await generateInvoicePdf(data);
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
      stateName,
      products,
      note,
      vehicleNumber,
      transporterName,
      driverName,
      distance,
      ewayBillNumber,
      dispatchAddress,
      destinationAddress
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

    const doc = await generateInvoicePdf(data);
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
          onClick={async() => {
            const invoiceData = {
              irn,
              ackNo,
              ackDate,
              invoiceNumber: row.invoiceNumber,
              date: row.date,
              customerName: row.customerName,
              contact: row.contact,
              address: row.address,
              gstNo: row.gstNo || "-",
              stateName: row.stateName || "-",
              note: row.note || row.remarks || "",
              vehicleNumber: row.vehicleNumber,
              transporterName: row.transporterName,
              driverName: row.driverName,
              distance: row.distance,
              ewayBillNumber: row.ewayBillNumber,
              dispatchAddress: row.dispatchAddress,
              destinationAddress: row.destinationAddress,
              products: row.products.map((p: any) => ({
                oilType: p.oilType,
                type: p.type,
                rate: Number(p.rate),
                qty: Number(p.qty),
                total: Number(p.total) || Number(p.rate) * Number(p.qty),
                
              })),
            };
            console.log("invoiceData =", invoiceData);
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
  <input
    style={styles.input}
    value={invoiceNumber}
    readOnly
  />

  <input
    style={styles.input}
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
  />
</div>

<div style={styles.row}>
  <input
    style={styles.input}
    placeholder="Customer Name"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
  />

  <input
  style={styles.input}
  placeholder="Contact"
  maxLength={10}
  value={contact}
  onChange={(e) =>
    setContact(
      e.target.value.replace(/\D/g, "")
    )
  }
/>
</div>


      <div style={styles.row}>
  <input
    style={styles.input}
    placeholder="Address"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />

  <input
    style={styles.input}
    placeholder="GST No"
    value={gstNo}
    onChange={(e) => setGstNo(e.target.value)}
  />

  <select
    style={styles.input}
    value={stateName}
    onChange={(e) => setStateName(e.target.value)}
  >
    <option value="">Select State</option>
    <option value="Maharashtra">Maharashtra</option>
    <option value="Gujarat">Gujarat</option>
    <option value="Madhya Pradesh">Madhya Pradesh</option>
    <option value="Rajasthan">Rajasthan</option>
    <option value="Karnataka">Karnataka</option>
    <option value="Telangana">Telangana</option>
    <option value="Uttar Pradesh">Uttar Pradesh</option>
  </select>
</div>
         

<div style={styles.row}>
  <input
    style={styles.input}
    placeholder="Vehicle Number"
    value={vehicleNumber}
    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
  />

  <input
  style={styles.input}
  value={ewayBillNumber}
  readOnly
  />

<div style={styles.row}>
  <input
    style={styles.input}
    placeholder="Transporter Name"
    value={transporterName}
    onChange={(e) => setTransporterName(e.target.value)}
  />
</div>
  <input
    style={styles.input}
    placeholder="Driver Name"
    value={driverName}
    onChange={(e) => setDriverName(e.target.value)}
  />
</div>

<div style={styles.row}>
  <input
  style={styles.input}
  placeholder="Distance (KM)"
  value={distance}
  onChange={(e) =>
    setDistance(
      e.target.value.replace(/\D/g, "")
    )
  }
/>
</div>

<div style={styles.row}>
  <textarea
    style={styles.input}
    rows={2}
    placeholder="Dispatch Address"
    value={dispatchAddress}
    onChange={(e) => setDispatchAddress(e.target.value)}
  />

  <textarea
    style={styles.input}
    rows={2}
    placeholder="Destination Address"
    value={destinationAddress}
    onChange={(e) => setDestinationAddress(e.target.value)}
  />
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
            onClick={async() => {
              const data = selectedInvoiceForPdf || {
                invoiceNumber,
                date,
                customerName,
                contact,
                address,
                gstNo,
                stateName,
                products,
                note, 
                vehicleNumber, 
                transporterName,
                driverName,
                distance,
                ewayBillNumber,
                dispatchAddress,
                destinationAddress
              };

              const doc = await generateInvoicePdf(data);
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

      <button style={{ ...styles.button, ...styles.primaryBtn, marginTop: 10, marginBottom: 10 }} onClick={() => {
  generateInvoiceIds();
  setShowForm(true);
}}>
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