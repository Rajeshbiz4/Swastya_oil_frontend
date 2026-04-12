import React, { useState, useEffect, useCallback } from 'react';
import FormBuilder from '../components/UI/FormBuilder';
import DataTable from '../components/UI/DataTable';
import { FormField } from '../types';
import { OilTypes } from '../types/enums';
import { PRODUCT_TYPES } from '../utils/constants';
import './Pages.css';

interface BatchRecord {
  _id: string;
  batchNumber: string;
  oilType: string;
  packagingType: string;
  quantity: number;
  code?: string;
  weight?: number;
  status: string;
  createdAt: string;
}

const OilBatchProcessing: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    batchNumber: '',
    productTypeId: '',
    oilType: '',
    quantity: 0,
  });

  // Auto-generate batch number
  const generateBatchNumber = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BATCH-${timestamp}-${random}`;
  }, []);

  const fetchOilBatches = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please login to load oil batches.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/oil-batches', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Oil batches API error:', response.status, errorData);
        throw new Error(`Failed to fetch oil batches: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data && data.data.batches) {
        setBatches(data.data.batches);
      } else {
        console.error('Invalid oil batches response structure:', data);
      }
    } catch (err) {
      console.error('Error fetching oil batches:', err);
      setError('Failed to load oil batches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize form data with auto-generated batch number
    setFormData((prev) => ({
      ...prev,
      batchNumber: generateBatchNumber(),
    }));

    fetchOilBatches();
  }, [generateBatchNumber, fetchOilBatches]);

  const batchColumns = [
    { key: 'batchNumber', title: 'Batch Number', sortable: true },
    { 
      key: 'oilType', 
      title: 'Oil Type', 
      sortable: true,
      render: (value: string) => value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '-'
    },
    { key: 'packagingType', title: 'Packaging Type', sortable: true },
    { key: 'code', title: 'Product Code', sortable: true },
    { key: 'weight', title: 'Weight', sortable: true, render: (value: number) => value ? `${value.toLocaleString()} g` : '-' },
    { key: 'quantity', title: 'Quantity (L)', sortable: true, render: (value: number) => value.toLocaleString() },
    { 
      key: 'status', 
      title: 'Status', 
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          'pending': '#f39c12',
          'processing': '#3498db',
          'completed': '#27ae60',
          'cancelled': '#e74c3c'
        };
        return <span style={{ color: statusColors[value] || '#95a5a6' }}>● {value || 'pending'}</span>;
      }
    },
    { 
      key: 'createdAt', 
      title: 'Created Date', 
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
  ];

  const productTypeOptions = [
    { value: '', label: 'Select product type' },
    ...PRODUCT_TYPES.map((productType) => ({
      value: productType.value,
      label: productType.label,
    })),
  ];

  const batchFormFields: FormField[] = [
    { 
      name: 'batchNumber', 
      label: 'Batch Number', 
      type: 'text', 
      required: true,
      disabled: true,
    },
    {
      name: 'productTypeId',
      label: 'Product Type',
      type: 'select',
      required: true,
      options: productTypeOptions
    },
    { 
      name: 'oilType', 
      label: 'Oil Type (Auto-populated)', 
      type: 'select', 
      required: true,
      options: Object.values(OilTypes).map((value) => ({ value, label: value })),
      disabled: true
    },
    { 
      name: 'quantity', 
      label: 'Quantity (L)', 
      type: 'number', 
      required: true,
      min: '1'
    },
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.productTypeId) errors.productTypeId = 'Product type is required';
    if (!formData.oilType) errors.oilType = 'Oil type is required';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Auto-populate oilType when productTypeId changes
      if (name === 'productTypeId' && value) {
        const selectedProductType = PRODUCT_TYPES.find((productType) => productType.value === value);
        if (selectedProductType) {
          newData.oilType = selectedProductType.code;
          // Fetch available quantity for this oil type
          fetchAvailableQuantity(selectedProductType.code);
        }
      } else if (name === 'productTypeId' && !value) {
        // Clear available quantity when no product type is selected
        setAvailableQuantity(null);
      }
      
      return newData;
    });
  };

  const fetchAvailableQuantity = async (productTypeCode: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }

      const response = await fetch('/api/inventory/raw-oil?oilType=' + encodeURIComponent(productTypeCode), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch inventory data');
        return;
      }

      const data = await response.json();
      if (data.success && data.data && data.data.inventory) {
        // Calculate total available quantity for this oil type
        const totalAvailableQuantity = data.data.inventory
          .filter((item: any) => item.totalQuantity > 0)
          .reduce((sum: number, item: any) => sum + item.totalQuantity, 0);
        setAvailableQuantity(totalAvailableQuantity);
      }
    } catch (err) {
      console.error('Error fetching available quantity:', err);
      setAvailableQuantity(null);
    }
  };

  const checkOilInventoryStock = async (productTypeCode: string, requiredQuantity: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token is missing. Please login again.');
      }
      const response = await fetch('/api/inventory/raw-oil?oilType=' + encodeURIComponent(productTypeCode), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to check inventory: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.data || !data.data.inventory) {
        throw new Error('Invalid inventory response structure');
      }
      debugger;
      // Calculate total available quantity for this oil type
      const totalAvailableQuantity = data.data.inventory
        .filter((item: any) =>  item.totalQuantity > 0)
        .reduce((sum: number, item: any) => sum + item.totalQuantity, 0);

      if (totalAvailableQuantity < requiredQuantity) {
        setModalError(`Insufficient stock. Available: ${totalAvailableQuantity.toLocaleString()}L, Required: ${requiredQuantity.toLocaleString()}L`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error checking inventory stock:', err);
      const anyErr = err as Error;
      setModalError(anyErr.message || 'Failed to check inventory stock');
      return false;
    }
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    
    try {
      setFormLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setModalError('Authentication token is missing. Please login again.');
        return;
      }

      const selectedProductType = PRODUCT_TYPES.find((productType) => productType.value === formData.productTypeId);
      if (!selectedProductType) {
        setModalError('Selected product type not found');
        return;
      }

      // Check inventory stock before creating batch
      const hasStock = await checkOilInventoryStock(selectedProductType.code, formData.quantity * selectedProductType.weight / 1000); // Convert liters to weight in kg for stock check
      if (!hasStock) {
        return; // Error already set by checkOilInventoryStock  
      }

      const packagingType = selectedProductType.packagingType;

      const response = await fetch('/api/oil-batches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchNumber: formData.batchNumber,
          oilType: formData.oilType,
          packagingType,
          quantity: formData.quantity,
          code: selectedProductType.code,
          weight: selectedProductType.weight,
          status: 'completed'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const message = data?.error?.message || 'Failed to create batch';
        throw new Error(message);
      }

      const createdBatch = data.data as BatchRecord;
      setBatches((prev) => [createdBatch, ...prev]);
      setSuccess('Oil batch created successfully');
      setModalError(null); // Clear modal error on success
      setShowForm(false);
      setFormData({
        batchNumber: generateBatchNumber(),
        productTypeId: '',
        oilType: '',
        quantity: 0,
      });
      setAvailableQuantity(null); // Clear available quantity on success
    } catch (err: unknown) {
      const anyErr = err as Error;
      setModalError(anyErr.message || 'Failed to create batch');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Oil Batch Processing</h1>
          <p>Create and manage oil batches for packaging and distribution</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="module-content">
        <div className="filters-section">
          <div className="filter-group" style={{ marginLeft: 'auto' }}>
            <button className="primary-button" onClick={() => {
              setShowForm(true);
              setModalError(null); // Clear modal error when opening
              setAvailableQuantity(null); // Clear available quantity when opening
            }}>
              Create New Batch
            </button>
          </div>
        </div>

        <div className="data-table-wrapper">
          <DataTable
            data={batches}
            columns={batchColumns}
            loading={loading}
            rowKey="_id"
          />
        </div>

        {showForm && (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content">
              <div className="modal-header">
                <h3 id="modal-title">Create Oil Batch</h3>
                <button className="modal-close" aria-label="Close" onClick={() => {
                  setShowForm(false);
                  setAvailableQuantity(null);
                }}>×</button>
              </div>

              <p className="help-text">Enter the batch details for oil processing and packaging.</p>

              {modalError && <div className="error-message" style={{ marginBottom: '15px' }}>{modalError}</div>}

              <FormBuilder
                fields={batchFormFields}
                values={formData}
                onChange={handleChange}
                onSubmit={(e) => { e.preventDefault(); submitForm(); }}
                loading={formLoading}
                submitText="Create Batch"
                errors={formErrors}
              />

              {availableQuantity !== null && formData.productTypeId && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px 12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  fontSize: '14px',
                  color: '#495057',
                  textAlign: 'right'
                }}>
                  <strong>Available Stock:</strong> {availableQuantity.toLocaleString()} L
                </div>
              )}

              <div className="modal-actions">
                <button onClick={submitForm} disabled={formLoading} className="primary-button">
                  {formLoading ? 'Creating...' : 'Create Batch'}
                </button>
                <button onClick={() => {
                  setShowForm(false);
                  setAvailableQuantity(null);
                }} className="secondary-button">
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

export default OilBatchProcessing;
