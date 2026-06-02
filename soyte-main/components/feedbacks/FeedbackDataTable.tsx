import React, { useMemo, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Paginator } from 'primereact/paginator';
import { FeedbackItem } from '../../types/feedbacks';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import { confirmDialog } from 'primereact/confirmdialog';
import { Trash2 } from 'lucide-react';
import { StyledTabViewCSS } from '../report/ReportStates';

interface FeedbackDataTableProps {
  feedbacks: FeedbackItem[];
  forms: any[];
  loading: boolean;
  totalRecords: number;
  lazyParams: { first: number, rows: number, page: number };
  onPage: (event: any) => void;
  viewDetails: (rowData: FeedbackItem) => void;
  onDelete?: (id: string) => void;
}

type Tab = { formId: string; title: string };

const getFormId = (form: any): string =>
  String(form?.form_id ?? form?.id ?? '');

const getFormTitle = (form: any): string =>
  form?.title || form?.name || `Mẫu (${getFormId(form)})`;

export const FeedbackDataTable: React.FC<FeedbackDataTableProps> = ({
  feedbacks,
  forms,
  loading,
  totalRecords,
  lazyParams,
  onPage,
  viewDetails,
  onDelete
}) => {
  const tabs = useMemo<Tab[]>(() => {
    return (forms || [])
      .map((f) => ({ formId: getFormId(f), title: getFormTitle(f) }))
      .filter((t) => t.formId);
  }, [forms]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex > tabs.length - 1) {
      setActiveIndex(0);
    }
  }, [tabs.length, activeIndex]);

  const itemsByForm = useMemo<Record<string, FeedbackItem[]>>(() => {
    const map: Record<string, FeedbackItem[]> = {};
    feedbacks.forEach((fb) => {
      const id = String(fb.form_id ?? '');
      if (!map[id]) map[id] = [];
      map[id].push(fb);
    });
    return map;
  }, [feedbacks]);

  const actionBodyTemplate = (rowData: FeedbackItem) => {
    const id = rowData.id || rowData._id;

    const confirmDelete = () => {
      confirmDialog({
        message: 'Bạn có chắc chắn muốn xoá phản hồi này?',
        header: 'Xác nhận xoá',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Xoá',
        rejectLabel: 'Hủy',
        acceptClassName: "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all",
        rejectClassName: "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
        accept: () => {
          if (id && onDelete) {
            onDelete(id);
          }
        }
      });
    };

    return (
      <div className="flex gap-2">
        <Button icon="pi pi-eye" rounded outlined className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" onClick={() => viewDetails(rowData)} title="Xem chi tiết" />
        {onDelete && (
          <Button
            icon={<Trash2 size={16} />}
            rounded
            outlined
            severity="danger"
            className="w-8 h-8 p-0"
            onClick={confirmDelete}
            title="Xoá phản hồi"
            disabled={!id}
          />
        )}
      </div>
    );
  };

  const dateBodyTemplate = (rowData: FeedbackItem) => {
    const d = rowData.createdAt || rowData.created_at || rowData.date;
    return formatDisplayDateTime(d as string);
  };

  const nameBodyTemplate = (rowData: FeedbackItem) =>
    rowData.name || rowData.fullName || rowData.creator_name || "Không có tên";

  const renderTable = (items: FeedbackItem[], baseIndex: number) => {
    const sttBodyTemplate = (_: any, options: { rowIndex: number }) =>
      options.rowIndex + baseIndex + 1;

    return (
      <div className="overflow-x-auto">
        <DataTable
          value={items}
          loading={loading}
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage="Không có dữ liệu phản hồi"
          scrollable
          scrollHeight="640px"
        >
          <Column header="STT" body={sttBodyTemplate} style={{ width: "5rem" }} />
          <Column header="Người gửi" style={{ width: "15rem" }} body={nameBodyTemplate} />
          <Column header="Ngày gửi" body={dateBodyTemplate} style={{ width: "10rem" }} />
          <Column body={actionBodyTemplate} exportable={false} style={{ width: "5rem" }} header="Thao tác" />
        </DataTable>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-900">Danh sách ý kiến</h2>
      </div>

      {tabs.length === 0 ? (
        renderTable(feedbacks, lazyParams.first)
      ) : (
        <TabView
          className="styled-tabview feedback-tabs"
          scrollable
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          {tabs.map((t) => (
            <TabPanel
              key={t.formId}
              header={
                <span title={t.title} className="feedback-tab-label padding-left-5">
                  {t.title}
                </span>
              }
            >
              {renderTable(itemsByForm[t.formId] || [], lazyParams.first)}
            </TabPanel>
          ))}
        </TabView>
      )}

      <Paginator
        first={lazyParams.first}
        rows={lazyParams.rows}
        totalRecords={totalRecords}
        rowsPerPageOptions={[30, 50, 100]}
        onPageChange={onPage}
        className="mt-4 border-none bg-transparent"
      />

      <StyledTabViewCSS />
      <style>{`
        .feedback-tabs .p-tabview-nav {
          gap: 0.25rem;
          padding: 0.5rem 0 0 !important;
        }
        .feedback-tabs .p-tabview-nav li .p-tabview-nav-link {
          max-width: 220px;
          padding: 0.6rem 1rem !important;
          line-height: 1.5 !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
          overflow: visible !important;
          transition: max-width 0.25s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .feedback-tabs .p-tabview-nav li .p-tabview-nav-link .feedback-tab-label {
          display: inline-block;
          max-width: 100%;
          font-weight: 600;
          font-size: 0.8rem;
          letter-spacing: 0.01em;
          line-height: 1.5;
          padding: 0.1rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
        .feedback-tabs .p-tabview-nav li:hover .p-tabview-nav-link,
        .feedback-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          max-width: 640px;
        }
        .feedback-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          background: #eff6ff !important;
        }
      `}</style>
    </div>
  );
};
