import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  fetchAnalytics,
  MaintenanceRecord,
  MaintenanceType,
} from '../store/slices/maintenanceSlice';
import './Pages.css';
import './Maintenance.css';

type Tab = 'records' | 'add' | 'dashboard';

const TYPES: MaintenanceType[] = ['Preventive', 'Corrective', 'Breakdown', 'Emergency', 'Loss'];

const TYPE_COLOR: Record<string, string> = {
  Preventive: '#3498db',
  Corrective: '#f39c12',
  Breakdown: '#e74c3c',
  Emergency: '#9b59b6',
  Loss: '#e67e22',
};

const fmt = (n: number) =>
  '\u20B9' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  maintenanceType: 'Preventive' as MaintenanceType,
  description: '',
  amount: 0,
});

const Maintenance: React.FC = () => {
  const dispatch = useAppDispatch();
  const { records, analytics, loading, analyticsLoading, error, pagination } =
    useAppSelector((s) => s.maintenance);

  const [tab, setTab] = useState<Tab>('records');
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [page, setPage] = useState(1);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadRecords = useCallback(() => {
    dispatch(fetchMaintenance({
      page,
      limit: 20,
      ...(filterType && { type: filterType }),
      ...(filterStart && { startDate: filterStart }),
      ...(filterEnd && { endDate: filterEnd }),
    }));
  }, [dispatch, page, filterType, filterStart, filterEnd]);

  useEffect(() => {
    if (tab === 'records') loadRecords();
    if (tab === 'dashboard') dispatch(fetchAnalytics({}));
  }, [tab, loadRecords, dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await dispatch(updateMaintenance({ id: editId, data: form })).unwrap();
        showSuccess('Record updated successfully');
        setEditId(null);
      } else {
        await dispatch(createMaintenance(form)).unwrap();
        showSuccess('Record added successfully');
      }
      setForm(emptyForm());
      setTab('records');
      loadRecords();
    } catch (err: any) {
      // error shown via redux state
    }
  };

  const handleEdit = (r: MaintenanceRecord) => {
    setForm({
      date: r.date.split('T')[0],
      maintenanceType: r.maintenanceType,
      description: r.description,
      amount: r.amount,
    });
    setEditId(r._id);
    setTab('add');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await dispatch(deleteMaintenance(deleteId)).unwrap();
    setDeleteId(null);
    showSuccess('Record deleted');
    loadRecords();
  };

  const maxTypeAmt =
    analytics && analytics.byType.length > 0
      ? Math.max(...analytics.byType.map((t) => t.totalAmount))
      : 1;

  const maxMonthAmt =
    analytics && analytics.byMonth.length > 0
      ? Math.max(...analytics.byMonth.map((m) => m.totalAmount))
      : 1;

  const monthLabel = (y: number, m: number) =>
    new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });

  return (
    <div className="page-container">
      {successMsg && <div className="success-message">{successMsg}</div>}
      {error && <div className="error-message">{error}</div>}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Confirm Delete</h3>
            <p style={{ color: '#666', margin: '0.75rem 0 1.25rem' }}>
              This record will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Maintenance Management</h1>
          <p style={{ color: '#7f8c8d', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Track maintenance spending and losses
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyForm()); setEditId(null); setTab('add'); }}
        >
          + Add Record
        </button>
      </div>

      <div className="tabs">
        <button className={`tab-button ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>
          Records
        </button>
        <button className={`tab-button ${tab === 'add' ? 'active' : ''}`} onClick={() => { setForm(emptyForm()); setEditId(null); setTab('add'); }}>
          {editId ? 'Edit Record' : 'Add Record'}
        </button>
        <button className={`tab-button ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
      </div>

      {tab === 'records' && (
        <div className="section">
          <div className="maint-filters">
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={filterStart} onChange={(e) => { setFilterStart(e.target.value); setPage(1); }} />
            <input type="date" value={filterEnd} onChange={(e) => { setFilterEnd(e.target.value); setPage(1); }} />
            <button className="btn btn-secondary btn-sm" onClick={loadRecords}>Apply</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterType(''); setFilterStart(''); setFilterEnd(''); setPage(1); }}>
              Clear
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : records.length === 0 ? (
            <div className="empty-state">No records found. Add your first maintenance record.</div>
          ) : (
            <React.Fragment>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span
                            className="maint-badge"
                            style={{
                              background: (TYPE_COLOR[r.maintenanceType] || '#999') + '22',
                              color: TYPE_COLOR[r.maintenanceType] || '#999',
                              border: `1px solid ${TYPE_COLOR[r.maintenanceType] || '#999'}55`,
                            }}
                          >
                            {r.maintenanceType}
                          </span>
                        </td>
                        <td>{r.description}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(r.amount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(r)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(r._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.pages > 1 && (
                <div className="maint-pagination">
                  <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                  <span>Page {page} of {pagination.pages} ({pagination.total} records)</span>
                  <button className="btn btn-sm btn-secondary" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div className="section">
          <h2>{editId ? 'Edit Record' : 'Add Maintenance Record'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Maintenance Type *</label>
              <select name="maintenanceType" value={form.maintenanceType} onChange={handleChange} required>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount (Rs.) *</label>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the maintenance work or loss..."
                required
              />
            </div>

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editId ? 'Update Record' : 'Save Record'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setForm(emptyForm()); setEditId(null); setTab('records'); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'dashboard' && (
        <div>
          {analyticsLoading ? (
            <div className="loading">Loading...</div>
          ) : analytics ? (
            <React.Fragment>
              <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderLeftColor: '#e74c3c' }}>
                  <h3>Today's Spending</h3>
                  <p className="card-value" style={{ color: '#e74c3c' }}>{fmt(analytics.summary.totalCostToday)}</p>
                </div>
                <div className="card" style={{ borderLeftColor: '#3498db' }}>
                  <h3>This Month</h3>
                  <p className="card-value" style={{ color: '#3498db' }}>{fmt(analytics.summary.totalCostMonth)}</p>
                </div>
                <div className="card" style={{ borderLeftColor: '#27ae60' }}>
                  <h3>Total Records</h3>
                  <p className="card-value" style={{ color: '#27ae60' }}>{analytics.summary.totalCount}</p>
                </div>
              </div>

              <div className="maint-charts-grid">
                <div className="section">
                  <h3>Spending by Type</h3>
                  {analytics.byType.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1rem' }}>No data</div>
                  ) : (
                    <div className="maint-pie-list">
                      {analytics.byType.map((t) => (
                        <div key={t._id} className="maint-pie-row">
                          <div className="maint-pie-dot" style={{ background: TYPE_COLOR[t._id] || '#999' }} />
                          <span className="maint-pie-label">{t._id}</span>
                          <div className="maint-pie-bar-wrap">
                            <div
                              className="maint-pie-bar"
                              style={{
                                width: `${(t.totalAmount / maxTypeAmt) * 100}%`,
                                background: TYPE_COLOR[t._id] || '#999',
                              }}
                            />
                          </div>
                          <span className="maint-pie-amt">{fmt(t.totalAmount)}</span>
                          <span className="maint-pie-count">({t.count})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="section" style={{ gridColumn: '1 / -1' }}>
                  <h3>Monthly Trend (Last 12 Months)</h3>
                  {analytics.byMonth.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1rem' }}>No data</div>
                  ) : (
                    <div className="maint-trend-chart">
                      {analytics.byMonth.map((m) => (
                        <div key={`${m._id.year}-${m._id.month}`} className="maint-trend-col">
                          <span className="maint-trend-amt">{fmt(m.totalAmount)}</span>
                          <div className="maint-trend-bar-wrap">
                            <div
                              className="maint-trend-bar"
                              style={{ height: `${(m.totalAmount / maxMonthAmt) * 100}%` }}
                            />
                          </div>
                          <span className="maint-trend-label">{monthLabel(m._id.year, m._id.month)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div className="empty-state">No analytics data available yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
