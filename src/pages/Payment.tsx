import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { createPayment, getWorkerPayments, getPendingPayments, getMonthlySummary, processPayment, getAllPayments, generatePayroll } from '../store/slices/paymentSlice';
import { fetchWorkers } from '../store/slices/workerSlice';
import './Pages.css';

const Payment: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payments, pendingPayments, summary, loading, error } = useAppSelector((state) => state.payment);
  const { workers } = useAppSelector((state) => state.worker);

  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'history' | 'summary' | 'generate'>('create');
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));

  const [formData, setFormData] = useState({
    workerId: '',
    paymentMonth: new Date().toISOString().slice(0, 7),
    basicWage: '',
    bonusAmount: '0',
    deductions: '0',
    paymentMode: 'Cash' as 'Cash' | 'Check' | 'BankTransfer',
    notes: ''
  });

  useEffect(() => {
    dispatch(fetchWorkers({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'pending') {
      dispatch(getPendingPayments({}));
    } else if (activeTab === 'history' && selectedWorker) {
      dispatch(getWorkerPayments({ workerId: selectedWorker }));
    } else if (activeTab === 'summary') {
      dispatch(getMonthlySummary(paymentMonth));
    }
  }, [dispatch, activeTab, selectedWorker, paymentMonth]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['basicWage', 'bonusAmount', 'deductions'].includes(name) ? (parseFloat(value) || '') : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId || !formData.basicWage) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await dispatch(
        createPayment({
          workerId: formData.workerId,
          paymentMonth: formData.paymentMonth,
          basicWage: parseFloat(formData.basicWage as string),
          bonusAmount: parseFloat(formData.bonusAmount as string) || 0,
          deductions: parseFloat(formData.deductions as string) || 0,
          paymentMode: formData.paymentMode,
          notes: formData.notes
        })
      );
      setFormData({
        workerId: '',
        paymentMonth: new Date().toISOString().slice(0, 7),
        basicWage: '',
        bonusAmount: '0',
        deductions: '0',
        paymentMode: 'Cash',
        notes: ''
      });
      alert('Payment created successfully');
    } catch (error) {
      console.error('Payment creation error:', error);
    }
  };

  const handleProcessPayment = async (paymentId: string) => {
    const receipt = prompt('Enter receipt number (optional):');
    try {
      await dispatch(processPayment({ id: paymentId, receiptNumber: receipt || undefined }));
      alert('Payment processed successfully');
    } catch (error) {
      console.error('Payment processing error:', error);
    }
  };

  const calculateTotal = () => {
    const basic = parseFloat(formData.basicWage as string) || 0;
    const bonus = parseFloat(formData.bonusAmount as string) || 0;
    const deductions = parseFloat(formData.deductions as string) || 0;
    return basic + bonus - deductions;
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateMonth) {
      alert('Please select a payment month');
      return;
    }
    try {
      const result = await dispatch(generatePayroll(generateMonth)).unwrap();
      alert(`Payroll generated successfully for ${generateMonth}. ${result.message || 'Check pending payments for details.'}`);
      dispatch(getPendingPayments({}));
    } catch (error) {
      console.error('Payroll generation error:', error);
      alert('Failed to generate payroll');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#4CAF50';
      case 'Pending':
        return '#FF9800';
      case 'Cancelled':
        return '#f44336';
      default:
        return '#999';
    }
  };

  return (
    <div className="page-container">
      <h1>Worker Payroll Management</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Payment
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Monthly Summary
        </button>
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Payroll
        </button>
      </div>

      {/* Create Payment Tab */}
      {activeTab === 'create' && (
        <div className="section">
          <h2>Create Worker Payment</h2>
          <form onSubmit={handleFormSubmit} className="form-grid">
            <div className="form-group">
              <label htmlFor="workerId">Select Worker *</label>
              <select
                id="workerId"
                name="workerId"
                value={formData.workerId}
                onChange={handleFormChange}
                required
              >
                <option value="">-- Select Worker --</option>
                {workers.map((worker) => (
                  <option key={worker._id} value={worker._id}>
                    {worker.name} ({worker.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMonth">Payment Month *</label>
              <input
                id="paymentMonth"
                name="paymentMonth"
                type="month"
                value={formData.paymentMonth}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="basicWage">Basic Wage (PKR) *</label>
              <input
                id="basicWage"
                name="basicWage"
                type="number"
                min="0"
                step="0.01"
                value={formData.basicWage}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bonusAmount">Bonus Amount (PKR)</label>
              <input
                id="bonusAmount"
                name="bonusAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.bonusAmount}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="deductions">Deductions (PKR)</label>
              <input
                id="deductions"
                name="deductions"
                type="number"
                min="0"
                step="0.01"
                value={formData.deductions}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMode">Payment Mode</label>
              <select
                id="paymentMode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleFormChange}
              >
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="BankTransfer">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={3}
              />
            </div>

            {/* Total Amount Summary */}
            <div className="payment-summary" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <div className="summary-row">
                <span>Basic Wage:</span>
                <span className="amount">PKR {(parseFloat(formData.basicWage as string) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Bonus:</span>
                <span className="amount">PKR {(parseFloat(formData.bonusAmount as string) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Deductions:</span>
                <span className="amount" style={{ color: '#f44336' }}>
                  PKR {(parseFloat(formData.deductions as string) || 0).toFixed(2)}
                </span>
              </div>
              <div className="summary-row" style={{ fontWeight: 'bold', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total:</span>
                <span className="amount" style={{ color: '#4CAF50' }}>
                  PKR {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Payments Tab */}
      {activeTab === 'pending' && (
        <div className="section">
          <h2>Pending Payments ({pendingPayments.length})</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="empty-state">No pending payments</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Month</th>
                    <th>Basic Wage</th>
                    <th>Bonus</th>
                    <th>Deductions</th>
                    <th>Total Amount</th>
                    <th>Mode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{(payment.workerId as any)?.name || 'Unknown'}</td>
                      <td>{payment.paymentMonth}</td>
                      <td>PKR {payment.basicWage.toFixed(2)}</td>
                      <td>PKR {payment.bonusAmount.toFixed(2)}</td>
                      <td>PKR {payment.deductions.toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold' }}>PKR {payment.totalAmount.toFixed(2)}</td>
                      <td>{payment.paymentMode}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleProcessPayment(payment._id)}
                          disabled={loading}
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="section">
          <h2>Payment History</h2>
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="historyWorker">Select Worker</label>
              <select
                id="historyWorker"
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
              >
                <option value="">-- Select Worker --</option>
                {workers.map((worker) => (
                  <option key={worker._id} value={worker._id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedWorker && (
            <div className="table-section" style={{ marginTop: '2rem' }}>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="empty-state">No payment records found</div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Mode</th>
                        <th>Receipt</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>{payment.paymentMonth}</td>
                          <td>PKR {payment.totalAmount.toFixed(2)}</td>
                          <td>
                            <span
                              style={{
                                color: getStatusColor(payment.paymentStatus),
                                fontWeight: 'bold'
                              }}
                            >
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td>{payment.paymentMode}</td>
                          <td>{payment.receiptNumber || '-'}</td>
                          <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary Tab */}
      {activeTab === 'summary' && (
        <div className="section">
          <h2>Monthly Payment Summary</h2>
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="summaryMonth">Select Month</label>
              <input
                id="summaryMonth"
                type="month"
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
              />
            </div>
          </div>

          {summary && (
            <div className="summary-cards" style={{ marginTop: '2rem' }}>
              <div className="card">
                <h3>Total Payments</h3>
                <p className="card-value">{summary.totalPayments}</p>
              </div>
              <div className="card">
                <h3>Total Amount Paid</h3>
                <p className="card-value" style={{ color: '#4CAF50' }}>
                  PKR {summary.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h3>Basic Wages</h3>
                <p className="card-value">PKR {summary.totalBasicWage.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Bonuses</h3>
                <p className="card-value" style={{ color: '#4CAF50' }}>
                  PKR {summary.totalBonus.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h3>Deductions</h3>
                <p className="card-value" style={{ color: '#f44336' }}>
                  PKR {summary.totalDeductions.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h3>Average Payment</h3>
                <p className="card-value">PKR {summary.averagePayment.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Payroll Tab */}
      {activeTab === 'generate' && (
        <div className="section">
          <h2>Generate Payroll</h2>
          <form onSubmit={handleGeneratePayroll} className="form-grid">
            <div className="form-group">
              <label htmlFor="generateMonth">Payment Month *</label>
              <input
                id="generateMonth"
                name="generateMonth"
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                required
              />
            </div>

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Payroll'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Payment;
