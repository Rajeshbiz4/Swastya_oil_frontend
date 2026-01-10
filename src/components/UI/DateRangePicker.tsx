import React from 'react';
import './UI.css';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
  disabled = false,
  className = '',
}) => {
  const today = new Date().toISOString().split('T')[0];

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    onStartDateChange(newStartDate);
    
    // If end date is before start date, update end date
    if (endDate && newStartDate > endDate) {
      onEndDateChange(newStartDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    onEndDateChange(newEndDate);
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className={`date-range-picker ${className}`}>
      {label && <label className="date-range-label">{label}</label>}
      
      <div className="date-range-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">From</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            disabled={disabled}
            max={endDate || today}
          />
        </div>
        
        <div className="date-input-group">
          <label htmlFor="end-date">To</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            disabled={disabled}
            min={startDate}
            max={today}
          />
        </div>
      </div>
      
      <div className="date-range-presets">
        <button
          type="button"
          onClick={() => setPresetRange(0)}
          disabled={disabled}
          className="preset-button"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setPresetRange(7)}
          disabled={disabled}
          className="preset-button"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => setPresetRange(30)}
          disabled={disabled}
          className="preset-button"
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => setPresetRange(90)}
          disabled={disabled}
          className="preset-button"
        >
          Last 90 days
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;