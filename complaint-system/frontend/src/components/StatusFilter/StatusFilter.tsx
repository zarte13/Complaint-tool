import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { ComplaintStatus } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface StatusFilterProps {
  selectedStatuses: ComplaintStatus[];
  onStatusChange: (statuses: ComplaintStatus[]) => void;
  disabled?: boolean;
  className?: string;
}

interface StatusOption {
  value: ComplaintStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export default function StatusFilter({
  selectedStatuses,
  onStatusChange,
  disabled = false,
  className = ''
}: StatusFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Status options with colors and icons
  const statusOptions: StatusOption[] = [
    {
      value: 'open',
      label: t('statusOpen') || 'Open',
      color: 'text-blue-800',
      bgColor: 'bg-blue-100',
      icon: '⚪'
    },
    {
      value: 'in_progress',
      label: t('statusInProgress') || 'In Progress',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      icon: '🟡'
    },
    {
      value: 'resolved',
      label: 'Resolved',
      color: 'text-green-800',
      bgColor: 'bg-green-100',
      icon: '✅'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          toggleStatus(statusOptions[focusedIndex].value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev < statusOptions.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const toggleStatus = (status: ComplaintStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    onStatusChange(newStatuses);
  };

  const clearAllStatuses = () => {
    onStatusChange([]);
  };

  const getDisplayText = () => {
    if (selectedStatuses.length === 0) {
      return t('allStatuses') || 'All Statuses';
    }
    if (selectedStatuses.length === 1) {
      const option = statusOptions.find(opt => opt.value === selectedStatuses[0]);
      return `${option?.icon} ${option?.label}`;
    }
    return `${selectedStatuses.length} statuses selected`;
  };

  const getSelectedOption = (status: ComplaintStatus) => {
    return statusOptions.find(opt => opt.value === status);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Filter Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          flex items-center justify-between min-h-[38px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter by status"
      >
        <span className="flex-1 truncate text-sm">
          {getDisplayText()}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Selected Status Tags */}
      {selectedStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedStatuses.map((status) => {
            const option = getSelectedOption(status);
            return (
              <span
                key={status}
                className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${option?.bgColor} ${option?.color}
                `}
              >
                <span className="mr-1">{option?.icon}</span>
                {option?.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(status);
                  }}
                  className={`ml-1 ${option?.color} hover:opacity-70`}
                  aria-label={`Remove ${option?.label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={clearAllStatuses}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            aria-label="Clear all status filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1" role="listbox">
            {statusOptions.map((option, index) => {
              const isSelected = selectedStatuses.includes(option.value);
              const isFocused = index === focusedIndex;
              
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center justify-between text-sm
                    ${isFocused ? 'bg-blue-50' : ''}
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => toggleStatus(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{option.icon}</span>
                    <span className={`font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 