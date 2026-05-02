import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import DateRangePicker from '../components/UI/DateRangePicker';
import { FormField, PaymentMode, SKUSize, PackagingType, OrderStatus } from '../types';
import api from '../services/api';
import './Pages.css';

interface Distributor {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  creditTerms: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DistributorCreditInfo {
  totalOutstanding: number;
  overdueAmount: number;
  outstandingOrders: number;
  availableCredit: number;
  creditUtilization: number;
}

interface DistributorStatistics {
  totalOrders: number;
  totalValue: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  outstandingAmount: number;
}

interface SalesOrder {
  _id: string;
  orderNumber: string;
  distributorId: any;
  orderDate: string;
  items: any[];
  totalAmount: number;
  paymentMode: PaymentMode;
  isPaid: boolean;
  status: OrderStatus;
  createdAt: string;
}

const Sales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'distributors' | 'orders'>('distributors');
  const [showForm, setShowForm] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [creditInfo, setCreditInfo] = useState<DistributorCreditInfo | null>(null);
  const [distributorStats, setDistributorStats] = useState<DistributorStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const [distributorFormData, setDistributorFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    creditTerms: 30,
  });

  const [orderFormData, setOrderFormData] = useState({
    distributorId: '',
    items: [] as Array<{
      skuSize: string;
      packagingType: string;
      quantity: number;
      unitPrice: number;
    }>,
    paymentMode: '',
  });

  // Single item being added to order
  const [currentOrderItem, setCurrentOrderItem] = useState({
    skuSize: '',
    packagingType: '',
    quantity: 0,
    unitPrice: 0,
  });

  const [distributorFormErrors, setDistributorFormErrors] = useState<Record<string, string>>({});
  const [orderFormErrors, setOrderFormErrors] = useState<Record<string, string>>({});

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showActiveOnly) params.append('isActive', 'true');
      
      const response = await api.get(`/sales/distributors?${params}`);
      if (response.data.success) {
        setDistributors(response.data.data?.distributors || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch distributors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributorDetails = async (distributorId: string) => {
    try {
      setCreditLoading(true);
      const [detailsResponse, creditResponse] = await Promise.all([
        api.get(`/sales/distributors/${distributorId}`),
        api.get(`/sales/distributors/${distributorId}/credit`)
      ]);

      if (detailsResponse.data.success) {
        setSelectedDistributor(detailsResponse.data.data.distributor);
        setDistributorStats(detailsResponse.data.data.statistics);
      }

      if (creditResponse.data.success) {
        setCreditInfo(creditResponse.data.data.creditInfo);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch distributor details');
    } finally {
      setCreditLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/sales/orders?${params}`);
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'distributors') {
      fetchDistributors();
    } else {
      fetchOrders();
    }
  }, [activeTab, startDate, endDate, searchTerm, showActiveOnly]);

  const distributorFormFields: FormField[] = [
    { name: 'name', label: 'Distributor Name', type: 'text', required: true },
    { name: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'creditLimit', label: 'Credit Limit', type: 'number', required: true },
    { name: 'creditTerms', label: 'Credit Terms (Days)', type: 'number', required: true },
  ];

  const orderFormFields: FormField[] = [
    { 
      name: 'distributorId', 
      label: 'Distributor', 
      type: 'select', 
      required: true,
      options: distributors.map(d => ({ value: d._id, label: d.name }))
    },
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
    { name: 'unitPrice', label: 'Unit Price', type: 'number', required: true },
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
  ];

  const distributorColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'contactPerson', title: 'Contact Person', sortable: true },
    { key: 'phone', title: 'Phone', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'creditLimit', title: 'Credit Limit', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
    { key: 'creditTerms', title: 'Credit Terms', sortable: true, render: (value: number) => `${value} days` },
    { key: 'isActive', title: 'Status', render: (value: boolean) => value ? '✅ Active' : '❌ Inactive' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: Distributor) => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="secondary-button"
            onClick={() => handleViewDistributor(record)}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            View
          </button>
          <button
            className="secondary-button"
            onClick={() => handleEditDistributor(record)}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            Edit
          </button>
          <button
            className={record.isActive ? "danger-button" : "primary-button"}
            onClick={() => handleToggleDistributorStatus(record)}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    },
  ];

  const orderColumns = [
    { key: 'orderNumber', title: 'Order #', sortable: true },
    { 
      key: 'distributorName', 
      title: 'Distributor', 
      render: (_: any, record: SalesOrder) => record.distributorId?.name || 'N/A'
    },
    { key: 'orderDate', title: 'Order Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'totalAmount', title: 'Total Amount', sortable: true, render: (value: number) => `₹${value.toLocaleString()}` },
    { key: 'paymentMode', title: 'Payment', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'isPaid', title: 'Payment Status', render: (value: boolean) => value ? '✅ Paid' : '⏳ Pending' },
  ];

  const handleDistributorFormChange = (name: string, value: any) => {
    setDistributorFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrderFormChange = (name: string, value: any) => {
    setOrderFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDistributorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setDistributorFormErrors({});
      
      if (editingDistributor) {
        // Update existing distributor
        const response = await api.put(`/sales/distributors/${editingDistributor._id}`, distributorFormData);
        if (response.data.success) {
          setShowForm(false);
          setEditingDistributor(null);
          resetDistributorForm();
          fetchDistributors();
        }
      } else {
        // Create new distributor
        const response = await api.post('/sales/distributors', distributorFormData);
        if (response.data.success) {
          setShowForm(false);
          resetDistributorForm();
          fetchDistributors();
        }
      }
    } catch (err: any) {
      // Handle field-specific errors
      if (err.error?.code === 'DUPLICATE_EMAIL') {
        setDistributorFormErrors({ email: 'Email already exists' });
      } else if (err.error?.code === 'INVALID_EMAIL') {
        setDistributorFormErrors({ email: 'Invalid email format' });
      } else if (err.error?.code === 'INVALID_PHONE') {
        setDistributorFormErrors({ phone: 'Invalid phone number' });
      } else if (err.error?.code === 'MISSING_FIELDS') {
        setError('Please fill in all required fields');
      } else {
        setError(err.error?.message || `Failed to ${editingDistributor ? 'update' : 'create'} distributor`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDistributor = async (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setShowCreditInfo(true);
    await fetchDistributorDetails(distributor._id);
  };

  const handleEditDistributor = (distributor: Distributor) => {
    setEditingDistributor(distributor);
    setDistributorFormData({
      name: distributor.name,
      contactPerson: distributor.contactPerson,
      phone: distributor.phone,
      email: distributor.email,
      address: distributor.address,
      creditLimit: distributor.creditLimit,
      creditTerms: distributor.creditTerms,
    });
    setShowForm(true);
  };

  const handleToggleDistributorStatus = async (distributor: Distributor) => {
    try {
      setLoading(true);
      const endpoint = distributor.isActive 
        ? `/sales/distributors/${distributor._id}` 
        : `/sales/distributors/${distributor._id}/activate`;
      
      const method = distributor.isActive ? 'delete' : 'post';
      const response = await api[method](endpoint);
      
      if (response.data.success) {
        fetchDistributors();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to ${distributor.isActive ? 'deactivate' : 'activate'} distributor`);
    } finally {
      setLoading(false);
    }
  };

  const resetDistributorForm = () => {
    setDistributorFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 0,
      creditTerms: 30,
    });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDistributor(null);
    resetDistributorForm();
  };

  const handleOrderFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setOrderFormErrors({});
      setError(null);
      setSuccess(null);

      if (!orderFormData.distributorId || orderFormData.items.length === 0 || !orderFormData.paymentMode) {
        setOrderFormErrors({ form: 'Please select a distributor, add at least one item, and select payment mode' });
        return;
      }

      const response = await api.post('/sales/orders', orderFormData);
      if (response.data.success) {
        setSuccess('Sales order created successfully!');
        setOrderFormData({
          distributorId: '',
          items: [],
          paymentMode: '',
        });
        setCurrentOrderItem({
          skuSize: '',
          packagingType: '',
          quantity: 0,
          unitPrice: 0,
        });
        setTimeout(() => {
          setShowForm(false);
          fetchOrders();
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      // Handle field-specific errors
      if (err.response?.data?.error?.code === 'DUPLICATE_ORDER') {
        setOrderFormErrors({ distributorId: 'Order already exists for this distributor' });
      } else if (err.response?.data?.error?.code === 'INSUFFICIENT_INVENTORY') {
        setOrderFormErrors({ quantity: 'Insufficient inventory for requested quantity' });
      } else if (err.response?.data?.error?.code === 'CREDIT_LIMIT_EXCEEDED') {
        setOrderFormErrors({ form: 'Order exceeds distributor credit limit' });
      } else if (err.response?.data?.error?.code === 'MISSING_FIELDS') {
        setOrderFormErrors({ form: 'Please fill in all required fields' });
      } else {
        setError(err.response?.data?.error?.message || 'Failed to create sales order');
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (showCreditInfo && selectedDistributor) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Distributor Details: {selectedDistributor.name}</h1>
          <p>Credit information and statistics</p>
        </div>

        <div className="form-container">
          {creditLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner">Loading...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Basic Information */}
              <div className="info-section">
                <h3>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Contact Person:</strong> {selectedDistributor.contactPerson}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedDistributor.phone}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedDistributor.email}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedDistributor.isActive ? '✅ Active' : '❌ Inactive'}
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <strong>Address:</strong> {selectedDistributor.address}
                </div>
              </div>

              {/* Credit Information */}
              {creditInfo && (
                <div className="info-section">
                  <h3>Credit Management</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="credit-card">
                      <div className="credit-label">Credit Limit</div>
                      <div className="credit-value">₹{selectedDistributor.creditLimit.toLocaleString()}</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Available Credit</div>
                      <div className="credit-value" style={{ color: creditInfo.availableCredit > 0 ? '#10b981' : '#ef4444' }}>
                        ₹{creditInfo.availableCredit.toLocaleString()}
                      </div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Outstanding Amount</div>
                      <div className="credit-value" style={{ color: creditInfo.totalOutstanding > 0 ? '#f59e0b' : '#10b981' }}>
                        ₹{creditInfo.totalOutstanding.toLocaleString()}
                      </div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Overdue Amount</div>
                      <div className="credit-value" style={{ color: creditInfo.overdueAmount > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{creditInfo.overdueAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Credit Utilization</div>
                      <div className="credit-value">{creditInfo.creditUtilization}%</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Credit Terms</div>
                      <div className="credit-value">{selectedDistributor.creditTerms} days</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Statistics */}
              {distributorStats && (
                <div className="info-section">
                  <h3>Order Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="credit-card">
                      <div className="credit-label">Total Orders</div>
                      <div className="credit-value">{distributorStats.totalOrders}</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Total Value</div>
                      <div className="credit-value">₹{distributorStats.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Pending Orders</div>
                      <div className="credit-value">{distributorStats.pendingOrders}</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Confirmed Orders</div>
                      <div className="credit-value">{distributorStats.confirmedOrders}</div>
                    </div>
                    <div className="credit-card">
                      <div className="credit-label">Delivered Orders</div>
                      <div className="credit-value">{distributorStats.deliveredOrders}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="secondary-button" 
            onClick={() => handleEditDistributor(selectedDistributor)}
          >
            Edit Distributor
          </button>
          <button 
            className="secondary-button" 
            onClick={() => {
              setShowCreditInfo(false);
              setSelectedDistributor(null);
              setCreditInfo(null);
              setDistributorStats(null);
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showForm && activeTab === 'orders') {
    // Custom multi-item order form
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Create Sales Order</h1>
          <p>Create a bulk sales order with multiple items</p>
        </div>

        <div className="form-container">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
          )}

          {orderFormErrors.form && (
            <div className="error-message" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{orderFormErrors.form}</span>
              <button onClick={() => setOrderFormErrors({})} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
          )}

          <form onSubmit={handleOrderFormSubmit}>
            {/* Distributor Selection */}
            <div className="form-group">
              <label>Distributor *</label>
              <select
                value={orderFormData.distributorId}
                onChange={(e) => setOrderFormData({...orderFormData, distributorId: e.target.value})}
                required
              >
                <option value="">Select a distributor</option>
                {distributors.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label>Payment Mode *</label>
              <select
                value={orderFormData.paymentMode}
                onChange={(e) => setOrderFormData({...orderFormData, paymentMode: e.target.value})}
                required
              >
                <option value="">Select payment mode</option>
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
              </select>
            </div>

            {/* Add Order Items Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e5e7eb' }}>
              <h3>Add Order Items</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>SKU Size *</label>
                  <select
                    value={currentOrderItem.skuSize}
                    onChange={(e) => setCurrentOrderItem({...currentOrderItem, skuSize: e.target.value})}
                  >
                    <option value="">Select SKU</option>
                    {Object.values(SKUSize).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Packaging Type *</label>
                  <select
                    value={currentOrderItem.packagingType}
                    onChange={(e) => setCurrentOrderItem({...currentOrderItem, packagingType: e.target.value})}
                  >
                    <option value="">Select type</option>
                    {Object.values(PackagingType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={currentOrderItem.quantity}
                    onChange={(e) => setCurrentOrderItem({...currentOrderItem, quantity: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Unit Price *</label>
                  <input
                    type="number"
                    value={currentOrderItem.unitPrice}
                    onChange={(e) => setCurrentOrderItem({...currentOrderItem, unitPrice: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (currentOrderItem.skuSize && currentOrderItem.packagingType && currentOrderItem.quantity > 0 && currentOrderItem.unitPrice > 0) {
                        setOrderFormData(prev => ({
                          ...prev,
                          items: [...prev.items, {...currentOrderItem}]
                        }));
                        setCurrentOrderItem({
                          skuSize: '',
                          packagingType: '',
                          quantity: 0,
                          unitPrice: 0,
                        });
                      }
                    }}
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            {orderFormData.items.length > 0 && (
              <div style={{ marginBottom: '2rem', borderTop: '2px solid #e5e7eb', paddingTop: '1.5rem' }}>
                <h4>Order Items ({orderFormData.items.length})</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderFormData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.75rem' }}>{item.skuSize}</td>
                        <td style={{ padding: '0.75rem' }}>{item.packagingType}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{item.unitPrice.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 'bold' }}>₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                        <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setOrderFormData(prev => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== idx)
                            }))}
                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #ddd', fontWeight: 'bold' }}>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '0.75rem' }}>Total Order Value:</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{orderFormData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                className="primary-button" 
                disabled={formLoading || orderFormData.items.length === 0}
              >
                {formLoading ? 'Creating Order...' : 'Create Order'}
              </button>
              <button 
                type="button" 
                className="secondary-button" 
                onClick={handleCancelForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>{editingDistributor ? 'Edit' : 'Add'} {activeTab === 'distributors' ? 'Distributor' : 'Sales Order'}</h1>
          <p>Enter the {activeTab === 'distributors' ? 'distributor' : 'order'} details</p>
        </div>

        <div className="form-container">
          {(activeTab === 'distributors' ? distributorFormErrors.form : orderFormErrors.form) && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {activeTab === 'distributors' ? distributorFormErrors.form : orderFormErrors.form}
            </div>
          )}
          <FormBuilder
            fields={activeTab === 'distributors' ? distributorFormFields : orderFormFields}
            values={activeTab === 'distributors' ? distributorFormData : orderFormData}
            onChange={activeTab === 'distributors' ? handleDistributorFormChange : handleOrderFormChange}
            onSubmit={activeTab === 'distributors' ? handleDistributorFormSubmit : handleOrderFormSubmit}
            loading={formLoading}
            submitText={`${editingDistributor ? 'Update' : 'Add'} ${activeTab === 'distributors' ? 'Distributor' : 'Order'}`}
            errors={activeTab === 'distributors' ? distributorFormErrors : orderFormErrors}
          />
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button className="secondary-button" onClick={handleCancelForm}>
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
          <h1>Sales Management</h1>
          <p>Manage distributors and sales orders</p>
        </div>
        <div className="module-actions">
          <button className="primary-button" onClick={() => setShowForm(true)}>
            Add {activeTab === 'distributors' ? 'Distributor' : 'Sales Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="module-content">
        <div className="filters-section">
          <div className="tab-buttons">
            <button
              className={activeTab === 'distributors' ? 'primary-button' : 'secondary-button'}
              onClick={() => setActiveTab('distributors')}
            >
              Distributors
            </button>
            <button
              className={activeTab === 'orders' ? 'primary-button' : 'secondary-button'}
              onClick={() => setActiveTab('orders')}
            >
              Sales Orders
            </button>
          </div>
          
          {activeTab === 'distributors' ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search distributors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                />
                Active only
              </label>
            </div>
          ) : (
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              label="Filter by Order Date"
            />
          )}
        </div>

        {activeTab === 'distributors' ? (
          <DataTable
            data={distributors}
            columns={distributorColumns}
            loading={loading}
            rowKey="_id"
          />
        ) : (
          <DataTable
            data={orders}
            columns={orderColumns}
            loading={loading}
            rowKey="_id"
          />
        )}
      </div>
    </div>
  );
};

export default Sales;