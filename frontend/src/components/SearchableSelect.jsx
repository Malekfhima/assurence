import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SearchableSelect - Combobox/Autocomplete réutilisable
 *
 * Props:
 *  - options: Array<string | {value: string, label: string}>
 *  - value: string (the selected value)
 *  - onChange: (value: string) => void
 *  - placeholder: string
 *  - error: string (error message to display)
 *  - disabled: boolean
 *  - className: string
 *  - label: string (optional label above input)
 *  - required: boolean
 *  - filterFn: (option, query) => boolean (custom filter, default: case-insensitive includes)
 *  - displayFn: (option) => string (custom display, default: option.label or option)
 *  - valueFn: (option) => string (custom value extractor, default: option.value or option)
 *  - onClear: () => void (called when clear button is clicked)
 *  - clearable: boolean (show clear button, default: true)
 *  - noOptionsMessage: string
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  error,
  disabled = false,
  className = '',
  label,
  required = false,
  filterFn,
  displayFn,
  valueFn,
  onClear,
  clearable = true,
  noOptionsMessage = 'Aucun résultat',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to array of { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return { value: opt.value, label: opt.label || opt.value };
  });

  // Find the selected option label
  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Default filter: case-insensitive includes in label
  const defaultFilter = useCallback((option, q) => {
    return option.label.toLowerCase().includes(q.toLowerCase());
  }, []);

  const activeFilter = filterFn || defaultFilter;

  // Filter options based on query
  const filteredOptions = query.trim()
    ? normalizedOptions.filter((o) => activeFilter(o, query))
    : normalizedOptions;

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const selectOption = (option) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    // If the user clears the input, also clear the selection
    if (val === '' && value !== '') {
      onChange('');
      onClear?.();
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (selectedOption) {
      // If there's a selection, show the full list on focus
      setQuery('');
    }
    setIsOpen(true);
  };

  const handleSelectClick = () => {
    if (selectedOption) {
      // If there's a selection, clicking opens the search
      setQuery('');
      setIsOpen(true);
      // Focus the input after state update
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const showDropdown = isOpen && !disabled;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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

        <input
          ref={inputRef}
          type="text"
          value={selectedOption && !isOpen ? selectedOption.label : query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onClick={handleSelectClick}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${
            error ? 'border-red-400' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          autoComplete="off"
        />

        {/* Clear/chevron button */}
        {value && clearable ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
            title="Effacer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <svg
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              {noOptionsMessage}
            </div>
          ) : (
            <ul ref={listRef} className="py-1" role="listbox">
              {filteredOptions.map((option, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 text-sm cursor-pointer flex items-center gap-2 transition ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-800'
                        : isSelected
                        ? 'bg-blue-50/50 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{option.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
