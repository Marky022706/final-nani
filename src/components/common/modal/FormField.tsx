import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className = ''
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          <span>{label}</span>
          {required && (
            <span className="field-required" aria-hidden="true" title="Required field">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <div className="field-error-msg" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <div className="field-hint">{hint}</div>
      ) : null}
    </div>
  );
};
