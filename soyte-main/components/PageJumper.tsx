import React, { useEffect, useState } from "react";

interface PageJumperProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

const PageJumper: React.FC<PageJumperProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
}) => {
  const [value, setValue] = useState(String(currentPage));

  useEffect(() => {
    setValue(String(currentPage));
  }, [currentPage]);

  const apply = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(String(currentPage));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setValue(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(1, parsed), totalPages);
    setValue(String(clamped));
    if (clamped !== currentPage) {
      onPageChange(clamped);
    }
  };

  if (!totalPages || totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}
    >
      <span>Tới trang</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, "");
          setValue(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
        }}
        onBlur={apply}
        disabled={disabled}
        aria-label="Nhập số trang"
        className="h-8 w-14 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-bold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-slate-400">/ {totalPages}</span>
    </div>
  );
};

export default PageJumper;
