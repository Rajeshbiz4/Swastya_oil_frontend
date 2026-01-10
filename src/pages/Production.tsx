import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import DateRangePicker from '../components/UI/DateRangePicker';
import { SKUSize, PackagingType } from '../types';
import api from '../services/api';
import './Pages.css';

interface Worker {
  _id: string;
  name: string;
  dailyWage: number;
  isActive: boolean;
}

interface ProductionOutput {
  skuSize: '500g' | '1L' | '5L' | '10L' | '15L';
  packagingType: 'Can' | 'Bag';
  quantityProduced: number;
  unitCost: number;
}

interface OilInventory {
  _id: string;
  batchNumber: string;
  supplierName: string;
  currentQuantity: number;
  costPerLiter: number;
  expiryDate: string;
}

interface PackagingInventory {
  skuSize: '500g' | '1L' | '5L' | '10L' | '15L';
  packagingType: 'Can' | 'Bag';
  currentStock: number;
}

interface OilConsumption {
  inventoryId: string;
  quantityUsed: number;
  costPerLiter: number;
}

interface PackagingUsed {
  skuSize: '500g' | '1L' | '5L' | '10L' | '15L';
  packagingType: 'Can' | 'Bag';
  quantityUsed: number;
}

interface ProductionBatch {
  _id: string;
  batchNumber: string;
  productionDate: string;
  assignedWorkers: Worker[];
  oilConsumption: any[];
  packagingUsed: any[];
  output: ProductionOutput[];
  wipLosses: number;
  totalLaborCost: number;
  status: 'InProgress' | 'Completed';
  createdAt: string;
}

