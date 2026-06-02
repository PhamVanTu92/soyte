import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';

interface PageSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  options?: number[];
  label?: string;
  className?: string;
}

const DEFAULT_OPTIONS = [30, 50, 100];

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  label = 'Số dòng',
  className = '',
}) => {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const dropdownOptions = options.map((n) => ({ label: String(n), value: n }));

  const commitCustom = () => {
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n) && n > 0 && n !== value) {
      onChange(n);
    } else {
      setDraft(String(value));
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
        {label}
      </span>
      <Dropdown
        value={value}
        options={dropdownOptions}
        editable
        onChange={(e) => {
          const v = e.value;
          if (typeof v === 'number' && !Number.isNaN(v) && v > 0) {
            onChange(v);
            setDraft(String(v));
          } else if (typeof v === 'string') {
            setDraft(v);
          }
        }}
        onBlur={commitCustom}
        placeholder="Tùy chỉnh"
        className="page-size-selector w-[110px] h-9"
      />
      <style>{`
        .page-size-selector.p-dropdown {
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #fff;
          align-items: center;
        }
        .page-size-selector.p-dropdown .p-dropdown-label,
        .page-size-selector.p-dropdown .p-inputtext {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          padding: 0 0.5rem;
        }
        .page-size-selector.p-dropdown .p-dropdown-trigger {
          width: 1.75rem;
        }
      `}</style>
    </div>
  );
};
