import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import { PackagingPurchase } from '../services/api';
import { packagingPurchaseAPI } from '../services/api';
import { PackagingType, FormField } from '../types';
import './Pages.css';

const ProcurementPackaging: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [packagingPurchases, setPackagingPurchases] = useState<PackagingPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ COMMON FIELDS (no packagingType here now)
  const [formData, setFormData] = useState({
    supplierName: '',
    paymentMode: 'Cash',
    deliveryDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [
      { packagingType: '', unit: '', quantity: 0, ratePerUnit: 0 }
    ]
  });

  const fetchPackagingPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await packagingPurchaseAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setPackagingPurchases(response.data.data?.purchases || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackagingPurchases();
  }, [fetchPackagingPurchases]);

  // ✅ COMMON FORM (NO packagingType here)
  const packagingFormFields: FormField[] = [
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
  ];

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ ITEM CHANGE
  const handleItemChange = (index: number, field: string, value: unknown) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };

    setFormData(prev => ({
      ...prev,
      items: updated
    }));
  };

  const addRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { packagingType: '', unit: '', quantity: 0, ratePerUnit: 0 }]
    }));
  };

  const removeRow = (index: number) => {
    if (formData.items.length === 1) return;

    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // ✅ SUBMIT WITH packagingType INSIDE EACH ITEM
  const submitForm = async () => {
    try {
      setFormLoading(true);

      const payload = formData.items.map(item => ({
        supplierName: formData.supplierName,
        packagingType: item.packagingType,
        quantity: item.quantity,
        ratePerUnit: item.ratePerUnit,
        paymentMode: formData.paymentMode,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        deliveryDate: formData.deliveryDate
      }));

      await packagingPurchaseAPI.create(payload);

      setShowForm(false);
      fetchPackagingPurchases();

      setFormData({
        supplierName: '',
        paymentMode: 'Cash',
        deliveryDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [{ packagingType: '', unit: '', quantity: 0, ratePerUnit: 0 }]
      });

    } finally {
      setFormLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalPurchases: packagingPurchases.length,
    totalQuantity: packagingPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0),
    totalValue: packagingPurchases.reduce((sum, p) => sum + ((p.quantity || 0) * (p.ratePerUnit || 0)), 0),
  };

  // Filter purchases
  const filteredPurchases = packagingPurchases.filter(p =>
    p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.packagingType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const packagingColumns = [
    { 
      key: 'invoiceNumber', 
      title: 'Invoice #', 
      sortable: true,
      render: (value: string) => value || '-'
    },
    { 
      key: 'packagingType', 
      title: 'Type', 
      sortable: true,
      render: (value: string) => value || '-'
    },
    { 
      key: 'quantity', 
      title: 'Quantity', 
      sortable: true,
      render: (value: number) => value ? value.toLocaleString() : '-'
    },
    { 
      key: 'ratePerUnit', 
      title: 'Rate', 
      render: (value: number) => value ? `₹${value.toFixed(2)}` : '-'
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      render: (_: any, record: any) => `₹${((record.quantity || 0) * (record.ratePerUnit || 0)).toLocaleString()}`
    },
    { 
      key: 'invoiceDate', 
      title: 'Invoice Date', 
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { 
      key: 'supplierName', 
      title: 'Supplier', 
      render: (value: string) => value || 'Not Specified'
    },
  ];

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>🛍️ Packaging Purchases</h1>
          <p>Manage packaging material procurement and inventory</p>
        </div>
        <button 
          className="primary-button"
          onClick={() => setShowForm(true)}
          style={{ padding: '12px 24px', fontSize: '1rem' }}
        >
          ➕ Add Purchase
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h4>Total Purchases</h4>
          <div className="stat-value">{stats.totalPurchases}</div>
        </div>
        <div className="stat-card">
          <h4>Total Quantity</h4>
          <div className="stat-value">{stats.totalQuantity.toLocaleString()} Units</div>
        </div>
        <div className="stat-card">
          <h4>Total Value</h4>
          <div className="stat-value" style={{ color: '#27ae60' }}>₹{stats.totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Search by Invoice #, Type, or Supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* Table */}
      <DataTable 
        data={filteredPurchases} 
        columns={packagingColumns} 
        loading={loading} 
        rowKey="_id"
      />

      {/* Modal Form */}
      {showForm && (
        <div className="modal modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>

            {/* HEADER */}
            <div className="modal-header" style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>📦 New Packaging Purchase</h2>
              <button
                className="close-btn"
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            {/* SCROLL CONTAINER */}
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>

              {/* SUPPLIER & INVOICE SECTION */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                <h4 style={{ marginBottom: '1rem', color: '#333' }}>📋 Invoice & Supplier Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Supplier Name</label>
                    <input
                      type="text"
                      placeholder="Supplier name"
                      value={formData.supplierName}
                      onChange={(e) => handleChange('supplierName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Invoice Number *</label>
                    <input
                      type="text"
                      placeholder="INV-001"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Invoice Date</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => handleChange('invoiceDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Delivery Date *</label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => handleChange('deliveryDate', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => handleChange('paymentMode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Not Specified">Not Specified</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit">Credit</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ITEMS TABLE SECTION */}
              <div style={{ padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#333' }}>📦 Packaging Items</h4>
                
                <div className="table-responsive">
                  <table className="form-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.95rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Packaging Type *</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Quantity *</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Rate/Unit *</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', width: '60px' }}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                          
                          {/* TYPE - DROPDOWN */}
                          <td style={{ padding: '12px' }}>
                            <select
                              value={item.packagingType}
                              onChange={(e) =>
                                handleItemChange(index, 'packagingType', e.target.value)
                              }
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="">-- Select Type --</option>
                              {Object.values(PackagingType).map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* QTY - NUMBER */}
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', Number(e.target.value))
                              }
                              min="0"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </td>

                          {/* RATE - NUMBER */}
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.ratePerUnit}
                              onChange={(e) =>
                                handleItemChange(index, 'ratePerUnit', Number(e.target.value))
                              }
                              min="0"
                              step="0.01"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </td>

                          {/* AMOUNT - DISPLAY */}
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#27ae60' }}>
                            ₹{(item.quantity * item.ratePerUnit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>

                          {/* DELETE - BUTTON */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              className="danger-button"
                              onClick={() => removeRow(index)}
                              disabled={formData.items.length === 1}
                              style={{
                                padding: '6px 10px',
                                background: formData.items.length === 1 ? '#ccc' : '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: formData.items.length === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ADD ROW BUTTON */}
                <button 
                  className="secondary-button"
                  onClick={addRow}
                  style={{ marginTop: '1rem', padding: '10px 16px' }}
                >
                  ➕ Add Item
                </button>
              </div>

              {/* TOTAL SECTION */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f0f8ff',
                borderTop: '2px solid #ddd',
                borderRadius: '0 0 8px 8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '2rem'
                }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Amount:</span>
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#27ae60',
                    minWidth: '200px',
                    textAlign: 'right'
                  }}>
                    ₹{formData.items
                      .reduce((sum, i) => sum + i.quantity * i.ratePerUnit, 0)
                      .toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="modal-actions" style={{ borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
              <button
                className="secondary-button"
                onClick={() => setShowForm(false)}
                style={{ padding: '12px 24px' }}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={submitForm}
                disabled={formLoading}
                style={{ padding: '12px 32px', fontSize: '1rem' }}
              >
                {formLoading ? '⏳ Saving...' : '💾 Save Purchase'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementPackaging;