const Production: React.FC = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [availableOil, setAvailableOil] = useState<OilInventory[]>([]);
  const [availablePackaging, setAvailablePackaging] = useState<PackagingInventory[]>([]);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Stage 1: Batch Creation Form
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: '',
    productionDate: '',
    assignedWorkers: [] as string[],
    wipLosses: 0,
  });

  // Stage 2: Inventory Update Form (only shown for InProgress batches)
  const [showInventoryUpdate, setShowInventoryUpdate] = useState(false);
  const [inventoryUpdateData, setInventoryUpdateData] = useState({
    batchId: '',
    oilConsumption: [] as OilConsumption[],
    packagingUsed: [] as PackagingUsed[],
    output: [] as ProductionOutput[],
  });

  const [outputItem, setOutputItem] = useState({
    skuSize: '',
    packagingType: '',
    quantityProduced: 0,
    unitCost: 0,
  });

  const [oilItem, setOilItem] = useState({
    inventoryId: '',
    quantityUsed: 0,
    costPerLiter: 0,
  });

  const [packagingItem, setPackagingItem] = useState({
    skuSize: '',
    packagingType: '',
    quantityUsed: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/production/batches?${params}`);
      if (response.data.success) {
        setBatches(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch production batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers');
      if (response.data.success) {
        setWorkers(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const fetchAvailableOil = async () => {
    try {
      const response = await api.get('/inventory/raw-oil/available');
      if (response.data.success) {
        setAvailableOil(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch available oil:', err);
    }
  };

  const fetchAvailablePackaging = async () => {
    try {
      const response = await api.get('/inventory/packaging');
      if (response.data.success) {
        setAvailablePackaging(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch available packaging:', err);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchAvailableOil();
    fetchAvailablePackaging();
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [startDate, endDate]);

  const handleBatchFormChange = (name: string, value: any) => {
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkerToggle = (workerId: string) => {
    setBatchFormData(prev => ({
      ...prev,
      assignedWorkers: prev.assignedWorkers.includes(workerId)
        ? prev.assignedWorkers.filter(id => id !== workerId)
        : [...prev.assignedWorkers, workerId]
    }));
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormErrors({});

      if (!batchFormData.batchNumber || !batchFormData.productionDate || batchFormData.assignedWorkers.length === 0) {
        setFormErrors({ form: 'Please fill in all required fields including at least one worker' });
        return;
      }

      const response = await api.post('/production/batches', batchFormData);
      if (response.data.success) {
        setShowBatchForm(false);
        setBatchFormData({
          batchNumber: '',
          productionDate: '',
          assignedWorkers: [],
          wipLosses: 0,
        });
        fetchBatches();
      }
    } catch (err: any) {
      setFormErrors({ form: err.error?.message || 'Failed to create production batch' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddOutputItem = () => {
    if (!outputItem.skuSize || !outputItem.packagingType || outputItem.quantityProduced <= 0) {
      setFormErrors({ form: 'Please fill in all output item fields' });
      return;
    }
    setInventoryUpdateData(prev => ({
      ...prev,
      output: [...prev.output, {
        skuSize: outputItem.skuSize as '500g' | '1L' | '5L' | '10L' | '15L',
        packagingType: outputItem.packagingType as 'Can' | 'Bag',
        quantityProduced: outputItem.quantityProduced,
        unitCost: outputItem.unitCost
      }]
    }));
    setOutputItem({
      skuSize: '',
      packagingType: '',
      quantityProduced: 0,
      unitCost: 0,
    });
  };

  const handleRemoveOutputItem = (index: number) => {
    setInventoryUpdateData(prev => ({
      ...prev,
      output: prev.output.filter((_, i) => i !== index)
    }));
  };

  const handleAddOilItem = () => {
    if (!oilItem.inventoryId || oilItem.quantityUsed <= 0) {
      setFormErrors({ form: 'Please select oil batch and enter quantity' });
      return;
    }
    const selectedOil = availableOil.find(o => o._id === oilItem.inventoryId);
    if (!selectedOil) {
      setFormErrors({ form: 'Selected oil batch not found' });
      return;
    }
    setInventoryUpdateData(prev => ({
      ...prev,
      oilConsumption: [...prev.oilConsumption, {
        inventoryId: oilItem.inventoryId,
        quantityUsed: oilItem.quantityUsed,
        costPerLiter: selectedOil.costPerLiter
      }]
    }));
    setOilItem({
      inventoryId: '',
      quantityUsed: 0,
      costPerLiter: 0,
    });
  };

  const handleRemoveOilItem = (index: number) => {
    setInventoryUpdateData(prev => ({
      ...prev,
      oilConsumption: prev.oilConsumption.filter((_, i) => i !== index)
    }));
  };

  const handleAddPackagingItem = () => {
    if (!packagingItem.skuSize || !packagingItem.packagingType || packagingItem.quantityUsed <= 0) {
      setFormErrors({ form: 'Please fill in all packaging item fields' });
      return;
    }
    setInventoryUpdateData(prev => ({
      ...prev,
      packagingUsed: [...prev.packagingUsed, {
        skuSize: packagingItem.skuSize as '500g' | '1L' | '5L' | '10L' | '15L',
        packagingType: packagingItem.packagingType as 'Can' | 'Bag',
        quantityUsed: packagingItem.quantityUsed
      }]
    }));
    setPackagingItem({
      skuSize: '',
      packagingType: '',
      quantityUsed: 0,
    });
  };

  const handleRemovePackagingItem = (index: number) => {
    setInventoryUpdateData(prev => ({
      ...prev,
      packagingUsed: prev.packagingUsed.filter((_, i) => i !== index)
    }));
  };

  const handleOpenInventoryUpdate = (batchId: string) => {
    setEditingBatchId(batchId);
    setInventoryUpdateData({
      batchId,
      oilConsumption: [],
      packagingUsed: [],
      output: [],
    });
    setOilItem({
      inventoryId: '',
      quantityUsed: 0,
      costPerLiter: 0,
    });
    setPackagingItem({
      skuSize: '',
      packagingType: '',
      quantityUsed: 0,
    });
    setOutputItem({
      skuSize: '',
      packagingType: '',
      quantityProduced: 0,
      unitCost: 0,
    });
    setShowInventoryUpdate(true);
  };

  const handleInventoryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormErrors({});

      if (inventoryUpdateData.output.length === 0) {
        setFormErrors({ form: 'At least one output item is required' });
        return;
      }

      if (inventoryUpdateData.oilConsumption.length === 0) {
        setFormErrors({ form: 'At least one oil consumption entry is required' });
        return;
      }

      if (inventoryUpdateData.packagingUsed.length === 0) {
        setFormErrors({ form: 'At least one packaging used entry is required' });
        return;
      }

      console.log('Sending inventory update data:', inventoryUpdateData);

      const response = await api.post('/production/inventory-update', inventoryUpdateData);
      if (response.data.success) {
        setShowInventoryUpdate(false);
        setInventoryUpdateData({
          batchId: '',
          oilConsumption: [],
          packagingUsed: [],
          output: [],
        });
        setOilItem({
          inventoryId: '',
          quantityUsed: 0,
          costPerLiter: 0,
        });
        setPackagingItem({
          skuSize: '',
          packagingType: '',
          quantityUsed: 0,
        });
        setOutputItem({
          skuSize: '',
          packagingType: '',
          quantityProduced: 0,
          unitCost: 0,
        });
        fetchBatches();
      }
    } catch (err: any) {
      setFormErrors({ form: err.error?.message || 'Failed to update inventory' });
    } finally {
      setFormLoading(false);
    }
  };


  const columns = [
    { key: 'batchNumber', title: 'Batch Number', sortable: true },
    { key: 'productionDate', title: 'Production Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { 
      key: 'assignedWorkers', 
      title: 'Workers Assigned', 
      render: (_: any, record: ProductionBatch) => record.assignedWorkers.length
    },
    { 
      key: 'totalOutput', 
      title: 'Total Output', 
      render: (_: any, record: ProductionBatch) => record.output.reduce((sum, item) => sum + item.quantityProduced, 0).toLocaleString()
    },
    { key: 'wipLosses', title: 'WIP Losses (L)', sortable: true, render: (value: number) => value.toLocaleString() },
    { key: 'status', title: 'Status', sortable: true, render: (value: string) => value === 'Completed' ? '✅ Completed' : '🔄 In Progress' },
  ];

  // Stage 1: Batch Creation Form UI
  if (showBatchForm && !showInventoryUpdate) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Create Production Batch</h1>
          <p>Stage 1: Create a new production batch. You'll process inventory in the next step.</p>
        </div>

        <div className="form-container">
          {formErrors.form && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleCreateBatch}>
            <div className="form-group">
              <label>Batch Number *</label>
              <input
                type="text"
                value={batchFormData.batchNumber}
                onChange={(e) => handleBatchFormChange('batchNumber', e.target.value)}
                placeholder="e.g., BATCH-001"
                required
              />
            </div>

            <div className="form-group">
              <label>Production Date *</label>
              <input
                type="date"
                value={batchFormData.productionDate}
                onChange={(e) => handleBatchFormChange('productionDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>WIP Losses (Liters)</label>
              <input
                type="number"
                value={batchFormData.wipLosses}
                onChange={(e) => handleBatchFormChange('wipLosses', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Assign Workers *</label>
              <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
                {workers.length === 0 ? (
                  <p style={{ color: '#999' }}>No workers available</p>
                ) : (
                  workers.map(worker => (
                    <label key={worker._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={batchFormData.assignedWorkers.includes(worker._id)}
                        onChange={() => handleWorkerToggle(worker._id)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>{worker.name} (₹{worker.dailyWage}/day)</span>
                    </label>
                  ))
                )}
              </div>
              {batchFormData.assignedWorkers.length === 0 && (
                <small style={{ color: '#d32f2f' }}>At least one worker must be assigned</small>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="primary-button" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Batch'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowBatchForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Stage 2: Inventory Update Form UI
  if (showInventoryUpdate) {
    const batch = batches.find(b => b._id === editingBatchId);
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Process Production Inventory</h1>
          <p>Stage 2: Record finished goods output for batch {batch?.batchNumber}</p>
        </div>

        <div className="form-container">
          {formErrors.form && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleInventoryUpdate}>
            <h3 style={{ marginBottom: '1rem' }}>Add Oil Consumption</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Oil Batch *</label>
                <select
                  value={oilItem.inventoryId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedOil = availableOil.find(o => o._id === selectedId);
                    setOilItem({
                      ...oilItem,
                      inventoryId: selectedId,
                      costPerLiter: selectedOil ? selectedOil.costPerLiter : 0
                    });
                  }}
                  required
                >
                  <option value="">Select Oil Batch</option>
                  {availableOil.map(oil => (
                    <option key={oil._id} value={oil._id}>
                      {oil.batchNumber} - {oil.currentQuantity}L @ ₹{oil.costPerLiter}/L
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Used (Liters) *</label>
                <input
                  type="number"
                  value={oilItem.quantityUsed}
                  onChange={(e) => setOilItem({...oilItem, quantityUsed: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cost per Liter</label>
                <input
                  type="number"
                  value={oilItem.costPerLiter}
                  readOnly
                  placeholder="Auto-filled"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="primary-button" onClick={handleAddOilItem}>
                  Add Oil
                </button>
              </div>
            </div>

            {inventoryUpdateData.oilConsumption.length > 0 && (
              <div style={{ marginBottom: '2rem', borderTop: '2px solid #e0e0e0', paddingTop: '1rem' }}>
                <h4>Oil Consumption Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Batch</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cost/L</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryUpdateData.oilConsumption.map((item, idx) => {
                      const oil = availableOil.find(o => o._id === item.inventoryId);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.5rem' }}>{oil?.batchNumber}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.quantityUsed}L</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>₹{item.costPerLiter}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>₹{(item.quantityUsed * item.costPerLiter).toFixed(2)}</td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveOilItem(idx)}
                              style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Add Packaging Used</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>SKU Size *</label>
                <select
                  value={packagingItem.skuSize}
                  onChange={(e) => setPackagingItem({...packagingItem, skuSize: e.target.value as any})}
                  required
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
                  value={packagingItem.packagingType}
                  onChange={(e) => setPackagingItem({...packagingItem, packagingType: e.target.value as any})}
                  required
                >
                  <option value="">Select Type</option>
                  {Object.values(PackagingType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Used *</label>
                <input
                  type="number"
                  value={packagingItem.quantityUsed}
                  onChange={(e) => setPackagingItem({...packagingItem, quantityUsed: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="primary-button" onClick={handleAddPackagingItem}>
                  Add Packaging
                </button>
              </div>
            </div>

            {inventoryUpdateData.packagingUsed.length > 0 && (
              <div style={{ marginBottom: '2rem', borderTop: '2px solid #e0e0e0', paddingTop: '1rem' }}>
                <h4>Packaging Used Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Quantity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryUpdateData.packagingUsed.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.5rem' }}>{item.skuSize}</td>
                        <td style={{ padding: '0.5rem' }}>{item.packagingType}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.quantityUsed}</td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleRemovePackagingItem(idx)}
                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Add Output Items</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>SKU Size *</label>
                <select
                  value={outputItem.skuSize}
                  onChange={(e) => setOutputItem({...outputItem, skuSize: e.target.value as any})}
                  required
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
                  value={outputItem.packagingType}
                  onChange={(e) => setOutputItem({...outputItem, packagingType: e.target.value as any})}
                  required
                >
                  <option value="">Select Type</option>
                  {Object.values(PackagingType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Produced *</label>
                <input
                  type="number"
                  value={outputItem.quantityProduced}
                  onChange={(e) => setOutputItem({...outputItem, quantityProduced: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit Cost *</label>
                <input
                  type="number"
                  value={outputItem.unitCost}
                  onChange={(e) => setOutputItem({...outputItem, unitCost: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="primary-button" onClick={handleAddOutputItem}>
                  Add Item
                </button>
              </div>
            </div>

            {inventoryUpdateData.output.length > 0 && (
              <div style={{ marginBottom: '2rem', borderTop: '2px solid #e0e0e0', paddingTop: '1rem' }}>
                <h4>Output Items Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Unit Cost</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryUpdateData.output.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.5rem' }}>{item.skuSize}</td>
                        <td style={{ padding: '0.5rem' }}>{item.packagingType}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.quantityProduced}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>₹{item.unitCost.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>₹{(item.quantityProduced * item.unitCost).toFixed(2)}</td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveOutputItem(idx)}
                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="primary-button" disabled={formLoading || inventoryUpdateData.output.length === 0 || inventoryUpdateData.oilConsumption.length === 0 || inventoryUpdateData.packagingUsed.length === 0}>
                {formLoading ? 'Processing...' : 'Process Production'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowInventoryUpdate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Production Management</h1>
          <p>Manage production batches and track manufacturing activities</p>
        </div>
        <div className="module-actions">
          <button className="primary-button" onClick={() => setShowBatchForm(true)}>
            Create Production Batch
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
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            label="Filter by Production Date"
          />
        </div>

        <DataTable
          data={batches}
          columns={columns}
          loading={loading}
          rowKey="_id"
          onRowClick={(record) => {
            if (record.status === 'InProgress') {
              handleOpenInventoryUpdate(record._id);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Production;