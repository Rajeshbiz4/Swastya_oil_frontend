import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import FormBuilder from '../components/UI/FormBuilder';
import { FormField } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchWorkers, createWorker, updateWorker, deactivateWorker, assignWork } from '../store/slices/workerSlice';
import './Pages.css';

const Worker: React.FC = () => {
  const dispatch = useAppDispatch();
  const { workers, loading, error, pagination } = useAppSelector((state) => state.worker);
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showAssignWork, setShowAssignWork] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    phone: '',
    dailyWage: ''
  });

  const [assignWorkData, setAssignWorkData] = useState({
    taskDescription: '',
    batchId: ''
  });

  useEffect(() => {
    dispatch(fetchWorkers({ isActive: showActiveOnly }));
  }, [dispatch, showActiveOnly]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'dailyWage' ? parseFloat(value) || '' : value
    }));
  };

  const handleAssignWorkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssignWorkData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const submitData = {
        ...formData,
        dailyWage: parseFloat(formData.dailyWage as string) || 0
      };
      if (editingWorker) {
        await dispatch(updateWorker({
          id: editingWorker._id,
          data: submitData
        }));
      } else {
        await dispatch(createWorker(submitData));
      }
      setFormData({ employeeId: '', name: '', phone: '', dailyWage: '' });
      setEditingWorker(null);
      setShowForm(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !assignWorkData.taskDescription) return;

    setFormLoading(true);
    try {
      await dispatch(assignWork({
        id: selectedWorkerId,
        taskDescription: assignWorkData.taskDescription,
        batchId: assignWorkData.batchId || undefined
      }));
      setAssignWorkData({ taskDescription: '', batchId: '' });
      setShowAssignWork(false);
      setSelectedWorkerId(null);
    } catch (error) {
      console.error('Assign work error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (worker: any) => {
    setEditingWorker(worker);
    setFormData({
      employeeId: worker.employeeId,
      name: worker.name,
      phone: worker.phone,
      dailyWage: worker.dailyWage
    });
    setShowForm(true);
  };

  const handleDeactivate = async (workerId: string) => {
    if (confirm('Are you sure you want to deactivate this worker?')) {
      try {
        await dispatch(deactivateWorker(workerId));
      } catch (error) {
        console.error('Deactivate error:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingWorker(null);
    setFormData({ employeeId: '', name: '', phone: '', dailyWage: '' });
    setShowForm(true);
  };

  const handleOpenAssignWork = (workerId: string) => {
    setSelectedWorkerId(workerId);
    setAssignWorkData({ taskDescription: '', batchId: '' });
    setShowAssignWork(true);
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'dailyWage', label: 'Daily Wage', formatter: (value: number) => `PKR ${value.toFixed(2)}` },
    {
      key: 'isActive',
      label: 'Status',
      formatter: (value: boolean) => (value ? 'Active' : 'Inactive')
    },
    {
      key: 'totalWorkDays',
      label: 'Work Days',
      formatter: (value: number) => value || 0
    },
    {
      key: 'totalLaborCost',
      label: 'Total Labor Cost',
      formatter: (value: number) => `PKR ${value.toFixed(2)}`
    }
  ];

  const workerForm: FormField[] = [
    { name: 'employeeId', label: 'Employee ID', type: 'text', required: true, disabled: !!editingWorker },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { name: 'dailyWage', label: 'Daily Wage (PKR)', type: 'number', required: true, min: '0.01', step: '0.01' }
  ];

  return (
    <div className="page-container">
      <h1>Worker Management</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Header Section */}
      <div className="section-header">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
          />
          Active Workers Only
        </label>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Add New Worker
        </button>
      </div>

      {/* Worker Form */}
      {showForm && (
        <div className="form-section">
          <h2>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</h2>
          <form onSubmit={handleFormSubmit}>
            {workerForm.map((field) => (
              <div key={field.name} className="form-group">
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleFormChange}
                  required={field.required}
                  disabled={field.disabled || formLoading}
                  min={field.min}
                  step={field.step}
                />
              </div>
            ))}
            <div className="form-actions">
              <button type="submit" disabled={formLoading} className="btn btn-primary">
                {formLoading ? 'Saving...' : editingWorker ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={formLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Work Form */}
      {showAssignWork && selectedWorkerId && (
        <div className="form-section">
          <h2>Assign Work</h2>
          <form onSubmit={handleAssignWorkSubmit}>
            <div className="form-group">
              <label htmlFor="taskDescription">Task Description *</label>
              <textarea
                id="taskDescription"
                name="taskDescription"
                value={assignWorkData.taskDescription}
                onChange={handleAssignWorkChange}
                required
                disabled={formLoading}
                rows={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="batchId">Batch ID (Optional)</label>
              <input
                id="batchId"
                name="batchId"
                type="text"
                value={assignWorkData.batchId}
                onChange={handleAssignWorkChange}
                disabled={formLoading}
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={formLoading} className="btn btn-primary">
                {formLoading ? 'Assigning...' : 'Assign Work'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignWork(false)}
                disabled={formLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workers List */}
      <div className="table-section">
        <h2>Workers List ({pagination.total} total)</h2>
        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="empty-state">No workers found</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker._id}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.formatter
                          ? col.formatter((worker as any)[col.key])
                          : (worker as any)[col.key]}
                      </td>
                    ))}
                    <td className="action-cell">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(worker)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenAssignWork(worker._id)}
                      >
                        Assign Work
                      </button>
                      {worker.isActive && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivate(worker._id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Worker;
