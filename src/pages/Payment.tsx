import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  getWorkerPayments,
  getPendingPayments,
  getMonthlySummary,
  processPayment,
  cancelPayment,
  generatePayroll,
} from '../store/slices/paymentSlice';
import { fetchWorkers } from '../store/slices/workerSlice';
import './Pages.css';
import './Payroll.css';

type Tab = 'generate' | 'pending' | 'history' | 'summary';

const fmt = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Paid: 'badge-paid',
    Pending: 'badge-pending',
    Cancelled: 'badge-cancelled',
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

const Payment: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payments, pendingPayments, summary, loading, error } = useAppSelector((s) => s.payment);
  const { workers } = useAppSelector((s) => s.worker);

  const [tab, setTab] = useState<Tab>('generate');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyWorker, setHistoryWorker] = useState('');
  const [generateResult, setGenerateResult] = useState<any>(null);
  const [receiptModal, setReceiptModal] = useState<{ id: string; name: string } | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchWorkers({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'pending') dispatch(getPendingPayments({}));
    if (tab === 'summary') dispatch(getMonthlySummary(summaryMonth));
    if (tab === 'history' && historyWorker) dispatch(getWorkerPayments({ workerId: historyWorker }));
  }, [tab]);

  useEffect(() => {
    if (tab === 'summary') dispatch(getMonthlySummary(summaryMonth));
  }, [summaryMonth]);

  useEffect(() => {
    if (tab === 'history' && historyWorker) dispatch(getWorkerPayments({ workerId: historyWorker }));
  }, [historyWorker]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateMonth) return;
    try {
      const result = await dispatch(generatePayroll(generateMonth)).unwrap();
      setGenerateResult(result);
      showToast(`Payroll generated: ${result.summary?.totalGenerated ?? 0} records created`);
      dispatch(getPendingPayments({}));
    } catch (err: any) {
      showToast(err || 'Failed to generate payroll', 'error');
    }
  };

  const openReceiptModal = (id: string, name: string) => {
    setReceiptModal({ id, name });
    setReceiptNumber('');
  };

  const handleProcess = async () => {
    if (!receiptModal) return;
    try {
      await dispatch(processPayment({ id: receiptModal.id, receiptNumber: receiptNumber || undefined })).unwrap();
      showToast('Payment marked as paid');
      setReceiptModal(null);
      dispatch(getPendingPayments({}));
    } catch (err: any) {
      showToast(err || 'Failed to process payment', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this payment?')) return;
    try {
      await dispatch(cancelPayment(id)).unwrap();
      showToast('Payment cancelled');
      dispatch(getPendingPayments({}));
    } catch (err: any) {
      showToast(err || 'Failed to cancel', 'error');
    }
  };

  const selectedWorkerObj = workers.find((w) => w._id === selectedWorker);

  return (
    <div className="page-container payroll-page">
      {/* Toast */}
      {toast && <div className={`payroll-toast ${toast.type}`}>{toast.msg}</div>}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ width: 380 }}>
            <h3 style={{ marginBottom: '1rem' }}>Mark as Paid</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Worker: <strong>{receiptModal.name}</strong>
            </p>
            <div className="form-group">
              <label>Receipt Number (optional)</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. RCP-2024-001"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setReceiptModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcess} disabled={loading}>
                {loading ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="payroll-header">
        <div>
          <h1>Payroll Management</h1>
          <p className="payroll-subtitle">Attendance-based salary generation &amp; payment tracking</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        {([
          { key: 'generate', label: '⚙️ Generate Payroll' },
          { key: 'pending',  label: `🕐 Pending (${pendingPayments.length})` },
          { key: 'history',  label: '📋 History' },
          { key: 'summary',  label: '📊 Summary' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            className={`tab-button ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === 'generate' && (
        <div className="payroll-generate-layout">
          {/* Left: form */}
          <div className="section payroll-generate-form">
            <h2>Generate Monthly Payroll</h2>
            <p className="help-text">
              Salary is calculated from attendance records. Weekly offs &amp; holidays are paid.
              Up to 2 leaves/month are paid. Extra absences are deducted.
            </p>

            <form onSubmit={handleGenerate}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Payment Month *</label>
                <input
                  type="month"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Preview for Worker (optional)</label>
                <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                  <option value="">— All active workers —</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorkerObj && (
                <div className="payroll-worker-card">
                  <div className="pwc-row">
                    <span>Employee</span>
                    <strong>{selectedWorkerObj.name}</strong>
                  </div>
                  <div className="pwc-row">
                    <span>ID</span>
                    <strong>{selectedWorkerObj.employeeId}</strong>
                  </div>
                  <div className="pwc-row">
                    <span>Monthly Salary</span>
                    <strong className="green">
                      {fmt((selectedWorkerObj as any).monthlySalary || (selectedWorkerObj.dailyWage * 30))}
                    </strong>
                  </div>
                  <div className="pwc-row">
                    <span>Daily Rate</span>
                    <strong>{fmt(selectedWorkerObj.dailyWage)}</strong>
                  </div>
                </div>
              )}

              <div className="payroll-rules-box">
                <div className="rule-item">✅ Weekly offs — <strong>Paid</strong></div>
                <div className="rule-item">✅ Holidays — <strong>Paid</strong></div>
                <div className="rule-item">✅ Up to 2 leaves/month — <strong>Paid</strong></div>
                <div className="rule-item">❌ Extra absences — <strong>Deducted</strong></div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Generating…' : `Generate Payroll for ${generateMonth}`}
              </button>
            </form>
          </div>

          {/* Right: result */}
          <div className="payroll-generate-result">
            {generateResult ? (
              <>
                <div className="section" style={{ marginBottom: '1rem' }}>
                  <h3>Generation Summary</h3>
                  <div className="payroll-result-stats">
                    <div className="prs-card green">
                      <div className="prs-num">{generateResult.summary?.totalGenerated ?? 0}</div>
                      <div className="prs-label">Generated</div>
                    </div>
                    <div className="prs-card orange">
                      <div className="prs-num">{generateResult.summary?.totalSkipped ?? 0}</div>
                      <div className="prs-label">Skipped</div>
                    </div>
                    <div className="prs-card blue">
                      <div className="prs-num">{fmt(generateResult.summary?.totalAmount ?? 0)}</div>
                      <div className="prs-label">Total Amount</div>
                    </div>
                  </div>
                </div>

                {generateResult.generatedPayments?.length > 0 && (
                  <div className="section">
                    <h3>Generated Records</h3>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Worker</th>
                            <th>Present</th>
                            <th>W/Off</th>
                            <th>Paid Leave</th>
                            <th>Unpaid</th>
                            <th>Absent</th>
                            <th>Deduction</th>
                            <th>Net Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generateResult.generatedPayments.map((p: any) => (
                            <tr key={p.paymentId}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{p.employeeId}</div>
                              </td>
                              <td>{p.presentDays ?? '-'}</td>
                              <td>{p.weeklyOffDays ?? '-'}</td>
                              <td>{p.paidLeaveDays ?? '-'}</td>
                              <td className="red-text">{p.unpaidLeaveDays ?? '-'}</td>
                              <td className="red-text">{p.absentDays ?? '-'}</td>
                              <td className="red-text">{fmt(p.deductions ?? 0)}</td>
                              <td className="green-text" style={{ fontWeight: 700 }}>{fmt(p.basicWage ?? 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {generateResult.skippedWorkers?.length > 0 && (
                  <div className="section">
                    <h3>Skipped Workers</h3>
                    {generateResult.skippedWorkers.map((w: any) => (
                      <div key={w.workerId} className="payroll-skipped-row">
                        <span>{w.name} ({w.employeeId})</span>
                        <span className="badge badge-cancelled">{w.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="payroll-empty-result">
                <div style={{ fontSize: '3rem' }}>📋</div>
                <p>Select a month and click Generate to create payroll records based on attendance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Pending Payments</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => dispatch(getPendingPayments({}))}>
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="loading">Loading…</div>
          ) : pendingPayments.length === 0 ? (
            <div className="empty-state">No pending payments</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Month</th>
                    <th>Monthly Salary</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Deduction</th>
                    <th>Net Salary</th>
                    <th>Mode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p: any) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.workerId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{p.workerId?.employeeId}</div>
                      </td>
                      <td>{p.paymentMonth}</td>
                      <td>{fmt(p.monthlySalary ?? p.basicWage)}</td>
                      <td>{p.presentDays ?? '-'}</td>
                      <td className="red-text">{p.absentDays ?? '-'}</td>
                      <td className="red-text">{fmt(p.deductions)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(p.totalAmount)}</td>
                      <td>{p.paymentMode}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openReceiptModal(p._id, p.workerId?.name || '')}
                            disabled={loading}
                          >
                            ✓ Pay
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleCancel(p._id)}
                            disabled={loading}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="section">
          <h2>Payment History</h2>
          <div className="filter-section" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Select Worker</label>
              <select value={historyWorker} onChange={(e) => setHistoryWorker(e.target.value)}>
                <option value="">— Select a worker —</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!historyWorker ? (
            <div className="empty-state">Select a worker to view their payment history</div>
          ) : loading ? (
            <div className="loading">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="empty-state">No payment records found for this worker</div>
          ) : (
            <>
              {/* Worker summary strip */}
              {(() => {
                const w = workers.find((x) => x._id === historyWorker);
                const totalPaid = payments.filter((p) => p.paymentStatus === 'Paid').reduce((s, p) => s + p.totalAmount, 0);
                return w ? (
                  <div className="payroll-worker-strip">
                    <div><span>Worker</span><strong>{w.name}</strong></div>
                    <div><span>ID</span><strong>{w.employeeId}</strong></div>
                    <div><span>Total Paid</span><strong className="green">{fmt(totalPaid)}</strong></div>
                    <div><span>Records</span><strong>{payments.length}</strong></div>
                  </div>
                ) : null;
              })()}

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Monthly Salary</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Deduction</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th>Mode</th>
                      <th>Receipt</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.paymentMonth}</td>
                        <td>{fmt(p.monthlySalary ?? p.basicWage)}</td>
                        <td>{p.presentDays ?? '-'}</td>
                        <td className="red-text">{p.absentDays ?? '-'}</td>
                        <td className="red-text">{fmt(p.deductions)}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(p.totalAmount)}</td>
                        <td>{statusBadge(p.paymentStatus)}</td>
                        <td>{p.paymentMode}</td>
                        <td>{p.receiptNumber || '—'}</td>
                        <td>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {tab === 'summary' && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Monthly Summary</h2>
            <input
              type="month"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ddd' }}
            />
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : summary ? (
            <div className="summary-cards">
              {[
                { label: 'Total Payments', value: summary.totalPayments, color: '#3498db', prefix: '' },
                { label: 'Total Paid Out', value: summary.totalAmount, color: '#27ae60', prefix: '₹' },
                { label: 'Basic Wages', value: summary.totalBasicWage, color: '#2c3e50', prefix: '₹' },
                { label: 'Bonuses', value: summary.totalBonus, color: '#f39c12', prefix: '₹' },
                { label: 'Deductions', value: summary.totalDeductions, color: '#e74c3c', prefix: '₹' },
                { label: 'Avg Payment', value: summary.averagePayment, color: '#9b59b6', prefix: '₹' },
              ].map(({ label, value, color, prefix }) => (
                <div key={label} className="card" style={{ borderLeftColor: color }}>
                  <h3>{label}</h3>
                  <p className="card-value" style={{ color }}>
                    {prefix}{typeof value === 'number' && prefix === '₹'
                      ? value.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      : value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No data for {summaryMonth}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
