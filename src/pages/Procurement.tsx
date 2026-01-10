import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { FormField, PaymentMode, SKUSize, PackagingType } from '../types';
import api from '../services/api';
import './Pages.css';

interface OilPurchase {
  _id: string;
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  isPaid: boolean;
  createdAt: string;
}

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
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form data
  const [oilFormData, setOilFormData] = useState({
    supplierName: '',
    quantity: 0,
    ratePerLiter: 0,
    paymentMode: '',
    invoiceNumber: '',
    invoiceDate: '',
    deliveryDate: '',
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

  // Fetch data
  const fetchOilPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/procurement/oil-purchases?${params}`);
      if (response.data.success) {
        setOilPurchases(response.data.data?.purchases || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch oil purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackagingPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/procurement/packaging-purchases?${params}`);
      if (response.data.success) {
        setPackagingPurchases(response.data.data?.purchases || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch packaging purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'oil') {
      fetchOilPurchases();
    } else {
      fetchPackagingPurchases();
    }
  }, [activeTab, startDate, endDate]);

  // Form fields
  const oilFormFields: FormField[] = [
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
    setOilFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePackagingFormChange = (name: string, value: any) => {
    setPackagingFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOilFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setOilFormErrors({});
      const response = await api.post('/procurement/oil-purchases', oilFormData);
      if (response.data.success) {
        setShowForm(false);
        setOilFormData({
          supplierName: '',
          quantity: 0,
          ratePerLiter: 0,
          paymentMode: '',
          invoiceNumber: '',
          invoiceDate: '',
          deliveryDate: '',
        });
        fetchOilPurchases();
      }
    } catch (err: any) {
      // Handle field-specific errors
      if (err.error?.code === 'DUPLICATE_INVOICE') {
        setOilFormErrors({ invoiceNumber: 'Invoice number already exists' });
      } else if (err.error?.code === 'INVALID_QUANTITY') {
        setOilFormErrors({ quantity: 'Quantity must be between 10,000 and 20,000 liters' });
      } else if (err.error?.code === 'INVALID_PAYMENT_MODE') {
        setOilFormErrors({ paymentMode: 'Payment mode must be either Cash or Credit' });
      } else if (err.error?.code === 'INVALID_INVOICE_DATE') {
        setOilFormErrors({ invoiceDate: 'Invoice date cannot be in the future' });
      } else if (err.error?.code === 'INVALID_DELIVERY_DATE') {
        setOilFormErrors({ deliveryDate: 'Delivery date cannot be in the past' });
      } else if (err.error?.code === 'MISSING_FIELDS') {
        setOilFormErrors({ form: err.error?.message || 'Please fill in all required fields' });
      } else {
        setError(err.error?.message || 'Failed to create oil purchase');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handlePackagingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setPackagingFormErrors({});
      const response = await api.post('/procurement/packaging-purchases', packagingFormData);
      if (response.data.success) {
        setShowForm(false);
        setPackagingFormData({
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
        fetchPackagingPurchases();
      }
    } catch (err: any) {
      // Handle field-specific errors
      if (err.error?.code === 'DUPLICATE_INVOICE') {
        setPackagingFormErrors({ invoiceNumber: 'Invoice number already exists' });
      } else if (err.error?.code === 'INVALID_PAYMENT_MODE') {
        setPackagingFormErrors({ paymentMode: 'Payment mode must be either Cash or Credit' });
      } else if (err.error?.code === 'INVALID_INVOICE_DATE') {
        setPackagingFormErrors({ invoiceDate: 'Invoice date cannot be in the future' });
      } else if (err.error?.code === 'INVALID_DELIVERY_DATE') {
        setPackagingFormErrors({ deliveryDate: 'Delivery date cannot be in the past' });
      } else if (err.error?.code === 'MISSING_FIELDS') {
        setPackagingFormErrors({ form: err.error?.message || 'Please fill in all required fields' });
      } else {
        setError(err.error?.message || 'Failed to create packaging purchase');
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (showForm) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Add {activeTab === 'oil' ? 'Oil' : 'Packaging'} Purchase</h1>
          <p>Enter the purchase details below</p>
        </div>

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
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            className="secondary-button"
            onClick={() => setShowForm(false)}
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