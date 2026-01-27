import React from 'react';
import { FormField } from '../../types';
import './UI.css';

interface FormBuilderProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitText?: string;
  errors?: Record<string, string>;
  className?: string;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  values,
  onChange,
  onSubmit,
  loading = false,
  submitText = 'Submit',
  errors = {},
  className = '',
}) => {
  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];
    const hasError = !!error;

    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      disabled: loading,
      className: hasError ? 'error' : '',
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const newValue = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      onChange(field.name, newValue);
    };

    let input: React.ReactNode;

    switch (field.type) {
      case 'select':
        input = (
          <select
            {...commonProps}
            value={value}
            onChange={handleChange}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'textarea':
        input = (
          <textarea
            {...commonProps}
            value={value}
            onChange={handleChange}
            rows={4}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
        break;

      case 'date':
        input = (
          <input
            {...commonProps}
            type="date"
            value={value}
            onChange={handleChange}
          />
        );
        break;

      case 'number':
        input = (
          <input
            {...commonProps}
            type="number"
            value={value}
            onChange={handleChange}
            step="any"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
        break;

      default:
        input = (
          <input
            {...commonProps}
            type={field.type}
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }

    return (
      <div key={field.name} className="form-group">
        <label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        {input}
        {hasError && <span className="error-text">{error}</span>}
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className={`form-builder ${className}`}>
      {fields.map(renderField)}
      
      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Submitting...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default FormBuilder;