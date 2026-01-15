import { useState, useRef, useEffect } from 'react';

const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 ${alignmentClasses[align]} bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-max`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({ onClick, children, icon, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm ${
        danger ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Dropdown;