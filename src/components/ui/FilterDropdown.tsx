import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../../icons';

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function FilterDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Calculate max height for 4 items (approximately 4 * 40px = 160px)
  // Each item is roughly 40px (py-2 = 8px top + 8px bottom + ~24px text = ~40px)
  const maxHeight = options.length > 4 ? '10rem' : 'auto'; // 10rem ≈ 160px for 4 items

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white ${
          value ? 'text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDownIcon
          className={`ml-2 h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
          style={{ maxHeight: maxHeight }}
        >
          <div className={`py-1 ${options.length > 4 ? 'overflow-y-auto' : ''}`} style={{ maxHeight: maxHeight }}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === option.value
                    ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

