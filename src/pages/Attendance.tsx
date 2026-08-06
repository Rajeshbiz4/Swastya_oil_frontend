import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  recordAttendance,
  getWorkerAttendance,
  getAttendanceSummary,
  getAllAttendance,
  bulkRecordAttendance,
  getMonthlyAttendance,
  updateAttendance
} from '../store/slices/attendanceSlice';
import {
  applyLeave,
  getEmployeeLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveSummary
} from '../store/slices/leaveSlice';
import { fetchWorkers } from '../store/slices/workerSlice';
import './Pages.css';
import './Attendance.css';

type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'HalfDay'
  | 'Leave'
  | 'WeeklyOff'
  | 'Holiday';

type TimePeriod = 'day' | 'week' | 'month';

const Attendance: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    attendance,
    summary,
    loading,
    error,
    pagination
  } = useAppSelector((state) => state.attendance);
  const { leaves, summary: leaveSummary } = useAppSelector((state) => state.leave);
  const { workers } = useAppSelector((state) => state.worker);

  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('Present');
  const [overtimeHours, setOvertimeHours] = useState(0);

  useEffect(() => {
    dispatch(fetchWorkers({ isActive: true }));
  }, [dispatch]);

  // Load monthly attendance data for calendar
  useEffect(() => {
    if (selectedWorker) {
      loadMonthlyAttendance();
    }
  }, [selectedWorker, currentMonth, currentYear]);

  const loadMonthlyAttendance = async () => {
    if (!selectedWorker) return;

    setCalendarLoading(true);
    try {
      const result = await dispatch(getMonthlyAttendance({
        workerId: selectedWorker,
        year: currentYear,
        month: currentMonth + 1 // API expects 1-based month
      })).unwrap();
      setMonthlyData(result);
    } catch (error) {
      console.error('Failed to load monthly attendance:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDateClick = async (date: Date) => {

    const today = new Date();
today.setHours(0, 0, 0, 0);

const clickedDate = new Date(date);
clickedDate.setHours(0, 0, 0, 0);

if (clickedDate > today) {
  alert("Future attendance cannot be marked.");
  return;
}

    if (!selectedWorker) {
      alert('Please select a worker first');
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const existingAttendance = monthlyData?.attendance?.[dateStr];

    if (existingAttendance) {
      // Update existing attendance
      try {
        await dispatch(updateAttendance({
          id: existingAttendance._id,
          data: {
            status: selectedStatus,
        hoursWorked:
        selectedStatus === 'Present'
        ? 8
        : selectedStatus === 'HalfDay'
        ? 4
        : 0,            overtimeHours: overtimeHours
          }
        })).unwrap();
        loadMonthlyAttendance(); // Reload data
      } catch (error: any) {
        alert(`Error updating attendance: ${error}`);
      }
    } else {
      // Create new attendance
      try {
        await dispatch(recordAttendance({
          workerId: selectedWorker,
          date: dateStr,
          status: selectedStatus,
          hoursWorked:
          selectedStatus === 'Present'
          ? 8
          : selectedStatus === 'HalfDay'
          ? 4
          : 0,
          overtimeHours: overtimeHours
        })).unwrap();
        loadMonthlyAttendance(); // Reload data
      } catch (error: any) {
        alert(`Error recording attendance: ${error}`);
      }
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Present': return 'status-present';
      case 'Absent': return 'status-absent';
      case 'Leave': return 'status-leave';
      case 'WeeklyOff': return 'status-weeklyoff';
      case 'Holiday': return 'status-holiday';
      default: return 'status-default';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'Present': return 'P';
      case 'Absent': return 'A';
      case 'HalfDay': return 'HD';
      case 'Leave': return 'L';
      case 'WeeklyOff': return 'WO';
      case 'Holiday': return 'H';
      default: return '';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const calendarDays = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add day headers
    dayNames.forEach(day => {
      calendarDays.push(
        <div key={`header-${day}`} className="calendar-header-cell">
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceData = monthlyData?.attendance?.[dateStr];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${attendanceData ? getStatusColor(attendanceData.status) : 'status-default'} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(date)}
          title={`${dateStr}: ${attendanceData ? attendanceData.status : 'Click to mark attendance'}`}
        >
          <div className="day-number">{day}</div>
          {attendanceData && (
            <div className="status-label">
              {getStatusLabel(attendanceData.status)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={() => navigateMonth('prev')} className="nav-btn">‹</button>
          <h3 className="calendar-title">{monthNames[currentMonth]} {currentYear}</h3>
          <button onClick={() => navigateMonth('next')} className="nav-btn">›</button>
        </div>
        <div className="calendar-grid">
          {calendarDays}
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color status-present"></div>
            <span>Present</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-absent"></div>
            <span>Absent</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-leave"></div>
            <span>Leave</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-weeklyoff"></div>
            <span>Weekly Off</span>
          </div>
          <div className="legend-item">
            <div className="legend-color status-holiday"></div>
            <span>Holiday</span>
          </div>
        </div>
      </div>
    );
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(new Date(selectedDate));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="week-view">
        <div className="week-header">
          <button onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 7);
            setSelectedDate(newDate.toISOString().split('T')[0]);
          }} className="nav-btn">‹</button>
          <h3>Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}</h3>
          <button onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 7);
            setSelectedDate(newDate.toISOString().split('T')[0]);
          }} className="nav-btn">›</button>
        </div>
        <div className="week-grid">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const attendanceData = monthlyData?.attendance?.[dateStr];
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={dateStr} className="week-day">
                <div className="day-name">{dayNames[index]}</div>
                <div
                  className={`day-cell ${attendanceData ? getStatusColor(attendanceData.status) : 'status-default'} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="day-number">{date.getDate()}</div>
                  {attendanceData && (
                    <div className="status-label">
                      {getStatusLabel(attendanceData.status)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const date = new Date(selectedDate);
    const dateStr = date.toISOString().split('T')[0];
    const attendanceData = monthlyData?.attendance?.[dateStr];

    return (
      <div className="day-view">
        <div className="day-header">
          <button onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate.toISOString().split('T')[0]);
          }} className="nav-btn">‹</button>
          <h3>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <button onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate.toISOString().split('T')[0]);
          }} className="nav-btn">›</button>
        </div>
        <div className="day-content">
          <div
            className={`day-large ${attendanceData ? getStatusColor(attendanceData.status) : 'status-default'}`}
            onClick={() => handleDateClick(date)}
          >
            <div className="day-status">
              {attendanceData ? (
                <>
                  <div className="status-text">{attendanceData.status}</div>
                  <div className="status-details">
                    Hours: {attendanceData.hoursWorked}h
                    {attendanceData.overtimeHours > 0 && `, OT: ${attendanceData.overtimeHours}h`}
                  </div>
                </>
              ) : (
                <div className="status-text">Click to mark attendance</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>Record and view attendance for workers</p>
      </div>

      <div className="attendance-controls">
        <div className="control-group">
          <label>Select Worker:</label>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="form-select"
          >
            <option value="">Choose a worker...</option>
            {workers.map((worker) => (
              <option key={worker._id} value={worker._id}>
                {worker.name} ({worker.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Time Period:</label>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="form-select"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className="control-group">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="form-input"
          />
        </div>

        <div className="control-group">
          <label>Mark as:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AttendanceStatus)}
            className="form-select status-select"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="WeeklyOff">Weekly Off</option>
            <option value="Holiday">Holiday</option>
            <option value="HalfDay">Half Day</option>
          </select>
        </div>
        <div className="control-group">
  <label>Overtime (Hrs):</label>

  <input
    type="number"
    min="0"
    max="16"
    value={overtimeHours}
    onChange={(e) => setOvertimeHours(Number(e.target.value))}
    className="form-input"
    placeholder="Enter OT Hours"
  />
</div>
      </div>

      {selectedWorker && (
        <div className="attendance-view">
          {timePeriod === 'day' && renderDayView()}
          {timePeriod === 'week' && renderWeekView()}
          {timePeriod === 'month' && renderCalendar()}
        </div>
      )}

      {!selectedWorker && (
        <div className="no-worker-selected">
          <p>Please select a worker to view and manage attendance.</p>
        </div>
      )}

      {calendarLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
