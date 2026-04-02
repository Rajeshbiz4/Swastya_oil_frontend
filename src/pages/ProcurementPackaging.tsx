import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import { PackagingPurchase } from '../services/api';
import { packagingPurchaseAPI } from '../services/api';
import { PackagingType, PaymentMode } from '../types';
import './Pages.css';

const ProcurementPackaging: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [packagingPurchases, setPackagingPurchases] = useState<PackagingPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ✅ COMMON FIELDS (no packagingType here now)
  const [formData, setFormData] = useState({
    paymentMode: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    items: [
      { packagingType: '', unit: '', quantity: 0, ratePerUnit: 0 }
    ]
  });

  const fetchPackagingPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await packagingPurchaseAPI.getAll({ limit: '100' });
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
  const packagingFormFields = [
    {
      name: 'paymentMode',
      label: 'Payment Mode',
      type: 'select',
      required: true,
      options: Object.values(PaymentMode).map(v => ({ value: v, label: v }))
    },
    { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
  ];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ ITEM CHANGE
  const handleItemChange = (index: number, field: string, value: any) => {
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
        packagingType: item.packagingType,
        paymentMode: formData.paymentMode,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        deliveryDate: formData.deliveryDate,
        unit: item.unit,
        quantity: item.quantity,
        ratePerUnit: item.ratePerUnit
      }));

      await packagingPurchaseAPI.create(payload);

      setShowForm(false);
      fetchPackagingPurchases();

      setFormData({
        paymentMode: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date().toISOString().split('T')[0],
        items: [{ packagingType: '', unit: '', quantity: 0, ratePerUnit: 0 }]
      });

    } finally {
      setFormLoading(false);
    }
  };

  const packagingColumns = [
    { key: 'invoiceNumber', title: 'Invoice #' },
    { key: 'packagingType', title: 'Type' },
    { key: 'unit', title: 'Unit' },
    { key: 'quantity', title: 'Qty' },
    { key: 'ratePerUnit', title: 'Rate' },
  ];

  return (
    <div className="module-page">
      <h1>Packaging Purchases</h1>

      <button onClick={() => setShowForm(true)}>Add</button>

      <DataTable data={packagingPurchases} columns={packagingColumns} loading={loading} rowKey="_id" />

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>New Purchase</h3>

            <FormBuilder
              fields={packagingFormFields}
              values={formData}
              onChange={handleChange}
              onSubmit={(e) => { e.preventDefault(); submitForm(); }}
            />

         <div className="table-responsive mt-3">
  <table className="table table-bordered table-hover align-middle">
    <thead className="table-dark">
      <tr>
        <th style={{ width: '20%' }}>Type</th>
        <th style={{ width: '15%' }}>Qty</th>
        <th style={{ width: '15%' }}>Rate</th>
        <th style={{ width: '20%' }}>Amount</th>
        <th style={{ width: '10%' }}>Action</th>
      </tr>
    </thead>

    <tbody>
      {formData.items.map((item, index) => (
        <tr key={index}>
          
          {/* Type */}
          <td>
            <select
              className="form-select"
              value={item.packagingType}
              onChange={(e) =>
                handleItemChange(index, 'packagingType', e.target.value)
              }
            >
              <option value="">Select</option>
              {Object.values(PackagingType).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </td>

          {/* Quantity */}
          <td>
            <input
              type="number"
              className="form-control"
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(index, 'quantity', Number(e.target.value))
              }
              placeholder="Qty"
            />
          </td>

          {/* Rate */}
          <td>
            <input
              type="number"
              className="form-control"
              value={item.ratePerUnit}
              onChange={(e) =>
                handleItemChange(index, 'ratePerUnit', Number(e.target.value))
              }
              placeholder="Rate"
            />
          </td>

          {/* Amount */}
          <td className="fw-bold text-success">
            ₹{(item.quantity * item.ratePerUnit).toFixed(2)}
          </td>

          {/* Delete */}
          <td className="text-center">
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => removeRow(index)}
            >
              ✕
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

            <button onClick={addRow}>+ Add Row</button>

            <div style={{ marginTop: 20 }}>
              <button onClick={submitForm} disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Submit'}
              </button>
              <button onClick={() => setShowForm(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementPackaging;