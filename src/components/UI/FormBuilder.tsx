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
          {field.required ? <span className="required">*</span> : null}
        </label>
        {input}
        {hasError ? <span className="error-text">{error}</span> : null}
      </div>
    );
  };

  return (
   <form onSubmit={onSubmit}>
  <div className="form-grid">
    {fields.map((field) => (
      <div className="form-group" key={field.name}>
        <label>{field.label}</label>

        {field.type === 'select' ? (
          <select
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={values[field.name] || ''}
            onChange={(e) =>
              onChange(
                field.name,
                field.type === 'number'
                  ? parseFloat(e.target.value) || 0
                  : e.target.value
              )
            }
          />
        )}

        {errors?.[field.name] ? (
          <span className="error">{errors[field.name]}</span>
        ) : null}
      </div>
    ))}
  </div>

  {/* <button type="submit">{submitText}</button> */}
</form>
  );
};

export default FormBuilder;