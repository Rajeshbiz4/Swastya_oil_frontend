import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { recordAttendance, getWorkerAttendance, getAttendanceSummary, getAllAttendance } from '../store/slices/attendanceSlice';
import { fetchWorkers } from '../store/slices/workerSlice';
import './Pages.css';

const Attendance: React.FC = () => {
  const dispatch = useAppDispatch();
  const { attendance, summary, loading, error, pagination } = useAppSelector((state) => state.attendance);
  const { workers } = useAppSelector((state) => state.worker);

  const [showForm, setShowForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'record' | 'view' | 'summary'>('record');

  const [formData, setFormData] = useState({
    workerId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'Present' as 'Present' | 'Absent' | 'Leave',
    hoursWorked: '8',
    notes: ''
  });

  useEffect(() => {
    dispatch(fetchWorkers({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'view' && selectedWorker) {
      dispatch(getWorkerAttendance({ workerId: selectedWorker, startDate, endDate }));
    } else if (activeTab === 'summary' && selectedWorker) {
      dispatch(getAttendanceSummary({ workerId: selectedWorker, startDate, endDate }));
    } else if (activeTab === 'record') {
      dispatch(getAllAttendance({}));
    }
  }, [dispatch, activeTab, selectedWorker, startDate, endDate]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hoursWorked' ? parseFloat(value) || '' : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId) {
      alert('Please select a worker');
      return;
    }

    try {
      await dispatch(
        recordAttendance({
          workerId: formData.workerId,
          attendanceDate: formData.attendanceDate,
          status: formData.status,
          hoursWorked: parseInt(formData.hoursWorked as string, 10),
          notes: formData.notes
        })
      );
      // Reset form
      setFormData({
        workerId: '',
        attendanceDate: new Date().toISOString().split('T')[0],
        status: 'Present',
        hoursWorked: '8',
        notes: ''
      });
      alert('Attendance recorded successfully');
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return '#4CAF50';
      case 'Absent':
        return '#f44336';
      case 'Leave':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  return (
    <div className="page-container">
      <h1>Attendance Management</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          Record Attendance
        </button>
        <button
          className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View Attendance
        </button>
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Attendance Summary
        </button>
      </div>

      {/* Record Attendance Tab */}
      {activeTab === 'record' && (
        <div className="section">
          <h2>Record Attendance</h2>
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
              <label htmlFor="attendanceDate">Attendance Date *</label>
              <input
                id="attendanceDate"
                name="attendanceDate"
                type="date"
                value={formData.attendanceDate}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hoursWorked">Hours Worked</label>
              <input
                id="hoursWorked"
                name="hoursWorked"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.hoursWorked}
                onChange={handleFormChange}
                disabled={formData.status !== 'Present'}
              />
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

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Recording...' : 'Record Attendance'}
              </button>
            </div>
          </form>

          {/* Recent Attendance */}
          <div className="table-section" style={{ marginTop: '2rem' }}>
            <h3>Recent Attendance Records</h3>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : attendance.length === 0 ? (
              <div className="empty-state">No records found</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Worker</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Hours Worked</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.slice(0, 10).map((record) => (
                      <tr key={record._id}>
                        <td>{(record.workerId as any)?.name || 'Unknown'}</td>
                        <td>{new Date(record.attendanceDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              color: getStatusColor(record.status),
                              fontWeight: 'bold'
                            }}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td>{record.hoursWorked}</td>
                        <td>{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Attendance Tab */}
      {activeTab === 'view' && (
        <div className="section">
          <h2>View Attendance</h2>
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="viewWorker">Select Worker</label>
              <select
                id="viewWorker"
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
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {selectedWorker && (
            <div className="table-section" style={{ marginTop: '2rem' }}>
              <h3>Attendance Records</h3>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : attendance.length === 0 ? (
                <div className="empty-state">No attendance records found</div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Hours Worked</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record._id}>
                          <td>{new Date(record.attendanceDate).toLocaleDateString()}</td>
                          <td>
                            <span
                              style={{
                                color: getStatusColor(record.status),
                                fontWeight: 'bold'
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td>{record.hoursWorked}</td>
                          <td>{record.notes || '-'}</td>
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

      {/* Attendance Summary Tab */}
      {activeTab === 'summary' && (
        <div className="section">
          <h2>Attendance Summary</h2>
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="summaryWorker">Select Worker</label>
              <select
                id="summaryWorker"
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
            <div className="form-group">
              <label htmlFor="summaryStartDate">Start Date</label>
              <input
                id="summaryStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="summaryEndDate">End Date</label>
              <input
                id="summaryEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {selectedWorker && summary && (
            <div className="summary-cards" style={{ marginTop: '2rem' }}>
              <div className="card">
                <h3>Total Days</h3>
                <p className="card-value">{summary.totalDays}</p>
              </div>
              <div className="card" style={{ borderColor: '#4CAF50' }}>
                <h3>Present Days</h3>
                <p className="card-value" style={{ color: '#4CAF50' }}>
                  {summary.presentDays}
                </p>
              </div>
              <div className="card" style={{ borderColor: '#f44336' }}>
                <h3>Absent Days</h3>
                <p className="card-value" style={{ color: '#f44336' }}>
                  {summary.absentDays}
                </p>
              </div>
              <div className="card" style={{ borderColor: '#FF9800' }}>
                <h3>Leave Days</h3>
                <p className="card-value" style={{ color: '#FF9800' }}>
                  {summary.leaveDays}
                </p>
              </div>
              <div className="card">
                <h3>Total Hours</h3>
                <p className="card-value">{summary.totalHours}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
