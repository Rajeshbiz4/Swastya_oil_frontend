import React, { useState, useEffect, useCallback } from 'react';
import FormBuilder from '../components/UI/FormBuilder';
import DataTable from '../components/UI/DataTable';
import Popup from '../components/UI/Popup';
import { FormField } from '../types';
import { OilTypes } from '../types/enums';
import { productTypeAPI, ProductTypeMaster } from '../services/api';
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
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const [formData, setFormData] = useState({
    batchNumber: '',
    productTypeId: '',
    oilType: '',
    quantity: 0,
  });
  const [productTypes, setProductTypes] = useState<ProductTypeMaster[]>([]);

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
    const loadProductTypes = async () => {
      try {
        const response = await productTypeAPI.getAll();
        setProductTypes(response.data.data?.productTypes || []);
      } catch (error) {
        console.error('Failed to load product types:', error);
      }
    };

    loadProductTypes();
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
    { key: 'quantity', title: 'Quantity', sortable: true, render: (value: number) => value.toLocaleString() },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          'pending': '#f39c12',
          'processing': '#3498db',
          'completed': '#27ae60',
          'cancelled': '#e74c3c',
          'failed': '#e74c3c'
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
    ...productTypes.map((productType) => ({
      value: productType._id,
      label: productType.label,
    }))
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
      label: 'Quantity',
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
        const selectedProductType = productTypes.find(
          (productType) => productType._id === formData.productTypeId
        );
        if (selectedProductType) {
          // Map the product code to the display value from OilTypes enum
          newData.oilType = selectedProductType.oilType;
          fetchAvailableQuantity(selectedProductType.oilType);
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
      // Calculate total available quantity for this oil type
      const totalAvailableQuantity = data.data.inventory
        .filter((item: any) => item.totalQuantity > 0)
        .reduce((sum: number, item: any) => sum + item.totalQuantity, 0);

      if (totalAvailableQuantity < requiredQuantity) {
        setModalError(`Insufficient stock. Available: ${totalAvailableQuantity.toLocaleString()}Kg, Required: ${requiredQuantity.toLocaleString()}Kg`);
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

  const updatePackagingInventory = async (packagingType: string, quantity: number, batchId: string): Promise<boolean> => {
    let isSuccess: boolean = false;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token is missing for packaging inventory update');
        return isSuccess;
      }

      // Consume packaging inventory using the packaging consume endpoint
      const response = await fetch('/api/inventory/packaging/consume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skuSize: '1KG', // Default SKU size - can be adjusted based on requirements
          packagingType: packagingType,
          quantity: quantity,
          productionBatchId: batchId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to consume packaging inventory:', errorData);
        return isSuccess;
      }

      const data = await response.json();
      if (data.success) {
        isSuccess = true;
        console.log('Packaging inventory consumed successfully');
        return isSuccess;
      } else {
        console.error('Failed to update packaging inventory:', data);
      }
    } catch (err) {
      console.error('Error consuming packaging inventory:', err);
      // Don't throw error as this is a secondary operation
    }
    return isSuccess;
  };

  const revertPackagingInventory = async (packagingType: string, quantity: number, batchId: string): Promise<boolean> => {
    let isSuccess: boolean = false;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token is missing for revert packaging inventory');
        return isSuccess;
      }

      // Consume packaging inventory using the packaging consume endpoint
      const response = await fetch('/api/inventory/packaging/revert', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skuSize: '1KG', // Default SKU size - can be adjusted based on requirements
          packagingType: packagingType,
          quantity: quantity,
          productionBatchId: batchId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to revert packaging inventory:', errorData);
        return isSuccess;
      }

      const data = await response.json();
      if (data.success) {
        isSuccess = true;
        console.log('Packaging inventory revert successfully');
        return isSuccess;
      } else {
        console.error('Failed to revert packaging inventory:', data);
      }
    } catch (err) {
      console.error('Error revert packaging inventory:', err);
      // Don't throw error as this is a secondary operation
    }
    return isSuccess;
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    let createdBatch: BatchRecord = {} as BatchRecord;
    const token = localStorage.getItem('authToken');
    if (!token) {
      setModalError('Authentication token is missing. Please login again.');
      return;
    }
    try {
      setFormLoading(true);


      const selectedProductType = productTypes.find(
        (productType) => productType._id === formData.productTypeId
      );
      if (!selectedProductType) {
        setModalError('Selected product type not found');
        return;
      }

      const requiredOilQty = formData.quantity * selectedProductType.weight / 1000;
      // Check inventory stock before creating batch
      const hasStock = await checkOilInventoryStock(selectedProductType.oilType, requiredOilQty);
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
          productTypeId: selectedProductType._id,
          oilType: selectedProductType.oilType,
          packagingType: selectedProductType.packagingType,
          quantity: formData.quantity,
          code: selectedProductType.oilType,
          weight: selectedProductType.weight,
          packageSize: selectedProductType.packageSize,
          unitType: selectedProductType.unitType,
          packagingMaterialType: selectedProductType.packagingMaterialType,
          packagingCostDivisionQty: selectedProductType.packagingCostDivisionQty,
          status: 'completed'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const message = data?.error?.message || 'Failed to create batch';
        throw new Error(message);
      }

      createdBatch = data.data as BatchRecord;
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
      const totalWeight = formData.quantity * (selectedProductType.weight / 1000);
      //Update raw oil inventory stock after created batch
      let rawInvUpdated: boolean = await updateRawOilInventory(selectedProductType.oilType, totalWeight);
      if (rawInvUpdated) {

        //For PP box calculation and inventory update, we will consider quantity as number of units (not weight) because packaging inventory is managed in units (e.g. 1 box = 1 unit) and not by weight. So we will directly use formData.quantity for packaging inventory update which represents the number of finished goods units produced and thus the number of packaging units consumed.
        const packagingMaterialQty = Math.ceil(
          formData.quantity / selectedProductType.packagingCostDivisionQty
        );

        let packagingInvUpdated = await updatePackagingInventory(
          selectedProductType.packagingMaterialType,
          packagingMaterialQty,
          createdBatch._id
        );

        if (packagingInvUpdated) {
          // ✅ Update finished goods inventory
          let finishedInvUpdated = await updateFinishedGoodsInventory(
            selectedProductType.oilType, // IMPORTANT: use `oilType` not code for finished goods
            selectedProductType.packagingType, // IMPORTANT: use `packagingType` not type for finished goods
            formData.quantity,
            createdBatch._id
          );
          const packagingMaterialQty = Math.ceil(
            Number(formData.quantity || 0) /
            Number(selectedProductType.packagingCostDivisionQty || 1)
          );
          if (!finishedInvUpdated) {
            // revert packaging inventory
            await revertPackagingInventory(selectedProductType.oilType, packagingMaterialQty, createdBatch._id);
            // revert raw oil inventory
            await revertRawOilInventory(selectedProductType.oilType, totalWeight);
            throw new Error('Failed to update finished goods inventory.');
          }
        }
        else {
          // revert raw oil inventory
          await revertRawOilInventory(selectedProductType.oilType, totalWeight);
          throw new Error('Failed to update finished goods inventory.');
        }

      }
      else {
        throw new Error('Batch created but failed to update inventory. Please check inventory levels and update manually if needed.');
      }
      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Batch Created Successfully',
        message: 'Batch created and inventory updated successfully.'
      });
      fetchOilBatches();
    } catch (err: unknown) {
      const anyErr = err as Error;
      console.error('Post-processing failed:', err);
      // Mark batch as FAILED
      await fetch(`/api/oil-batches/${createdBatch._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'failed' })
      });
      setPopup({
        isOpen: true,
        type: 'warning',
        title: 'Partial Failure',
        message: 'Batch created but failed to update packaging inventory. Please check inventory levels and update manually if needed.'
      });
      fetchOilBatches();
      setModalError(anyErr.message || 'Batch failed during processing. Marked as FAILED.');
    } finally {
      setFormLoading(false);
    }
  };

  const updateFinishedGoodsInventory = async (
    oilType: string,
    packagingType: string,
    quantity: number,
    batchId: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Auth token missing for finished goods update');
        return false;
      }

      const response = await fetch('/api/inventory/finished-goods/upsert', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oilType,
          packagingType,
          quantity,
          unitCost: 0, // you can improve later (optional)
          productionDate: new Date(),
          expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)), // default 6 months
          batchId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Failed to update finished goods inventory:', data);
        return false;
      }

      console.log('Finished goods inventory updated successfully');
      return true;

    } catch (err) {
      console.error('Error updating finished goods inventory:', err);
      // Don't break main flow
      return false;
    }
  };

  const updateRawOilInventory = async (
    code: string,
    totalWeight: number
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("Auth token missing for raw oil reduction");
        return false;
      }

      const response = await fetch("/api/inventory/raw-oil/reduceRawOilInventory", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          totalWeight,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Failed to reduce raw oil inventory:", data);
        return false;
      }

      console.log("Raw oil inventory reduced successfully");
      return true;
    } catch (err) {
      console.error("Error reducing raw oil inventory:", err);
      // Do not break main flow
      return false;
    }
  };

  const revertRawOilInventory = async (
    oilType: string,
    quantity: number
  ): Promise<void> => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("Auth token missing for raw oil revert");
        return;
      }

      const response = await fetch("/api/inventory/raw-oil/revert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oilType,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Failed to revert raw oil inventory:", data);
        return;
      }

      console.log("Raw oil inventory reverted successfully");
    } catch (err) {
      console.error("Error reverting raw oil inventory:", err);
      // Do not break main flow
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
                  <strong>Available Stock:</strong> {availableQuantity.toLocaleString()}
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

      <Popup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
};

export default OilBatchProcessing;
