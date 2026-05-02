import React, { useState } from 'react';
import DailyReports from '../components/Reports/DailyReports';
import MonthlyReports from '../components/Reports/MonthlyReports';
import './Pages.css';

const Reports: React.FC = () => {
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'monthly'>('daily');
  const [reportType, setReportType] = useState<'comprehensive' | 'purchases' | 'sales' | 'inventory' | 'production'>('comprehensive');
  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const getReportComponent = () => {
    if (reportFrequency === 'daily') {
      return <DailyReports onError={handleError} reportType={reportType} />;
    } else {
      return <MonthlyReports onError={handleError} reportType={reportType} />;
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Reports</h1>
          <p>Select report type and frequency to generate your business insights</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="module-content">
        <div className="report-filter-panel">
          <div className="report-filter-container">
            <div className="report-filter-item">
              <label htmlFor="report-type-select" className="report-filter-label">
                Report Type
              </label>
              <select
                id="report-type-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="report-filter-select"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="purchases">Purchases Only</option>
                <option value="sales">Sales Only</option>
                <option value="inventory">Inventory Only</option>
                <option value="production">Production Only</option>
              </select>
            </div>

            <div className="report-filter-item">
              <label htmlFor="frequency-select" className="report-filter-label">
                Frequency
              </label>
              <select
                id="frequency-select"
                value={reportFrequency}
                onChange={(e) => setReportFrequency(e.target.value as 'daily' | 'monthly')}
                className="report-filter-select"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {getReportComponent()}
      </div>
    </div>
  );
};

export default Reports;