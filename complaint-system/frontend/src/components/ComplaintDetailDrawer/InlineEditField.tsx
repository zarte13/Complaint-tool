import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

interface InlineEditFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validation?: ValidationRule;
  placeholder?: string;
  className?: string;
}

export default function InlineEditField({
  label,
  value,
  onChange,
  validation,
  placeholder,
  className = '',
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validate = (value: string): string => {
    if (!validation) return '';

    if (validation.required && !value.trim()) {
      return 'This field is required';
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.pattern && !validation.pattern.test(value)) {
      return validation.patternMessage || 'Invalid format';
    }

    return '';
  };

  const handleSave = () => {
    const validationError = validate(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    onChange(editValue);
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow save/cancel buttons to be clicked
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  };

  if (!isEditing) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div
          className="px-3 py-2 border border-gray-300 rounded-md bg-white cursor-text hover:border-gray-400 min-h-[2.5rem] flex items-center"
          onClick={() => setIsEditing(true)}
        >
          <span className="text-sm text-gray-900">
            {value || <span className="text-gray-400">{placeholder}</span>}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <button
            type="button"
            onClick={handleSave}
            className="p-1 text-green-600 hover:text-green-700"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-red-600 hover:text-red-700"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}