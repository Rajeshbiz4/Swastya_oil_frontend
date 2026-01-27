import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { FormField } from '../types';
import localDataService, { TankerBooking } from '../services/localDataService';
import './Pages.css';

const Booking: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [bookings, setBookings] = useState<TankerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<TankerBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<string>('');

  // Form data with default current date
  const [formData, setFormData] = useState({
    bookingDate: localDataService.getTodayDate(),
    tankerCapacity: 0,
    rate: 0,
    bookingAmount: 0,
    remarks: '',
  });

  // Field errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load bookings from local data service
  const loadBookings = () => {
    setLoading(true);
    try {
      const storedBookings = localDataService.getAllBookings();
      setBookings(storedBookings);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on date range
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredBookings(bookings);
      return;
    }

    const filtered = localDataService.getBookingsByDateRange(startDate, endDate);
    setFilteredBookings(filtered);
  }, [bookings, startDate, endDate]);

  // Load bookings on mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Reset form when opening
  useEffect(() => {
    if (showForm) {
      setFormData({
        bookingDate: localDataService.getTodayDate(),
        tankerCapacity: 0,
        rate: 0,
        bookingAmount: 0,
        remarks: '',
      });
      setFormErrors({});
    }
  }, [showForm]);

  // Form fields
  const formFields: FormField[] = [
    { 
      name: 'bookingDate', 
      label: 'Booking Date', 
      type: 'date', 
      required: true 
    },
    { 
      name: 'tankerCapacity', 
      label: 'Tanker Capacity (Liters)', 
      type: 'number', 
      required: true,
      min: '1'
    },
    { 
      name: 'rate', 
      label: 'Rate per Liter (₹)', 
      type: 'number', 
      required: true,
      min: '0.01',
      step: '0.01'
    },
    { 
      name: 'bookingAmount', 
      label: 'Booking Amount (₹)', 
      type: 'number', 
      required: true,
      min: '0',
      step: '0.01'
    },
    { 
      name: 'remarks', 
      label: 'Remarks', 
      type: 'textarea', 
      required: false 
    },
  ];

  // Table columns
  const columns = [
    { 
      key: 'bookingDate', 
      title: 'Booking Date', 
      sortable: true, 
      render: (value: string) => new Date(value).toLocaleDateString() 
    },
    { 
      key: 'tankerCapacity', 
      title: 'Tanker Capacity (L)', 
      sortable: true, 
      render: (value: number) => value.toLocaleString() 
    },
    { 
      key: 'rate', 
      title: 'Rate/L', 
      sortable: true, 
      render: (value: number) => `₹${value.toFixed(2)}` 
    },
    { 
      key: 'bookingAmount', 
      title: 'Booking Amount', 
      sortable: true, 
      render: (value: number) => `₹${value.toLocaleString()}` 
    },
    { 
      key: 'paidAmount', 
      title: 'Paid Amount', 
      sortable: true, 
      render: (value: number) => `₹${(value || 0).toLocaleString()}` 
    },
    { 
      key: 'pendingAmount', 
      title: 'Pending Amount', 
      sortable: true, 
      render: (value: number, row: TankerBooking) => {
        const pending = (row.tankerCapacity * row.rate - row.bookingAmount);
        debugger;
        return (
          <span style={{ color: pending > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
            ₹{pending.toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true, 
      render: (value: string) => {
        const statusColors: Record<string, { bg: string; color: string }> = {
          'Pending': { bg: '#fff3cd', color: '#856404' },
          'PartiallyPaid': { bg: '#cce5ff', color: '#004085' },
          'Completed': { bg: '#d4edda', color: '#155724' },
        };
        const style = statusColors[value] || statusColors['Pending'];
        return (
          <span style={{ 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            backgroundColor: style.bg,
            color: style.color
          }}>
            {value || 'Pending'}
          </span>
        );
      }
    },
    { 
      key: 'remarks', 
      title: 'Remarks', 
      render: (value: string) => value || '-' 
    },
  ];

  // Form handlers
  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.bookingDate) {
      errors.bookingDate = 'Booking date is required';
    }
    if (!formData.tankerCapacity || formData.tankerCapacity <= 0) {
      errors.tankerCapacity = 'Tanker capacity must be greater than 0';
    }
    if (!formData.rate || formData.rate <= 0) {
      errors.rate = 'Rate must be greater than 0';
    }
    if (formData.bookingAmount < 0) {
      errors.bookingAmount = 'Booking amount cannot be negative';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setFormLoading(true);
      setFormErrors({});
      
      // Create booking using local data service
      localDataService.createBooking({
        bookingDate: formData.bookingDate,
        tankerCapacity: formData.tankerCapacity,
        rate: formData.rate,
        bookingAmount: formData.bookingAmount,
        remarks: formData.remarks,
      });
      
      // Update state
      setShowForm(false);
      setSuccess('Tanker booking created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadBookings();
      
    } catch (err: any) {
      setError('Failed to create booking');
    } finally {
      setFormLoading(false);
    }
  };

  // Date filter handlers
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setActivePreset('');
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    setActivePreset('');
  };

  const setPresetRange = (preset: string) => {
    const { startDate: start, endDate: end } = localDataService.getPresetDateRange(preset);
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset('');
  };

  // Calculate summary stats
  const totalBookings = filteredBookings.length;
  debugger;
  const totalBookingAmount = filteredBookings.reduce((sum, b) => sum , 0);
  const totalPendingAmount = filteredBookings.reduce((sum, b) => sum + (b.pendingAmount || b.bookingAmount), 0);

  if (showForm) {
    return (
      <div className="form-page">
        <div className="form-header">
          <h1>Book Oil Tanker</h1>
          <p>Enter the tanker booking details below</p>
        </div>

        <div className="form-container">
          {formErrors.form && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {formErrors.form}
            </div>
          )}
          
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handleFormSubmit}>
              <div className="form-grid">
                {formFields.map((field) => (
                  <div className="form-group" key={field.name}>
                    <label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span style={{ color: '#e74c3c' }}> *</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        value={formData[field.name as keyof typeof formData] || ''}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        value={formData[field.name as keyof typeof formData] || ''}
                        onChange={(e) => handleFormChange(
                          field.name, 
                          field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        )}
                        min={field.min}
                        step={field.step}
                        required={field.required}
                      />
                    )}
                    {formErrors[field.name] && (
                      <span style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {formErrors[field.name]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Pending Amount Display */}
              <div className="summary-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h4>Pending Amount</h4>
                <div className="summary-value" style={{ color: formData.bookingAmount < 0 ? '#e74c3c' : '#27ae60', fontSize: '1.75rem' }}>
                  ₹{((formData.rate * formData.tankerCapacity) - formData.bookingAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                  Capacity: {formData.tankerCapacity.toLocaleString()} L | Rate: ₹{formData.rate.toFixed(2)}/L
                </p>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Creating...' : 'Create Booking'}
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Tanker Booking Management</h1>
          <p>Book and manage oil tanker deliveries</p>
        </div>
        <div className="module-actions">
          <button 
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            Book Tanker
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3>Total Bookings</h3>
          <p className="card-value">{totalBookings}</p>
        </div>
        <div className="card">
          <h3>Total Booking Amount</h3>
          <p className="card-value">₹{totalBookingAmount.toLocaleString()}</p>
        </div>
        <div className="card" style={{ borderLeftColor: '#e74c3c' }}>
          <h3>Total Pending Amount</h3>
          <p className="card-value" style={{ color: '#e74c3c' }}>₹{totalPendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="module-content">
        <div className="filters-section">
          <div style={{ marginBottom: '1rem' }}>
            <label className="date-range-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#495057' }}>
              Filter by Booking Date
            </label>
            
            {/* Date Range Inputs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="filter-group">
                <label htmlFor="start-date" style={{ fontSize: '0.85rem', color: '#6c757d' }}>From</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={endDate || localDataService.getTodayDate()}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="end-date" style={{ fontSize: '0.85rem', color: '#6c757d' }}>To</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={startDate}
                  max={localDataService.getTodayDate()}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                />
              </div>

              {(startDate || endDate) && (
                <button 
                  type="button"
                  onClick={clearFilters}
                  className="secondary-button"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setPresetRange('today')}
                className={activePreset === 'today' ? 'primary-button' : 'secondary-button'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('7days')}
                className={activePreset === '7days' ? 'primary-button' : 'secondary-button'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('30days')}
                className={activePreset === '30days' ? 'primary-button' : 'secondary-button'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('90days')}
                className={activePreset === '90days' ? 'primary-button' : 'secondary-button'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Last 90 Days
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('thisMonth')}
                className={activePreset === 'thisMonth' ? 'primary-button' : 'secondary-button'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                This Month
              </button>
            </div>

            {/* Active Filter Display */}
            {(startDate || endDate) && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6c757d' }}>
                Showing bookings from <strong>{startDate ? new Date(startDate).toLocaleDateString() : 'beginning'}</strong> to <strong>{endDate ? new Date(endDate).toLocaleDateString() : 'now'}</strong>
                {' '}({filteredBookings.length} of {bookings.length} bookings)
              </div>
            )}
          </div>
        </div>

        <DataTable
          data={filteredBookings}
          columns={columns}
          loading={loading}
          rowKey="_id"
        />
      </div>
    </div>
  );
};

export default Booking;
