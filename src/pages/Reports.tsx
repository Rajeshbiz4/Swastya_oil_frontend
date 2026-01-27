import React, { useState } from 'react';
import DailyReports from '../components/Reports/DailyReports';
import MonthlyReports from '../components/Reports/MonthlyReports';
import './Pages.css';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive business reports and analytics with export functionality</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="module-content">
        <div className="tab-buttons" style={{ marginBottom: '2rem' }}>
          <button
            className={activeTab === 'daily' ? 'primary-button' : 'secondary-button'}
            onClick={() => setActiveTab('daily')}
          >
            Daily Reports
          </button>
          <button
            className={activeTab === 'monthly' ? 'primary-button' : 'secondary-button'}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly Reports
          </button>
        </div>

        {activeTab === 'daily' ? (
          <DailyReports onError={handleError} />
        ) : (
          <MonthlyReports onError={handleError} />
        )}
      </div>
    </div>
  );
};

export default Reports;