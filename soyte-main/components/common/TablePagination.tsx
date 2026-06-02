import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from 'primereact/button';
import PageJumper from '../PageJumper';
import { PageSizeSelector } from './PageSizeSelector';

interface TablePaginationProps {
  displayInfo?: React.ReactNode;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  displayInfo,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const hasPager = totalPages > 1;

  return (
    <div
      className={`flex flex-col gap-3 border-t border-gray-100 bg-gray-50/30 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 ${className}`}
    >
      <div className="text-sm text-gray-600">{displayInfo}</div>

      <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
        <PageSizeSelector
          value={pageSize}
          onChange={(size) => {
            onPageSizeChange(size);
            onPageChange(1);
          }}
        />

        {hasPager && (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
            <PageJumper
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              className="!gap-1.5 !text-xs"
            />
            <div className="h-5 w-px bg-slate-200" />
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              icon={<ChevronLeft size={14} />}
              label="Trước"
              text
              className="!text-xs !px-2 !py-1"
            />
            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              icon={<ChevronRight size={14} />}
              label="Sau"
              iconPos="right"
              text
              className="!text-xs !px-2 !py-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};
