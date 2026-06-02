import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { MultiSelect } from 'primereact/multiselect';
import { InfoNode, InfoOptionNode } from '../../types/templates';
import { api } from '@/api';
import { FacilityFilterDropdown } from '@/components/feedbacks/FacilityFilterDropdown';

interface InfoBuilderProps {
  info: InfoNode[];
  updateInfoField: (index: number, field: keyof InfoNode, val: any) => void;
  removeInfoField: (index: number) => void;
  addInfoOption: (infoIndex: number) => void;
  updateInfoOption: (infoIndex: number, optIndex: number, val: string) => void;
  removeInfoOption: (infoIndex: number, optIndex: number) => void;
  addInfoField: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  BV: 'Bệnh viện',
  TT: 'Trung tâm Y tế',
  BT: 'Cơ sở Bảo trợ',
  CC: 'Chi cục',
  TYT: 'Trạm Y tế',
  PB: 'Phòng/Chi cục',
};

interface FacilityFieldConfigProps {
  selectedOptions: InfoOptionNode[];
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  onOptionsChange: (options: InfoOptionNode[]) => void;
}

const FacilityFieldConfig: React.FC<FacilityFieldConfigProps> = ({
  selectedOptions,
  selectedTypes,
  onTypesChange,
  onOptionsChange,
}) => {
  const [typeReports, setTypeReports] = useState<{ type: string; count: number }[]>([]);

  // Lấy thống kê số lượng theo loại cơ sở (không phụ thuộc bộ lọc hiện tại)
  useEffect(() => {
    let cancelled = false;
    api.get('/social-facilities', { page: 1, limit: 1 })
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res?.meta?.reports)) setTypeReports(res.meta.reports);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const typeOptions = useMemo(
    () => typeReports.map((r) => ({
      label: `${TYPE_LABEL[r.type] || r.type} (${r.count})`,
      value: r.type,
    })),
    [typeReports],
  );

  return (
    <div className="mt-5 pt-4 border-t border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <i className="pi pi-building text-indigo-500" style={{ fontSize: '14px' }} />
        <span className="text-sm font-bold text-indigo-700">Cấu hình danh sách cơ sở y tế</span>
      </div>
      <div>
        <label className="block text-xs font-semibold text-indigo-700 mb-1">
          <i className="pi pi-filter" style={{ fontSize: '10px' }} /> Lọc theo loại cơ sở:
        </label>
        <MultiSelect
          value={selectedTypes}
          options={typeOptions}
          onChange={(e) => onTypesChange(e.value)}
          placeholder="Tất cả loại cơ sở"
          className="w-full text-xs bg-white border-indigo-300 rounded-lg shadow-sm"
          panelClassName="facility-ms-panel"
          panelStyle={{ maxWidth: '400px' }}
          pt={{
            item: (options: any) => ({
              className: `transition-colors ${options?.context?.selected ? 'p-highlight' : ''}`,
            }),
            label: { className: 'text-xs font-medium' },
          }}
          display="chip"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-indigo-700 mb-1">
          <i className="pi pi-check-square" style={{ fontSize: '10px' }} /> Chọn cơ sở được hiển thị:
        </label>
        <FacilityFilterDropdown
          value={selectedOptions.map((option) => String(option.key))}
          initialOptions={selectedOptions.map((option) => ({
            label: option.value,
            value: String(option.key),
          }))}
          onChange={() => { }}
          onResolvedChange={(resolvedOptions) => {
            const nextOptions: InfoOptionNode[] = resolvedOptions.map((option) => {
              const existing = selectedOptions.find(
                (selectedOption) => String(selectedOption.key) === String(option.value),
              );
              return existing || { key: option.value, value: option.label };
            });
            onOptionsChange(nextOptions);
          }}
          placeholder="Để trống = cho phép chọn tất cả"
          type={selectedTypes.length > 0 ? selectedTypes.join(',') : undefined}
          className="w-full text-xs bg-white border-indigo-300 rounded-lg shadow-sm"
          panelClassName="facility-ms-panel"
          filterPlaceholder="Tìm kiếm cơ sở..."
        />
      </div>
    </div>
  );
};

