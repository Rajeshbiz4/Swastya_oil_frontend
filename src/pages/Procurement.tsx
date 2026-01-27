import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { FormField, PaymentMode, SKUSize, PackagingType } from '../types';
import localDataService, { TankerBooking, OilPurchase } from '../services/localDataService';
import './Pages.css';

interface PackagingPurchase {
  _id: string;
  supplierName: string;
  skuSize: SKUSize;
  packagingType: PackagingType;
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  isPaid: boolean;
  createdAt: string;
}

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'oil' | 'packaging'>('oil');
  const [showForm, setShowForm] = useState(false);
  const [oilPurchases, setOilPurchases] = useState<OilPurchase[]>([]);
  const [packagingPurchases, setPackagingPurchases] = useState<PackagingPurchase[]>([]);
  const [pendingBookings, setPendingBookings] = useState<TankerBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TankerBooking | null>(null);
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
    invoiceDate: localDataService.getTodayDate(),
    deliveryDate: localDataService.getTodayDate(),
  });

  const [packagingFormData, setPackagingFormData] = useState({
    supplierName: '',
    skuSize: '',
    packagingType: '',
    quantity: 0,
    ratePerUnit: 0,
    paymentMode: '',
    invoiceNumber: '',
    invoiceDate: '',
    deliveryDate: '',
  });

  // Field errors
  const [oilFormErrors, setOilFormErrors] = useState<Record<string, string>>({});
  const [packagingFormErrors, setPackagingFormErrors] = useState<Record<string, string>>({});

  // Fetch pending bookings from local data service
  const fetchPendingBookings = () => {
    try {
      const pending = localDataService.getPendingBookings();
      setPendingBookings(pending);
    } catch (err: any) {
      console.error('Failed to fetch pending bookings:', err);
    }
  };

  // Fetch oil purchases from local data service
  const fetchOilPurchases = () => {
    try {
      setLoading(true);
      const purchases = localDataService.getOilPurchasesByDateRange(startDate, endDate);
      setOilPurchases(purchases);
    } catch (err: any) {
      setError('Failed to fetch oil purchases');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for packaging purchases (not implemented in local storage yet)
  const fetchPackagingPurchases = () => {
    setLoading(true);
    // For now, packaging purchases are not stored locally
    setPackagingPurchases([]);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'oil') {
      fetchOilPurchases();
      fetchPendingBookings();
    } else {
      fetchPackagingPurchases();
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
          label: `${new Date(booking.bookingDate).toLocaleDateString()} - ${booking.tankerCapacity.toLocaleString()}L @ ₹${booking.rate}/L (Pending: ₹${(booking.pendingAmount || booking.bookingAmount).toLocaleString()})`
        }))
      ]
    },
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity (Liters)', type: 'number', required: true },
    { name: 'ratePerLiter', label: 'Rate per Liter', type: 'number', required: true },
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
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'ratePerUnit', label: 'Rate per Unit', type: 'number', required: true },
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
    { key: 'quantity', title: 'Quantity (L)', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'ratePerLiter', title: 'Rate/L', sortable: true, render: (value: number) => `₹${value.toFixed(2)}` },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
    { key: 'paymentMode', title: 'Payment', sortable: true },
    { key: 'invoiceNumber', title: 'Invoice #', sortable: true },
    { key: 'deliveryDate', title: 'Delivery Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'isPaid', title: 'Status', render: (value: boolean) => value ? '✅ Paid' : '⏳ Pending' },
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
    { key: 'isPaid', title: 'Status', render: (value: boolean) => value ? '✅ Paid' : '⏳ Pending' },
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
      invoiceDate: localDataService.getTodayDate(),
      deliveryDate: localDataService.getTodayDate(),
    });
    setSelectedBooking(null);
    setOilFormErrors({});
  };

  const handleOilFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!oilFormData.supplierName.trim()) {
      errors.supplierName = 'Supplier name is required';
    }
    if (!oilFormData.quantity || oilFormData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
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
    
    // Check for duplicate invoice number
    if (localDataService.isInvoiceNumberExists(oilFormData.invoiceNumber)) {
      errors.invoiceNumber = 'Invoice number already exists';
    }
    
    if (Object.keys(errors).length > 0) {
      setOilFormErrors(errors);
      return;
    }
    
    try {
      setFormLoading(true);
      setOilFormErrors({});
      
      // Create oil purchase using local data service
      localDataService.createOilPurchase({
        bookingId: oilFormData.bookingId || undefined,
        supplierName: oilFormData.supplierName,
        quantity: oilFormData.quantity,
        ratePerLiter: oilFormData.ratePerLiter,
        paymentMode: oilFormData.paymentMode,
        invoiceNumber: oilFormData.invoiceNumber,
        invoiceDate: oilFormData.invoiceDate,
        deliveryDate: oilFormData.deliveryDate,
      });
      
      setShowForm(false);
      setSuccess('Oil purchase created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      resetOilForm();
      fetchOilPurchases();
      fetchPendingBookings();
      
    } catch (err: any) {
      setError('Failed to create oil purchase');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePackagingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Packaging purchases not implemented in local storage
    setError('Packaging purchases are not yet implemented');
  };

  // Calculate total pending amount from all pending bookings
  const totalPendingBookingAmount = pendingBookings.reduce((sum, booking) => {
    return sum + (booking.pendingAmount || booking.bookingAmount);
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
                  ₹{(selectedBooking.tankerCapacity * selectedBooking.rate - selectedBooking.bookingAmount).toLocaleString()}
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
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            className="secondary-button"
            onClick={() => {
              setShowForm(false);
              if (activeTab === 'oil') {
                resetOilForm();
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
                  <th>Rate/L</th>
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
                      ₹{(booking.pendingAmount || booking.bookingAmount).toLocaleString()}
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
