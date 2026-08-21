import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { OilPurchase, PurchaseSummary, TankerBooking } from '../services/api';
import { oilPurchaseAPI, bookingAPI } from '../services/api';
import { FormField, PaymentMode } from '../types';
import './Pages.css';
import { OilTypes } from '../types/enums';

const ProcurementOil: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [oilPurchases, setOilPurchases] = useState<OilPurchase[]>([]);
  const [pendingBookings, setPendingBookings] = useState<TankerBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TankerBooking | null>(null);
  const [oilSummary, setOilSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewPurchase, setViewPurchase] = useState<OilPurchase | null>(null);

  // date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    bookingId: '',
    supplierName: '',
    quantity: 0,
    ratePerLiter: 0,
    paymentMode: 'Cash',
    invoiceNumber: '',
    oilType: 'SOYABEAN_OIL',
    actualWeight: 0,
    brokerage: 0,
    extraCharges: 0,
    gstAmount: 0,
    tankerTransport: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formErrorSummary, setFormErrorSummary] = useState<string | null>(null);

  const fetchPendingBookings = useCallback(async () => {
    try {
      const response = await bookingAPI.getAll({ bookingstatus: 'PartiallyPaid' });
      if (response.data.success) {
        console.log('Fetched pending bookings:', response.data.data);
        setPendingBookings(response.data.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch pending bookings:', err);
    }
  }, []);

  const fetchOilPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await oilPurchaseAPI.getAll(params);
      if (response.data.success) {
        console.log('Fetched oil purchases:', response.data.data);
        setOilPurchases(response.data.data?.purchases || []);
      }
    } catch (err: unknown) {
      const anyErr = err as { error?: { message?: string } };
      setError(anyErr?.error?.message || 'Failed to fetch oil purchases');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchOilSummary = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await oilPurchaseAPI.getSummary(params);
      if (response.data.success) {
        setOilSummary(response.data.data?.summary || null);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch oil summary:', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPendingBookings();
    fetchOilPurchases();
    fetchOilSummary();
  }, [startDate, endDate, fetchPendingBookings, fetchOilPurchases, fetchOilSummary]);

  // form handlers and validation (same as earlier)
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!formData.supplierName) {
      errors.supplierName = 'Supplier name is required';
      missingFields.push('supplierName');
    }
    if (formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
      missingFields.push('quantity');
    }
    if (formData.ratePerLiter <= 0) {
      errors.ratePerLiter = 'Rate must be greater than 0';
      missingFields.push('ratePerLiter');
    }
    if (!formData.paymentMode) {
      errors.paymentMode = 'Payment mode is required';
      missingFields.push('paymentMode');
    }
    if (!formData.invoiceNumber) {
      errors.invoiceNumber = 'Invoice number is required';
      missingFields.push('invoiceNumber');
    }
    if (!formData.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
      missingFields.push('invoiceDate');
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = 'Delivery date is required';
      missingFields.push('deliveryDate');
    }
    if (!formData.oilType) {
      errors.oilType = 'Oil type is required';
      missingFields.push('oilType');
    }

    if (
  formData.gstAmount === undefined ||
  formData.gstAmount === null ||
  formData.gstAmount < 0
) {
  errors.gstAmount = 'GST amount is required';
  missingFields.push('gstAmount');
} 

    setFormErrors(errors);
    setFormErrorSummary(
      missingFields.length
        ? `All fields are required: ${missingFields.join(', ')}`
        : null
    );

    return missingFields.length === 0;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (name: string, value: any) => {
    if (name === 'bookingId') {
      handleBookingSelect(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = pendingBookings.find((b) => b._id === bookingId) || null;
    setSelectedBooking(booking);
    setFormData((prev) => ({
      ...prev,
      bookingId,
      supplierName: booking?.supplierName || '',
      oilType: booking?.oilType || '',
      quantity: booking ? booking.tankerCapacity : 0,
      ratePerLiter: booking ? booking.rate : 0,
      gstAmount: 0,
      deliveryDate: booking ? new Date(booking.bookingDate).toISOString().split('T')[0] : prev.deliveryDate,
    }));

  };

  // form configuration for FormBuilder
  const oilFormFields: FormField[] = [
    {
      name: 'bookingId',
      label: 'Select Booking',
      type: 'select',
      required: false,
      options: [
        ...pendingBookings.map((booking) => ({
          value: booking._id,
          label: `${new Date(booking.bookingDate).toLocaleDateString()} - ${booking.tankerCapacity.toLocaleString()}L @ ₹${booking.rate}/L (Pending: ₹${booking.pendingAmount.toLocaleString()})`,
        })),
      ],
    },
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true, },
    { name: 'oilType', label: 'Oil Type', type: 'select', required: true, options: Object.keys(OilTypes).map((key) => ({ value: key, label: OilTypes[key] })) },
     { name: 'actualWeight', label: 'Actual Weight (kg)', type: 'number', required: true },
      { name: 'tankerTransport', label: 'Tanker Transport charges', type: 'number', required: true },
    { name: 'quantity', label: 'booking Quantity (KG)', type: 'number', required: true, min: '10000' },
    { name: 'ratePerLiter', label: 'Rate per Liter', type: 'number', required: true, min: '0.01', step: '0.01' },
    {
      name: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      required: true,
      options: [
        { value: PaymentMode.CASH, label: 'Cash'},
        { value: PaymentMode.CHECK, label: 'Cheque' },
        { value: PaymentMode.ONLINE, label: 'Online' },
      ],
    },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
     { name: 'brokerage', label: 'Brokerage (optional)', type: 'number', required: false, min: '0' },
     {name: 'gstAmount', label: 'GST Amount ', type: 'number', required: true, min: '0' },
    { name: 'extraCharges', label: 'Extra Charges (optional)', type: 'number', required: false, min: '0' },
  ];

  const calculatedOilAmount = formData.quantity * formData.ratePerLiter;

  const calculatedTotalAmount =
  Number(formData.quantity) * Number(formData.ratePerLiter) +
  Number(formData.gstAmount) +
  Number(formData.brokerage) +
  Number(formData.tankerTransport) +
  Number(formData.extraCharges);

  const submitForm = async () => {
    console.log('Submitting form with data:', formData);
    if (!validateForm()) return;
    try {
      setFormLoading(true);
      const response = await oilPurchaseAPI.create(formData);
      if (response.data.success) {
        setSuccess('Oil purchase added successfully');
        setFormErrors({});
        setFormErrorSummary(null);
        setShowForm(false);
        fetchOilPurchases();
        fetchOilSummary();
        setFormData({
          bookingId: '',
          supplierName: '',
          quantity: 0,
          ratePerLiter: 0,
          paymentMode: 'Cash',
          invoiceNumber: '',
          oilType: 'SOYABEAN_OIL',
          actualWeight: 0,
          brokerage: 0,
          extraCharges: 0,
          gstAmount: 0,
          tankerTransport: 0,
          invoiceDate: new Date().toISOString().split('T')[0],
          deliveryDate: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err: unknown) {
      const anyErr = err as { error?: { message?: string } };
      setError(anyErr.error?.message || 'Failed to submit oil purchase');
    } finally {
      setFormLoading(false);
    }
  };

  const oilColumns = [
    { key: 'invoiceNumber', title: 'Invoice #', sortable: true },
    { key: 'supplierName', title: 'Supplier', sortable: true },
    { key: 'oilType', title: 'Oil Type', sortable: true, render: (value: string) => value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '-' },
    { key: 'quantity', title: 'Quantity (L)', sortable: true },
    { key: 'ratePerLiter', title: 'Rate/L', sortable: true },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (val: number) => `₹${val?.toLocaleString()}` },
    {
    key: '_id',
    title: 'Action',
    sortable: false,
    render: (id: string) => (
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          const purchase = oilPurchases.find(
            (item) => item._id === id
          );

          if (purchase) {
            setViewPurchase(purchase);
          }
        }}
      >
        View
      </button>
    ),
  },
  ];

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Oil Purchases</h1>
          <p>Record and review raw oil tanker procurement</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="module-content">
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Delivery Date</label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                label=""
              />
            </div>

            <div className="filter-group" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
              <button
                className="primary-button"
                onClick={() => {
                  setShowForm(true);
                  setFormErrors({});
                  setFormErrorSummary(null);
                }}
              >
                Add Oil Purchase
              </button>
            </div>
          </div>
        </div>

        <div className="data-table-wrapper">
          <DataTable
            data={oilPurchases}
            columns={oilColumns}
            loading={loading}
            rowKey="_id"
          />
        </div>

        {showForm && (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content">
              <div className="modal-header">
                <h3 id="modal-title">New Oil Purchase</h3>
                <button className="modal-close" aria-label="Close" onClick={() => setShowForm(false)}>×</button>
              </div>
              {formErrorSummary && (
                <div className="form-error-summary" style={{ margin: '0.75rem 0 1rem', padding: '0.75rem 1rem', backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#a71d2a' }}>
                  {formErrorSummary}
                </div>
              )}
                    {selectedBooking && (
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

              
              <p className="help-text">Tip: selecting a booking will prefill quantity and rate.</p>

              <FormBuilder
                fields={oilFormFields}
                values={formData}
                onChange={handleChange}
                onSubmit={(e) => { e.preventDefault(); submitForm(); }}
                loading={formLoading}
                submitText="Add Oil Purchase"
                errors={formErrors}
              />

              {formData.quantity > 0 && formData.ratePerLiter > 0 && (
                <div className="summary-card" style={{ margin: '1.5rem', textAlign: 'center' }}>
                  <h4>Calculated Purchase Amount</h4>
                  <div
  className="summary-value"
  style={{ color: '#27ae60', fontSize: '1.75rem' }}
>
  ₹{calculatedTotalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}
</div>
                  <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                    ₹{formData.quantity.toLocaleString()} L × ₹{formData.ratePerLiter.toFixed(2)} per liter
                  </p>
                </div>
              )}
              <div className="modal-actions">
                <button onClick={submitForm} disabled={formLoading} className="primary-button">
                  {formLoading ? 'Saving...' : 'Save Purchase'}
                </button>
                <button onClick={() => setShowForm(false)} className="secondary-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {viewPurchase && (
  <div
    className="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="view-purchase-title"
  >
    <div className="modal-content">

      <div className="modal-header">
        <h3 id="view-purchase-title">
          Oil Purchase Details
        </h3>

        <button
          className="modal-close"
          aria-label="Close"
          onClick={() => setViewPurchase(null)}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px 24px',
          padding: '20px',
        }}
      >

        <div>
          <strong>Booking</strong>
          <div>
            {viewPurchase.bookingId || '-'}
          </div>
        </div>

        <div>
          <strong>Supplier Name</strong>
          <div>
            {viewPurchase.supplierName || '-'}
          </div>
        </div>

        <div>
          <strong>Oil Type</strong>
          <div>
            {viewPurchase.oilType
              ? viewPurchase.oilType
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())
              : '-'}
          </div>
        </div>

        <div>
          <strong>Actual Weight (kg)</strong>
          <div>
            {Number(
              viewPurchase.actualWeight || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>Tanker Transport Charges</strong>
          <div>
            ₹{Number(
              viewPurchase.tankerTransport || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>Booking Quantity</strong>
          <div>
            {Number(
              viewPurchase.quantity || 0
            ).toLocaleString()} KG
          </div>
        </div>

        <div>
          <strong>Rate per Liter</strong>
          <div>
            ₹{Number(
              viewPurchase.ratePerLiter || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>Payment Mode</strong>
          <div>
            {viewPurchase.paymentMode || '-'}
          </div>
        </div>

        <div>
          <strong>Invoice Number</strong>
          <div>
            {viewPurchase.invoiceNumber || '-'}
          </div>
        </div>

        <div>
          <strong>Invoice Date</strong>
          <div>
            {viewPurchase.invoiceDate
              ? new Date(
                  viewPurchase.invoiceDate
                ).toLocaleDateString()
              : '-'}
          </div>
        </div>

        <div>
          <strong>Delivery Date</strong>
          <div>
            {viewPurchase.deliveryDate
              ? new Date(
                  viewPurchase.deliveryDate
                ).toLocaleDateString()
              : '-'}
          </div>
        </div>

        <div>
          <strong>Brokerage</strong>
          <div>
            ₹{Number(
              viewPurchase.brokerage || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>GST Amount</strong>
          <div>
            ₹{Number(
              viewPurchase.gstAmount || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>Extra Charges</strong>
          <div>
            ₹{Number(
              viewPurchase.extraCharges || 0
            ).toLocaleString()}
          </div>
        </div>

        <div>
          <strong>Total Amount</strong>
          <div>
            <strong>
              ₹{Number(
                viewPurchase.totalAmount || 0
              ).toLocaleString()}
            </strong>
          </div>
        </div>

      </div>

      <div className="modal-actions">
        <button
          className="secondary-button"
          onClick={() => setViewPurchase(null)}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default ProcurementOil;