export const InfoBuilder: React.FC<InfoBuilderProps> = ({
  info,
  updateInfoField,
  removeInfoField,
  addInfoOption,
  updateInfoOption,
  removeInfoOption,
  addInfoField,
}) => {
  return (
    <div className="p-6 border-b border-slate-100 bg-white flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-primary-900 font-bold text-base">Cấu trúc thông tin chung (Info)</h3>
          <p className="text-slate-500 text-xs mt-1">Quản lý các trường thông tin chung của người điền biểu mẫu</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(info || []).map((field, idx) => (
          <div key={idx} className="border border-slate-200 p-4 rounded-xl relative bg-slate-50">
            <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeInfoField(idx)} className="absolute top-2 right-2 w-8 h-8 p-0" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mr-8 mt-4">
              <div className="md:col-span-4">
                <label className="block text-slate-700 font-bold mb-2 text-sm">Tiêu đề thông tin</label>
                <InputText value={field.title} onChange={(e) => updateInfoField(idx, 'title', e.target.value)} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base" placeholder="VD: Tên bệnh viện, Họ và tên..." />
              </div>
              <div className="md:col-span-5">
                <label className="block text-slate-700 font-bold mb-2 text-sm">Loại dữ liệu</label>
                <Dropdown value={field.type} options={[
                  { label: 'Văn bản (Text)', value: 'text' },
                  { label: 'Số (Number)', value: 'number' },
                  { label: 'Ngày tháng (Date)', value: 'date' },
                  { label: 'Lựa chọn (Select)', value: 'select' },
                  { label: 'Cơ sở y tế (Multi)', value: 'facility_multiselect' },
                ]} onChange={(e) => updateInfoField(idx, 'type', e.value)} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm flex items-center h-[46px]" />
              </div>
              <div className="md:col-span-1 flex flex-col items-center">
                <label className="block text-slate-700 font-bold mb-3 text-sm">Bắt buộc</label>
                <InputSwitch
                  checked={field.isValidate || false}
                  onChange={(e) => updateInfoField(idx, 'isValidate', e.value)}
                />
              </div>
              <div className="md:col-span-1 flex flex-col items-center">
                <label className="block text-slate-700 font-bold mb-3 text-sm">Vô hiệu</label>
                <InputSwitch
                  checked={field.isDisable || false}
                  onChange={(e) => updateInfoField(idx, 'isDisable', e.value)}
                />
              </div>
              <div className="md:col-span-1 flex flex-col items-center">
                <label className="block text-slate-700 font-bold mb-3 text-sm">Hiển thị</label>
                <InputSwitch
                  checked={field.status !== false}
                  onChange={(e) => updateInfoField(idx, 'status', e.value)}
                />
              </div>
            </div>
            {field.type === 'select' && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-700 font-bold text-sm">Các tùy chọn lựa chọn:</span>
                  <Button label="Thêm tùy chọn" icon="pi pi-plus" size="small" text onClick={() => addInfoOption(idx)} className="text-primary-600 hover:bg-primary-50 py-2 px-3" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {field.option?.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm hover:border-primary-400 transition-colors">
                      <InputText value={opt.value} onChange={(e) => updateInfoOption(idx, optIdx, e.target.value)} className="w-40 border-none p-2 text-sm focus:ring-0" placeholder="Nhập tên tùy chọn..." />
                      <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeInfoOption(idx, optIdx)} className="w-10 h-10 p-0 flex-shrink-0 hover:bg-red-50 text-red-500 rounded-none border-l border-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {field.type === 'facility_multiselect' && (
              <FacilityFieldConfig
                selectedOptions={field.option || []}
                selectedTypes={field.facilityTypeFilter || []}
                onTypesChange={(types) => updateInfoField(idx, 'facilityTypeFilter', types)}
                onOptionsChange={(opts) => updateInfoField(idx, 'option', opts)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <Button label="Thêm thông tự thông tin" icon="pi pi-plus" size="small" onClick={addInfoField} outlined className="bg-white border-primary-300 text-primary-600 hover:bg-primary-50 px-6 py-2 rounded-lg font-bold shadow-sm" />
      </div>
    </div>
  );
};
