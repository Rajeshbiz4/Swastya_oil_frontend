import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { PackagingPurchase, PurchaseSummary } from '../services/api';
import { packagingPurchaseAPI } from '../services/api';
import { FormField, SKUSize, PackagingType, PaymentMode } from '../types';
import './Pages.css';

const ProcurementPackaging: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [packagingPurchases, setPackagingPurchases] = useState<PackagingPurchase[]>([]);
  const [packagingSummary, setPackagingSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchPackagingPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await packagingPurchaseAPI.getAll(params);
      if (response.data.success) {
        setPackagingPurchases(response.data.data?.purchases || []);
      }
    } catch (err: unknown) {
      const anyErr = err as { error?: { message?: string } };
      setError(anyErr.error?.message || 'Failed to fetch packaging purchases');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchPackagingSummary = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await packagingPurchaseAPI.getSummary(params);
      if (response.data.success) {
        setPackagingSummary(response.data.data?.summary || null);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch packaging summary:', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPackagingPurchases();
    fetchPackagingSummary();
  }, [startDate, endDate, fetchPackagingPurchases, fetchPackagingSummary]);

  // form handlers and validation
  const packagingFormFields: FormField[] = [
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
    {
      name: 'skuSize',
      label: 'SKU Size',
      type: 'select',
      required: true,
      options: Object.values(SKUSize).map((v) => ({ value: v, label: v })),
    },
    {
      name: 'packagingType',
      label: 'Packaging Type',
      type: 'select',
      required: true,
      options: Object.values(PackagingType).map((v) => ({ value: v, label: v })),
    },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: '1' },
    { name: 'ratePerUnit', label: 'Rate per Unit', type: 'number', required: true, min: '0.01', step: '0.01' },
    {
      name: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      required: true,
      options: Object.values(PaymentMode).map((v) => ({ value: v, label: v })),
    },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
  ];

  const calculatedPackagingAmount = formData.quantity * formData.ratePerUnit;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.supplierName) errors.supplierName = 'Supplier name is required';
    if (!formData.skuSize) errors.skuSize = 'SKU Size is required';
    if (!formData.packagingType) errors.packagingType = 'Packaging type is required';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (formData.ratePerUnit <= 0) errors.ratePerUnit = 'Rate must be greater than 0';
    if (!formData.paymentMode) errors.paymentMode = 'Payment mode is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    try {
      setFormLoading(true);
      const response = await packagingPurchaseAPI.create(formData);
      if (response.data.success) {
        setSuccess('Packaging purchase added successfully');
        setShowForm(false);
        fetchPackagingPurchases();
        fetchPackagingSummary();
        setFormData({
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
      }
    } catch (err: unknown) {
      const anyErr = err as { error?: { message?: string } };
      setError(anyErr.error?.message || 'Failed to submit packaging purchase');
    } finally {
      setFormLoading(false);
    }
  };

  const packagingColumns = [
    { key: 'invoiceNumber', title: 'Invoice #', sortable: true },
    { key: 'supplierName', title: 'Supplier', sortable: true },
    { key: 'skuSize', title: 'SKU Size', sortable: true },
    { key: 'packagingType', title: 'Type', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true },
    { key: 'ratePerUnit', title: 'Rate/Unit', sortable: true },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (val: number) => `₹${val?.toLocaleString()}` },
    { key: 'paymentMode', title: 'Payment Mode', sortable: true },
    { key: 'invoiceDate', title: 'Invoice Date', sortable: true, render: (val: string) => new Date(val).toLocaleDateString() },
    { key: 'deliveryDate', title: 'Delivery Date', sortable: true, render: (val: string) => new Date(val).toLocaleDateString() },
  ];

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Packaging Purchases</h1>
          <p>Record and review packaging material procurement</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="module-content">
        <div className="filters-section">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            label="Filter by Delivery Date"
          />

          <div className="actions-row">
            <button className="primary-button" onClick={() => setShowForm(true)}>
              Add Packaging Purchase
            </button>
          </div>
        </div>

        {packagingSummary && (
          <div className="summary-row">
            <span>Total Qty: {packagingSummary.totalQuantity}</span>
            <span>Total Amount: ₹{packagingSummary.totalAmount?.toLocaleString()}</span>
            <span>Avg Rate: ₹{packagingSummary.averageRate?.toFixed(2)}</span>
          </div>
        )}

        <DataTable
          data={packagingPurchases}
          columns={packagingColumns}
          loading={loading}
          rowKey="_id"
        />

        {showForm && (
          <div className="modal">
            <div className="modal-content">
              <h3>New Packaging Purchase</h3>
              <FormBuilder
                fields={packagingFormFields}
                values={formData}
                onChange={handleChange}
                onSubmit={(e) => {
                  e.preventDefault();
                  submitForm();
                }}
                loading={formLoading}
                submitText="Add Packaging Purchase"
                errors={formErrors}
              />

              {formData.quantity && formData.ratePerUnit && (
                <div className="summary-card" style={{ margin: '1.5rem', textAlign: 'center' }}>
                  <h4>Calculated Purchase Amount</h4>
                  <div className="summary-value" style={{ color: '#27ae60', fontSize: '1.75rem' }}>
                    ₹{calculatedPackagingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                    {formData.quantity.toLocaleString()} units × ₹{formData.ratePerUnit.toFixed(2)} per unit
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
    </div>
  );
};

export default ProcurementPackaging;
