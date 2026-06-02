import React from 'react';

interface ScrollableTableProps {
  children: React.ReactNode;
  maxHeight?: number | string;
  className?: string;
}

let stylesInjected = false;

const ensureStyles = () => {
  if (typeof document === 'undefined' || stylesInjected) return;
  if (document.querySelector('style[data-scrollable-table]')) {
    stylesInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-scrollable-table', 'true');
  style.textContent = `
    .scrollable-table-wrapper > table thead {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .scrollable-table-wrapper > table thead tr {
      background: #f9fafb;
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
};

export const ScrollableTable: React.FC<ScrollableTableProps> = ({
  children,
  maxHeight = 640,
  className = '',
}) => {
  React.useEffect(() => {
    ensureStyles();
  }, []);
  const maxH = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  return (
    <div
      className={`scrollable-table-wrapper overflow-auto ${className}`}
      style={{ maxHeight: maxH }}
    >
      {children}
    </div>
  );
};
