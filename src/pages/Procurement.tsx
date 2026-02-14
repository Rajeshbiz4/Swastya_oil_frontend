import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { FormField, PaymentMode, SKUSize, PackagingType } from '../types';
import { 
  bookingAPI, 
  oilPurchaseAPI, 
  packagingPurchaseAPI, 
  TankerBooking, 
  OilPurchase, 
  PackagingPurchase,
  PurchaseSummary
} from '../services/api';
import './Pages.css';

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'oil' | 'packaging'>('oil');
  const [showForm, setShowForm] = useState(false);
  const [oilPurchases, setOilPurchases] = useState<OilPurchase[]>([]);
  const [packagingPurchases, setPackagingPurchases] = useState<PackagingPurchase[]>([]);
  const [pendingBookings, setPendingBookings] = useState<TankerBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TankerBooking | null>(null);
  const [oilSummary, setOilSummary] = useState<PurchaseSummary | null>(null);
  const [packagingSummary, setPackagingSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form data
  const [oilFormData, setOilFormData] = useState({
    bookingId: '',
    supplierName: '',
    quantity: 0,
    ratePerLiter: 0,
    paymentMode: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
  });

  const [packagingFormData, setPackagingFormData] = useState({
    supplierName: '',
    skuSize: '',
    packagingType: '',
    quantity: 0,
    ratePerUnit: 0,
    paymentMode: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
  });

  // Field errors
  const [oilFormErrors, setOilFormErrors] = useState<Record<string, string>>({});
  const [packagingFormErrors, setPackagingFormErrors] = useState<Record<string, string>>({});

  // Fetch pending bookings from backend
  const fetchPendingBookings = async () => {
    try {
      const response = await bookingAPI.getAll({ status: 'Pending' });
      if (response.data.success) {
        setPendingBookings(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending bookings:', err);
    }
  };

  // Fetch oil purchases from backend
  const fetchOilPurchases = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 }; // Get more records for now
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await oilPurchaseAPI.getAll(params);
      if (response.data.success) {
        setOilPurchases(response.data.data.purchases || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch oil purchases');
    } finally {
      setLoading(false);
    }
  };

  // Fetch oil purchase summary
  const fetchOilSummary = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await oilPurchaseAPI.getSummary(params);
      if (response.data.success) {
        setOilSummary(response.data.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to fetch oil summary:', err);
    }
  };

  // Fetch packaging purchases from backend
  const fetchPackagingPurchases = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 }; // Get more records for now
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await packagingPurchaseAPI.getAll(params);
      if (response.data.success) {
        setPackagingPurchases(response.data.data.purchases || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch packaging purchases');
    } finally {
      setLoading(false);
    }
  };

  // Fetch packaging purchase summary
  const fetchPackagingSummary = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await packagingPurchaseAPI.getSummary(params);
      if (response.data.success) {
        setPackagingSummary(response.data.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to fetch packaging summary:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'oil') {
      fetchOilPurchases();
      fetchOilSummary();
      fetchPendingBookings();
    } else {
      fetchPackagingPurchases();
      fetchPackagingSummary();
    }
  }, [activeTab, startDate, endDate]);

  // Handle booking selection
  const handleBookingSelect = (bookingId: string) => {
    const booking = pendingBookings.find(b => b._id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setOilFormData(prev => ({
        ...prev,
        bookingId: booking._id,
        quantity: booking.tankerCapacity,
        ratePerLiter: booking.rate,
        deliveryDate: new Date(booking.bookingDate).toISOString().split('T')[0],
      }));
    } else {
      setSelectedBooking(null);
      setOilFormData(prev => ({
        ...prev,
        bookingId: '',
        quantity: 0,
        ratePerLiter: 0,
      }));
    }
  };

  // Calculate total amount for oil purchase
  const calculatedOilAmount = oilFormData.quantity * oilFormData.ratePerLiter;

  // Form fields for oil (with booking selection)
  const oilFormFields: FormField[] = [
    { 
      name: 'bookingId', 
      label: 'Select Booking', 
      type: 'select', 
      required: false,
      options: [
        { value: '', label: '-- Select a Booking (Optional) --' },
        ...pendingBookings.map(booking => ({
          value: booking._id,
          label: `${new Date(booking.bookingDate).toLocaleDateString()} - ${booking.tankerCapacity.toLocaleString()}KG @ ₹${booking.rate}/KG (Pending: ₹${booking.pendingAmount.toLocaleString()})`
        }))
      ]
    },
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity (KG)', type: 'number', required: true, min: '10000', max: '20000' },
    { name: 'ratePerLiter', label: 'Rate per KG', type: 'number', required: true, min: '0.01', step: '0.01' },
    { 
      name: 'paymentMode', 
      label: 'Payment Mode', 
      type: 'select', 
      required: true,
      options: [
        { value: PaymentMode.CASH, label: 'Cash' },
        { value: PaymentMode.CREDIT, label: 'Credit' }
      ]
    },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
  ];

  const packagingFormFields: FormField[] = [
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
    { 
      name: 'skuSize', 
      label: 'SKU Size', 
      type: 'select', 
      required: true,
      options: Object.values(SKUSize).map(size => ({ value: size, label: size }))
    },
    { 
      name: 'packagingType', 
      label: 'Packaging Type', 
      type: 'select', 
      required: true,
      options: Object.values(PackagingType).map(type => ({ value: type, label: type }))
    },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: '1' },
    { name: 'ratePerUnit', label: 'Rate per Unit', type: 'number', required: true, min: '0.01', step: '0.01' },
    { 
      name: 'paymentMode', 
      label: 'Payment Mode', 
      type: 'select', 
      required: true,
      options: [
        { value: PaymentMode.CASH, label: 'Cash' },
        { value: PaymentMode.CREDIT, label: 'Credit' }
      ]
    },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
  ];

  // Table columns
  const oilColumns = [
    { key: 'supplierName', title: 'Supplier', sortable: true },
    { key: 'quantity', title: 'Quantity (KG)', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'ratePerLiter', title: 'Rate/KG', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
    { key: 'paymentMode', title: 'Payment', sortable: true },
    { key: 'invoiceNumber', title: 'Invoice #', sortable: true },
    { key: 'deliveryDate', title: 'Delivery Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { 
      key: 'isPaid', 
      title: 'Status', 
      render: (value: boolean, row: OilPurchase) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            backgroundColor: value ? '#d4edda' : '#fff3cd',
            color: value ? '#155724' : '#856404',
            fontSize: '0.8rem'
          }}>
            {value ? '✅ Paid' : '⏳ Pending'}
          </span>
          {row.paymentMode === 'Credit' && (
            <button
              onClick={() => handlePaymentStatusToggle(row._id, !value)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                backgroundColor: value ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {value ? 'Mark Unpaid' : 'Mark Paid'}
            </button>
          )}
        </div>
      )
    },
  ];

  const packagingColumns = [
    { key: 'supplierName', title: 'Supplier', sortable: true },
    { key: 'skuSize', title: 'SKU Size', sortable: true },
    { key: 'packagingType', title: 'Type', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'ratePerUnit', title: 'Rate/Unit', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
    { key: 'paymentMode', title: 'Payment', sortable: true },
    { key: 'deliveryDate', title: 'Delivery Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { 
      key: 'isPaid', 
      title: 'Status', 
      render: (value: boolean, row: PackagingPurchase) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            backgroundColor: value ? '#d4edda' : '#fff3cd',
            color: value ? '#155724' : '#856404',
            fontSize: '0.8rem'
          }}>
            {value ? '✅ Paid' : '⏳ Pending'}
          </span>
          {row.paymentMode === 'Credit' && (
            <button
              onClick={() => handlePackagingPaymentStatusToggle(row._id, !value)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem',
                backgroundColor: value ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {value ? 'Mark Unpaid' : 'Mark Paid'}
            </button>
          )}
        </div>
      )
    },
  ];

  // Form handlers
  const handleOilFormChange = (name: string, value: any) => {
    if (name === 'bookingId') {
      handleBookingSelect(value);
    } else {
      setOilFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePackagingFormChange = (name: string, value: any) => {
    setPackagingFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetOilForm = () => {
    setOilFormData({
      bookingId: '',
      supplierName: '',
      quantity: 0,
      ratePerLiter: 0,
      paymentMode: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
    });
    setSelectedBooking(null);
    setOilFormErrors({});
  };

  const resetPackagingForm = () => {
    setPackagingFormData({
      supplierName: '',
      skuSize: '',
      packagingType: '',
      quantity: 0,
      ratePerUnit: 0,
      paymentMode: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
    });
    setPackagingFormErrors({});
  };

  const handleOilFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!oilFormData.supplierName.trim()) {
      errors.supplierName = 'Supplier name is required';
    }
    if (!oilFormData.quantity || oilFormData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    if (oilFormData.quantity < 10000 || oilFormData.quantity > 20000) {
      errors.quantity = 'Quantity must be between 10,000 and 20,000 liters';
    }
    if (!oilFormData.ratePerLiter || oilFormData.ratePerLiter <= 0) {
      errors.ratePerLiter = 'Rate must be greater than 0';
    }
    if (!oilFormData.paymentMode) {
      errors.paymentMode = 'Payment mode is required';
    }
    if (!oilFormData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    if (!oilFormData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }
    if (!oilFormData.deliveryDate) {
      errors.deliveryDate = 'Delivery date is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setOilFormErrors(errors);
      return;
    }
    
    try {
      setFormLoading(true);
      setOilFormErrors({});
      setError(null);
      
      // Create oil purchase using backend API
      const response = await oilPurchaseAPI.create({
        supplierName: oilFormData.supplierName,
        quantity: oilFormData.quantity,
        ratePerLiter: oilFormData.ratePerLiter,
        paymentMode: oilFormData.paymentMode,
        invoiceNumber: oilFormData.invoiceNumber,
        invoiceDate: oilFormData.invoiceDate,
        deliveryDate: oilFormData.deliveryDate,
      });
      
      if (response.data.success) {
        setShowForm(false);
        setSuccess('Oil purchase created successfully!');
        setTimeout(() => setSuccess(null), 3000);
        resetOilForm();
        fetchOilPurchases();
        fetchOilSummary();
        fetchPendingBookings();
        
        // If a booking was selected, update the booking payment
        if (selectedBooking) {
          try {
            await bookingAPI.updatePayment(selectedBooking._id, calculatedOilAmount);
          } catch (bookingErr) {
            console.error('Failed to update booking payment:', bookingErr);
          }
        }
      }
      
    } catch (err: any) {
      setError(err.error?.message || 'Failed to create oil purchase');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePackagingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!packagingFormData.supplierName.trim()) {
      errors.supplierName = 'Supplier name is required';
    }
    if (!packagingFormData.skuSize) {
      errors.skuSize = 'SKU size is required';
    }
    if (!packagingFormData.packagingType) {
      errors.packagingType = 'Packaging type is required';
    }
    if (!packagingFormData.quantity || packagingFormData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    if (!packagingFormData.ratePerUnit || packagingFormData.ratePerUnit <= 0) {
      errors.ratePerUnit = 'Rate per unit must be greater than 0';
    }
    if (!packagingFormData.paymentMode) {
      errors.paymentMode = 'Payment mode is required';
    }
    if (!packagingFormData.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    if (!packagingFormData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }
    if (!packagingFormData.deliveryDate) {
      errors.deliveryDate = 'Delivery date is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setPackagingFormErrors(errors);
      return;
    }
    
    try {
      setFormLoading(true);
      setPackagingFormErrors({});
      setError(null);
      
      // Create packaging purchase using backend API
      const response = await packagingPurchaseAPI.create({
        supplierName: packagingFormData.supplierName,
        skuSize: packagingFormData.skuSize,
        packagingType: packagingFormData.packagingType,
        quantity: packagingFormData.quantity,
        ratePerUnit: packagingFormData.ratePerUnit,
        paymentMode: packagingFormData.paymentMode,
        invoiceNumber: packagingFormData.invoiceNumber,
        invoiceDate: packagingFormData.invoiceDate,
        deliveryDate: packagingFormData.deliveryDate,
      });
      
      if (response.data.success) {
        setShowForm(false);
        setSuccess('Packaging purchase created successfully!');
        setTimeout(() => setSuccess(null), 3000);
        resetPackagingForm();
        fetchPackagingPurchases();
        fetchPackagingSummary();
      }
      
    } catch (err: any) {
      setError(err.error?.message || 'Failed to create packaging purchase');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle payment status toggle for oil purchases
  const handlePaymentStatusToggle = async (purchaseId: string, isPaid: boolean) => {
    try {
      const response = await oilPurchaseAPI.updatePaymentStatus(purchaseId, isPaid);
      if (response.data.success) {
        setSuccess(`Payment status updated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
        fetchOilPurchases();
        fetchOilSummary();
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update payment status');
    }
  };

  // Handle payment status toggle for packaging purchases
  const handlePackagingPaymentStatusToggle = async (purchaseId: string, isPaid: boolean) => {
    try {
      const response = await packagingPurchaseAPI.updatePaymentStatus(purchaseId, isPaid);
      if (response.data.success) {
        setSuccess(`Payment status updated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
        fetchPackagingPurchases();
        fetchPackagingSummary();
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update payment status');
    }
  };

  // Calculate total pending amount from all pending bookings
  const totalPendingBookingAmount = pendingBookings.reduce((sum, booking) => {
    return sum + booking.pendingAmount;
  }, 0);

  if (showForm) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Add {activeTab === 'oil' ? 'Oil' : 'Packaging'} Purchase</h1>
          <p>Enter the purchase details below</p>
        </div>

        {activeTab === 'oil' && selectedBooking && (
          <div className="info-section" style={{ marginBottom: '1.5rem' }}>
            <h3>Selected Booking Details</h3>
            <div className="summary-cards" style={{ marginTop: '1rem' }}>
              <div className="credit-card">
                <div className="credit-label">Booking Date</div>
                <div className="credit-value">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</div>
              </div>
              <div className="credit-card">
                <div className="credit-label">Tanker Capacity</div>
                <div className="credit-value">{selectedBooking.tankerCapacity.toLocaleString()} L</div>
              </div>
              <div className="credit-card">
                <div className="credit-label">Rate per Liter</div>
                <div className="credit-value">₹{selectedBooking.rate.toFixed(2)}</div>
              </div>
              <div className="credit-card">
                <div className="credit-label">Booking Amount</div>
                <div className="credit-value">₹{selectedBooking.bookingAmount.toLocaleString()}</div>
              </div>
              <div className="credit-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                <div className="credit-label">Pending Amount</div>
                <div className="credit-value" style={{ color: '#e74c3c' }}>
                  ₹{selectedBooking.pendingAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-container">
          {(activeTab === 'oil' ? oilFormErrors.form : packagingFormErrors.form) && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {activeTab === 'oil' ? oilFormErrors.form : packagingFormErrors.form}
            </div>
          )}
          <FormBuilder
            fields={activeTab === 'oil' ? oilFormFields : packagingFormFields}
            values={activeTab === 'oil' ? oilFormData : packagingFormData}
            onChange={activeTab === 'oil' ? handleOilFormChange : handlePackagingFormChange}
            onSubmit={activeTab === 'oil' ? handleOilFormSubmit : handlePackagingFormSubmit}
            loading={formLoading}
            submitText={`Add ${activeTab === 'oil' ? 'Oil' : 'Packaging'} Purchase`}
            errors={activeTab === 'oil' ? oilFormErrors : packagingFormErrors}
          />

          {activeTab === 'oil' && (
            <div className="summary-card" style={{ margin: '1.5rem', textAlign: 'center' }}>
              <h4>Calculated Purchase Amount</h4>
              <div className="summary-value" style={{ color: '#27ae60', fontSize: '1.75rem' }}>
                ₹{calculatedOilAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                {oilFormData.quantity.toLocaleString()} L × ₹{oilFormData.ratePerLiter.toFixed(2)} per liter
              </p>
            </div>
          )}

          {activeTab === 'packaging' && (
            <div className="summary-card" style={{ margin: '1.5rem', textAlign: 'center' }}>
              <h4>Calculated Purchase Amount</h4>
              <div className="summary-value" style={{ color: '#27ae60', fontSize: '1.75rem' }}>
                ₹{(packagingFormData.quantity * packagingFormData.ratePerUnit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                {packagingFormData.quantity.toLocaleString()} units × ₹{packagingFormData.ratePerUnit.toFixed(2)} per unit
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            className="secondary-button"
            onClick={() => {
              setShowForm(false);
              if (activeTab === 'oil') {
                resetOilForm();
              } else {
                resetPackagingForm();
              }
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Procurement Management</h1>
          <p>Manage oil tanker and packaging material purchases</p>
        </div>
        <div className="module-actions">
          <button 
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            Add {activeTab === 'oil' ? 'Oil' : 'Packaging'} Purchase
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* Summary Statistics */}
      {activeTab === 'oil' && oilSummary && (
        <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3>Total Purchases</h3>
            <p className="card-value">{oilSummary.totalPurchases}</p>
          </div>
          <div className="card">
            <h3>Total Quantity</h3>
            <p className="card-value">{oilSummary.totalQuantity.toLocaleString()} KG</p>
          </div>
          <div className="card">
            <h3>Total Amount</h3>
            <p className="card-value">₹{oilSummary.totalAmount.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3>Average Rate</h3>
            <p className="card-value">₹{oilSummary.averageRate.toFixed(2)}/L</p>
          </div>
          <div className="card" style={{ borderLeftColor: '#e74c3c' }}>
            <h3>Unpaid Amount</h3>
            <p className="card-value" style={{ color: '#e74c3c' }}>₹{oilSummary.unpaidAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {activeTab === 'packaging' && packagingSummary && (
        <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3>Total Purchases</h3>
            <p className="card-value">{packagingSummary.totalPurchases}</p>
          </div>
          <div className="card">
            <h3>Total Quantity</h3>
            <p className="card-value">{packagingSummary.totalQuantity.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3>Total Amount</h3>
            <p className="card-value">₹{packagingSummary.totalAmount.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3>Average Rate</h3>
            <p className="card-value">₹{packagingSummary.averageRate.toFixed(2)}</p>
          </div>
          <div className="card" style={{ borderLeftColor: '#e74c3c' }}>
            <h3>Unpaid Amount</h3>
            <p className="card-value" style={{ color: '#e74c3c' }}>₹{packagingSummary.unpaidAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Pending Bookings Summary */}
      {activeTab === 'oil' && pendingBookings.length > 0 && (
        <div className="info-section" style={{ marginBottom: '1.5rem' }}>
          <h3>Pending Bookings Summary</h3>
          <div className="summary-cards" style={{ marginTop: '1rem' }}>
            <div className="credit-card">
              <div className="credit-label">Total Pending Bookings</div>
              <div className="credit-value">{pendingBookings.length}</div>
            </div>
            <div className="credit-card" style={{ borderLeft: '4px solid #e74c3c' }}>
              <div className="credit-label">Total Pending Amount</div>
              <div className="credit-value" style={{ color: '#e74c3c' }}>
                ₹{totalPendingBookingAmount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* List of pending bookings */}
          <div style={{ marginTop: '1rem' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Booking Date</th>
                  <th>Capacity</th>
                  <th>Rate/KG</th>
                  <th>Booking Amount</th>
                  <th>Pending Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map(booking => (
                  <tr key={booking._id}>
                    <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td>{booking.tankerCapacity.toLocaleString()} L</td>
                    <td>₹{booking.rate.toFixed(2)}</td>
                    <td>₹{booking.bookingAmount.toLocaleString()}</td>
                    <td style={{ color: '#e74c3c', fontWeight: 600 }}>
                      ₹{booking.pendingAmount.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        backgroundColor: booking.status === 'Pending' ? '#fff3cd' : '#cce5ff',
                        color: booking.status === 'Pending' ? '#856404' : '#004085'
                      }}>
                        {booking.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="module-content">
        <div className="filters-section">
          <div className="filters-row">
            <div className="tab-buttons" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                className={activeTab === 'oil' ? 'primary-button' : 'secondary-button'}
                onClick={() => setActiveTab('oil')}
              >
                Oil Purchases
              </button>
              <button
                className={activeTab === 'packaging' ? 'primary-button' : 'secondary-button'}
                onClick={() => setActiveTab('packaging')}
              >
                Packaging Purchases
              </button>
            </div>
          </div>
          
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            label="Filter by Delivery Date"
          />
        </div>

        {activeTab === 'oil' ? (
          <DataTable
            data={oilPurchases}
            columns={oilColumns}
            loading={loading}
            rowKey="_id"
          />
        ) : (
          <DataTable
            data={packagingPurchases}
            columns={packagingColumns}
            loading={loading}
            rowKey="_id"
          />
        )}
      </div>
    </div>
  );
};

export default Procurement;
