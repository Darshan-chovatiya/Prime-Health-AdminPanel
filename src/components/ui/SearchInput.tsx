import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  debounceMs = 1000,
  className = ""
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasFocusedRef = useRef(false);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange callback
  const debouncedOnChange = useCallback(
    debounce((searchValue: string) => {
      onChange(searchValue);
      // Maintain focus after debounced search completes if input was previously focused
      if (inputRef.current && wasFocusedRef.current) {
        // Use setTimeout to ensure focus happens after any re-renders
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }, debounceMs),
    [onChange, debounceMs]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Track if input is focused when user types
    wasFocusedRef.current = document.activeElement === inputRef.current;
    debouncedOnChange(newValue);
  };

  // Track focus state
  const handleFocus = () => {
    wasFocusedRef.current = true;
  };

  const handleBlur = () => {
    // Don't immediately clear - wait a bit in case focus is being restored
    setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        wasFocusedRef.current = false;
      }
    }, 100);
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      />
      <svg 
        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchInput;
