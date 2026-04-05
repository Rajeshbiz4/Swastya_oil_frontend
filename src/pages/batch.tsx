import React, { useState, useEffect } from 'react';
import './ProductionImproved.css';
import api from '../services/api';

// Types
interface Worker {
  _id: string;
  employeeId: string;
  name: string;
  dailyWage: number;
  isActive: boolean;
}

interface OilInventory {
  _id: string;
  batchNumber: string;
  supplierName: string;
  currentQuantity: number;
  costPerLiter: number;
}

interface PackagingInventory {
  _id: string;
  packagingType: string;
  quantity: number;
  ratePerUnit: number;
  invoiceNumber: string;
  invoiceDate: string;
  currentStock?: number; // Virtual field
}

interface ProductionOutput {
  skuSize: '500g' | '1L' | '5L' | '10L' | '15L';
  packagingType: 'Can' | 'Bag';
  quantityProduced: number;
  unitCost: number;
}

interface ProductionBatch {
  _id: string;
  batchNumber: string;
  rawOilBatchId: string;
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

type ProductionStep = 'batch-creation' | 'inventory-update' | 'batch-list';

const ProductionImproved: React.FC = () => {
  // State Management
  const [currentStep, setCurrentStep] = useState<ProductionStep>('batch-list');
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [availableOil, setAvailableOil] = useState<OilInventory[]>([]);
  const [availablePackaging, setAvailablePackaging] = useState<PackagingInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Batch Creation Form State
  const [batchFormData, setBatchFormData] = useState({
    rawOilBatchId: '',
    name: '',
    productionDate: '',
    assignedWorkers: [] as string[],
    wipLosses: 0,
  });

  // Inventory Update Form State
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [oilConsumption, setOilConsumption] = useState<Array<{ inventoryId: string; quantityUsed: number }>>([]);
  const [packagingUsed, setPackagingUsed] = useState<Array<{ skuSize: string; packagingType: string; quantityUsed: number }>>([]);
  const [productionOutput, setProductionOutput] = useState<ProductionOutput[]>([]);

  // Fetch Functions
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/production/batches');
      if (response.data.success) {
        setBatches(response.data.data?.productionBatches || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers');
      if (response.data.success) {
        setWorkers(response.data.data?.workers || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const fetchAvailableOil = async () => {
    try {
      const response = await api.get('/inventory/raw-oil/available');
      if (response.data.success) {
        setAvailableOil(response.data.data?.availableInventory || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch available oil:', err);
    }
  };

  const fetchAvailablePackaging = async () => {
    try {
      const response = await api.get('/inventory/packaging');
      if (response.data.success) {
        setAvailablePackaging(response.data.data?.inventory || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch packaging:', err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchWorkers();
    fetchAvailableOil();
    fetchAvailablePackaging();
  }, []);

  // Handle Create Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFormData.rawOilBatchId || !batchFormData.productionDate || batchFormData.assignedWorkers.length === 0) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const selectedOilBatch = availableOil.find(o => o._id === batchFormData.rawOilBatchId);
      const batchNumber = `PROD-${new Date().getTime()}`;

      const response = await api.post('/production/batches', {
        batchNumber,
        rawOilBatchId: batchFormData.rawOilBatchId,
        productionDate: batchFormData.productionDate,
        assignedWorkers: batchFormData.assignedWorkers,
        wipLosses: batchFormData.wipLosses,
      });

      if (response.data.success) {
        setSuccess('Production batch created successfully!');
        setBatchFormData({ rawOilBatchId: '', productionDate: '', assignedWorkers: [], wipLosses: 0 });
        setCurrentStep('batch-list');
        await fetchBatches();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  // Handle Process Production
  const handleProcessProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatchId || oilConsumption.length === 0 || packagingUsed.length === 0 || productionOutput.length === 0) {
      setError('Please complete all inventory items');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/production/inventory-update', {
        batchId: editingBatchId,
        oilConsumption: oilConsumption.map(item => ({
          inventoryId: item.inventoryId,
          quantityUsed: item.quantityUsed,
          costPerLiter: availableOil.find(o => o._id === item.inventoryId)?.costPerLiter || 0,
        })),
        packagingUsed,
        output: productionOutput,
      });

      if (response.data.success) {
        setSuccess('Production processed successfully!');
        setEditingBatchId(null);
        setOilConsumption([]);
        setPackagingUsed([]);
        setProductionOutput([]);
        setCurrentStep('batch-list');
        await fetchBatches();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to process production');
    } finally {
      setLoading(false);
    }
  };

  // Render Batch Creation Step
  const renderBatchCreation = () => (
    <div className="prod-card">
      <h2>Create Production Batch</h2>
      <form onSubmit={handleCreateBatch}>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="string"
              value={batchFormData.name}
              required
            />
          </div>

          <div className="form-group">
            <label>Production Date *</label>
            <input
              type="date"
              value={batchFormData.productionDate}
              onChange={(e) => setBatchFormData({ ...batchFormData, productionDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>WIP Losses (Liters)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchFormData.wipLosses}
              onChange={(e) => setBatchFormData({ ...batchFormData, wipLosses: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Assign Workers *</label>
          <div className="worker-selection">
            {workers.map(worker => (
              <div key={worker._id} className="checkbox-item">
                <input
                  type="checkbox"
                  id={worker._id}
                  checked={batchFormData.assignedWorkers.includes(worker._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBatchFormData({
                        ...batchFormData,
                        assignedWorkers: [...batchFormData.assignedWorkers, worker._id]
                      });
                    } else {
                      setBatchFormData({
                        ...batchFormData,
                        assignedWorkers: batchFormData.assignedWorkers.filter(id => id !== worker._id)
                      });
                    }
                  }}
                />
                <label htmlFor={worker._id}>{worker.name} (₹{worker.dailyWage}/day)</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep('batch-list')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // Render Inventory Update Step
  const renderInventoryUpdate = () => {
    const batch = batches.find(b => b._id === editingBatchId);
    if (!batch) return null;

    return (
      <div className="prod-card">
        <h2>Process Production - {batch.batchNumber}</h2>
        <form onSubmit={handleProcessProduction}>
          {/* Oil Consumption Section */}
          <div className="prod-section">
            <h3>Oil Consumption</h3>
            <div className="form-group">
              <label>Select Oil Inventory</label>
              <select onChange={(e) => {
                if (e.target.value) {
                  setOilConsumption([...oilConsumption, { inventoryId: e.target.value, quantityUsed: 0 }]);
                  e.target.value = '';
                }
              }}>
                <option value="">-- Add Oil --</option>
                {availableOil.map(oil => (
                  <option key={oil._id} value={oil._id}>
                    {oil.batchNumber} ({oil.currentQuantity}L available)
                  </option>
                ))}
              </select>
            </div>

            <div className="items-list">
              {oilConsumption.map((item, idx) => {
                const oil = availableOil.find(o => o._id === item.inventoryId);
                return (
                  <div key={idx} className="item-row">
                    <div className="item-info">{oil?.batchNumber} @ ₹{oil?.costPerLiter}/L</div>
                    <input
                      type="number"
                      placeholder="Quantity (L)"
                      value={item.quantityUsed}
                      onChange={(e) => {
                        const newItems = [...oilConsumption];
                        newItems[idx].quantityUsed = parseFloat(e.target.value) || 0;
                        setOilConsumption(newItems);
                      }}
                      min="0"
                      max={oil?.currentQuantity}
                    />
                    <button
                      type="button"
                      className="btn btn-danger-sm"
                      onClick={() => setOilConsumption(oilConsumption.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Packaging Used Section */}
          <div className="prod-section">
            <h3>Packaging Used</h3>
            <div className="form-group">
              <label>Select Packaging</label>
              <select onChange={(e) => {
                if (e.target.value) {
                  const [skuSize, packagingType] = e.target.value.split('|');
                  setPackagingUsed([...packagingUsed, { skuSize, packagingType, quantityUsed: 0 }]);
                  e.target.value = '';
                }
              }}>
                <option value="">-- Add Packaging --</option>
                {availablePackaging.map((pkg, idx) => (
                  <option key={idx} value={pkg.packagingType}>
                    {pkg.packagingType} ({pkg.quantity || pkg.currentStock || 0} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="items-list">
              {packagingUsed.map((item, idx) => (
                <div key={idx} className="item-row">
                  <div className="item-info">{item.skuSize} {item.packagingType}</div>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantityUsed}
                    onChange={(e) => {
                      const newItems = [...packagingUsed];
                      newItems[idx].quantityUsed = parseInt(e.target.value) || 0;
                      setPackagingUsed(newItems);
                    }}
                    min="0"
                  />
                  <button
                    type="button"
                    className="btn btn-danger-sm"
                    onClick={() => setPackagingUsed(packagingUsed.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Production Output Section */}
          <div className="prod-section">
            <h3>Production Output</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>SKU Size</label>
                <select id="sku-select">
                  <option value="">-- Select SKU --</option>
                  <option value="500g">500g</option>
                  <option value="1L">1L</option>
                  <option value="5L">5L</option>
                  <option value="10L">10L</option>
                  <option value="15L">15L</option>
                </select>
              </div>

              <div className="form-group">
                <label>Packaging Type</label>
                <select id="pkg-type-select">
                  <option value="">-- Select Type --</option>
                  <option value="Can">Can</option>
                  <option value="Bag">Bag</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input type="number" id="qty-input" placeholder="Quantity" min="0" />
              </div>

              <div className="form-group">
                <label>Unit Cost (₹)</label>
                <input type="number" id="cost-input" placeholder="Unit Cost" min="0" step="0.01" />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const skuInput = document.getElementById('sku-select') as HTMLSelectElement;
                const typeInput = document.getElementById('pkg-type-select') as HTMLSelectElement;
                const qtyInput = document.getElementById('qty-input') as HTMLInputElement;
                const costInput = document.getElementById('cost-input') as HTMLInputElement;

                if (skuInput.value && typeInput.value && qtyInput.value && costInput.value) {
                  setProductionOutput([...productionOutput, {
                    skuSize: skuInput.value as any,
                    packagingType: typeInput.value as any,
                    quantityProduced: parseInt(qtyInput.value),
                    unitCost: parseFloat(costInput.value),
                  }]);
                  skuInput.value = '';
                  typeInput.value = '';
                  qtyInput.value = '';
                  costInput.value = '';
                }
              }}
            >
              Add Output
            </button>

            <div className="items-list">
              {productionOutput.map((item, idx) => (
                <div key={idx} className="item-row">
                  <div className="item-info">
                    {item.skuSize} {item.packagingType} x {item.quantityProduced} @ ₹{item.unitCost}
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-sm"
                    onClick={() => setProductionOutput(productionOutput.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || oilConsumption.length === 0 || packagingUsed.length === 0 || productionOutput.length === 0}>
              {loading ? 'Processing...' : 'Process Production'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => {
              setEditingBatchId(null);
              setOilConsumption([]);
              setPackagingUsed([]);
              setProductionOutput([]);
              setCurrentStep('batch-list');
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render Batch List
  const renderBatchList = () => (
    <>
      <div className="prod-stats">
        <div className="stat-box">
          <div className="stat-value">{batches.length}</div>
          <div className="stat-label">Total Batches</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{batches.filter(b => b.status === 'InProgress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{batches.filter(b => b.status === 'Completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{batches.reduce((sum, b) => sum + b.output.reduce((s: number, o: any) => s + o.quantityProduced, 0), 0)}</div>
          <div className="stat-label">Units Produced</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => setCurrentStep('batch-creation')}>
        + Create New Batch
      </button>

      <div className="batches-grid">
        {batches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Production Batches</h3>
            <p>Create your first production batch to get started</p>
          </div>
        ) : (
          batches.map(batch => (
            <div key={batch._id} className={`batch-card status-${batch.status.toLowerCase()}`}>
              <div className="batch-header">
                <div>
                  <h4>{batch.batchNumber}</h4>
                  <p className="batch-date">{new Date(batch.productionDate).toLocaleDateString()}</p>
                </div>
                <span className={`status-badge status-${batch.status.toLowerCase()}`}>
                  {batch.status}
                </span>
              </div>

              <div className="batch-details">
                <div className="detail-item">
                  <span className="label">Workers:</span>
                  <span className="value">{batch.assignedWorkers.length}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Output Units:</span>
                  <span className="value">{batch.output.reduce((s: number, o: any) => s + o.quantityProduced, 0)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Labor Cost:</span>
                  <span className="value">₹{batch.totalLaborCost.toFixed(2)}</span>
                </div>
              </div>

              {batch.status === 'InProgress' && (
                <button
                  className="btn btn-primary-sm"
                  onClick={() => {
                    setEditingBatchId(batch._id);
                    setCurrentStep('inventory-update');
                  }}
                >
                  Process Production
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="production-page">
      <div className="prod-header">
        <h1>⚙️ Production Management</h1>
        <p>Manage production batches and track manufacturing activities</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="prod-container">
        {currentStep === 'batch-creation' && renderBatchCreation()}
        {currentStep === 'inventory-update' && renderInventoryUpdate()}
        {currentStep === 'batch-list' && renderBatchList()}
      </div>
    </div>
  );
};

export default ProductionImproved;
