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
    const value = values[field.name] ?? '';
    const error = errors[field.name];
    const hasError = !!error;

    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      disabled: loading,
      className: hasError ? 'error' : '',
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const newValue = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(field.name, newValue);
      },
    };

    let input: React.ReactNode;

    switch (field.type) {
      case 'select':
        input = (
          <select {...commonProps}>
            <option value="">{field.options?.length ? '-- Select --' : `Select ${field.label}`}</option>
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
          />
        );
        break;

      case 'number':
        input = (
          <input
            {...commonProps}
            type="number"
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
    <form className="form-builder" onSubmit={onSubmit}>
      <div className="form-grid">
        {fields.map(renderField)}
      </div>
    </form>
  );
};

export default FormBuilder;