import EmployeeReport from '../components/Reports/EmployeeReport';
import AttendanceReport from '../components/Reports/AttendanceReport';
import React, { useState } from 'react';
import Worker from './Worker';
import Attendance from './Attendance';
import Payment from './Payment';
import './Pages.css';

type EmployeeTab = 'workers' | 'attendance' | 'payroll' | 'employeeReport' | 'attendanceReport' ;

const EmployeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('workers');

  return (
    <div className="page-container">
      <div className="employee-management-header">
        <h1>Employee Management</h1>
      </div>

      {/* Main Tabs */}
      <div className="tabs employee-management-tabs">
        <button
          className={`tab-button ${activeTab === 'workers' ? 'active' : ''}`}
          onClick={() => setActiveTab('workers')}
        >
          👷 Workers
        </button>
        <button
          className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          📋 Attendance
        </button>
        <button
          className={`tab-button ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💰 Payroll
        </button>
        <button
  className={`tab-button ${activeTab === 'employeeReport' ? 'active' : ''}`}
  onClick={() => setActiveTab('employeeReport')}
>
  📊 Employee Report
</button>
<button
  className={`tab-button ${activeTab === 'attendanceReport' ? 'active' : ''}`}
  onClick={() => setActiveTab('attendanceReport')}
>
  📅 Attendance Report
</button>
      </div>

      {/* Tab Content */}
      <div className="employee-management-content">
        {activeTab === 'workers' && (
          <div className="tab-content">
            <Worker />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="tab-content">
            <Attendance />
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="tab-content">
            <Payment />
          </div>
        )}

        {activeTab === 'employeeReport' && (
        <div className="tab-content">
        <EmployeeReport />
        </div>
        )}
        
        {activeTab === "attendanceReport" && (
        <div className="tab-content">
        <AttendanceReport />
        </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeManagement;
