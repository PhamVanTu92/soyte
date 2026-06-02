import AdminLayout from "../components/AdminLayout";
import React, { useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Calendar } from "primereact/calendar";
import { Toast } from "@/components/prime";
import { Navigate, useParams } from "react-router-dom";
import { useTemplateForm } from "../hooks/useTemplateForm";
import { InfoBuilder } from "../components/templates/InfoBuilder";
import { ReflectBuilder } from "../components/templates/ReflectBuilder";
import { EvaluateBuilder } from "../components/templates/EvaluateBuilder";
import { ConfirmDialog } from 'primereact/confirmdialog';
const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];
const TemplateCreate: React.FC = () => {
  const { id, type } = useParams<{ id?: string; type?: string }>();
  const toast = useRef<Toast>(null);

  const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    //return <Navigate to="/404" replace />;
    return <Navigate to="/admin" replace />;
  }

  const {
    template,
    setTemplate,
    loading,
    fetching,
    expandedGroups,
    toggleGroup,
    handleSave,
    handleCancel,
    addGroup,
    updateGroup,
    removeGroup,
    addOption,
    updateOption,
    removeOption,
    addAnswerOption,
    updateAnswerOption,
    removeAnswerOption,
    addInfoField,
    updateInfoField,
    removeInfoField,
    addInfoOption,
    updateInfoOption,
    removeInfoOption
  } = useTemplateForm(id, type, toast);

  let currentAccumulated = 0;
  const groupStartIndices = template.data.map((group) => {
    const start = currentAccumulated;
    currentAccumulated += group.option.length;
    return start;
  });

  if (fetching) {
    return (
      <AdminLayout title="Chỉnh sửa biểu mẫu">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-sm flex flex-col animate-pulse">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded-lg" />
                <div className="h-3 w-64 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-7 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-11 bg-slate-100 rounded-xl" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-11 bg-slate-100 rounded-xl" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="h-3 w-48 bg-slate-200 rounded" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="h-4 w-52 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-80 bg-slate-100 rounded mb-5" />
            {[1, 2].map((i) => (
              <div key={i} className="border border-slate-200 p-4 rounded-xl bg-slate-50 mb-3">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5 space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-11 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="col-span-6 space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-11 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="col-span-1 space-y-2 flex flex-col items-center">
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                    <div className="h-7 w-12 bg-slate-200 rounded-full mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-grow p-6 bg-white">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-primary-800 p-3 flex gap-3">
                {[2, 12, 12, 8, 5, 5, 5, 5, 5, 7, 5].map((w, i) => (
                  <div key={i} className={`h-5 bg-primary-600/60 rounded flex-none`} style={{ width: `${w}%` }} />
                ))}
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className={`flex gap-3 p-3 border-b border-slate-100 ${row % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  {[2, 12, 12, 8, 5, 5, 5, 5, 5, 7, 5].map((w, i) => (
                    <div key={i} className="h-8 bg-slate-200 rounded flex-none" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="h-9 w-36 bg-slate-200 rounded-lg" />
            <div className="h-10 w-36 bg-primary-200 rounded-lg" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? "Chỉnh sửa biểu mẫu" : "Tạo mới biểu mẫu"}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="relative">
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              borderRadius: '1.5rem',
              backdropFilter: 'blur(2px)',
              backgroundColor: 'rgba(255,255,255,0.65)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              cursor: 'not-allowed',
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px 40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              border: '1px solid #e2e8f0',
            }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: 'var(--primary-color, #003159)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px', margin: 0 }}>Đang lưu biểu mẫu...</p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>Vui lòng không thao tác trong lúc này</p>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-sm flex flex-col${loading ? ' pointer-events-none select-none' : ''}`}>

          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
              <div>
                <h3 className="text-primary-900 font-bold text-base">Trạng thái biểu mẫu</h3>
                <p className="text-slate-500 text-xs mt-1">Kích hoạt hoặc vô hiệu hóa biểu mẫu này trên hệ thống</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={template.status ? 'text-green-600 font-bold text-sm' : 'text-slate-400 text-sm font-medium'}>
                  {template.status ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
                <InputSwitch checked={template.status} onChange={(e) => setTemplate({ ...template, status: e.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">
                  Tên biểu mẫu <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className={`w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-4 rounded-xl ${!template.name && 'border-orange-200'}`}
                  placeholder="Nhập tên biểu mẫu/phiếu đánh giá..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">Mô tả (Mục đích, năm, đối tượng...)</label>
                <InputTextarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={3}
                  className="w-full border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base"
                  placeholder="Nhập phụ chú ngắn gọn..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-2">Thời gian áp dụng</label>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {/* Từ ngày */}
                  <div className="w-full relative">
                    <i className="pi pi-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none text-lg"></i>
                    <Calendar
                      value={template.startDate ? new Date(template.startDate) : null}
                      onChange={(e) => setTemplate({ ...template, startDate: e.value })}
                      className="w-full"
                      inputClassName="w-full bg-white border border-slate-300 focus:border-primary-500 shadow-sm p-4 pl-12 rounded-xl text-base transition-colors"
                      placeholder="Từ ngày (dd/mm/yyyy)..."
                      dateFormat="dd/mm/yy"
                    />
                  </div>

                  {/* Mũi tên ngăn cách (chỉ hiện trên màn hình lớn) */}
                  <div className="hidden md:flex text-slate-300 px-2 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </div>

                  {/* Đến ngày */}
                  <div className="w-full relative">
                    <i className="pi pi-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none text-lg"></i>
                    <Calendar
                      value={template.endDate ? new Date(template.endDate) : null}
                      onChange={(e) => setTemplate({ ...template, endDate: e.value })}
                      className="w-full"
                      inputClassName="w-full bg-white border border-slate-300 focus:border-primary-500 shadow-sm p-4 pl-12 rounded-xl text-base transition-colors"
                      placeholder="Đến ngày (dd/mm/yyyy)..."
                      dateFormat="dd/mm/yy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <InfoBuilder
            info={template.info || []}
            updateInfoField={updateInfoField}
            removeInfoField={removeInfoField}
            addInfoOption={addInfoOption}
            updateInfoOption={updateInfoOption}
            removeInfoOption={removeInfoOption}
            addInfoField={addInfoField}
          />

          <div className="flex-grow p-6 bg-white flex flex-col">
            <div className="rounded-xl border border-primary-200 overflow-x-auto shadow-sm relative">
              {template.type === 'reflect' ? (
                <ReflectBuilder
                  data={template.data}
                  expandedGroups={expandedGroups}
                  groupStartIndices={groupStartIndices}
                  toggleGroup={toggleGroup}
                  updateGroup={updateGroup}
                  removeGroup={removeGroup}
                  addOption={addOption}
                  updateOption={updateOption}
                  removeOption={removeOption}
                />
              ) : (
                <EvaluateBuilder
                  data={template.data}
                  expandedGroups={expandedGroups}
                  groupStartIndices={groupStartIndices}
                  toggleGroup={toggleGroup}
                  updateGroup={updateGroup}
                  removeGroup={removeGroup}
                  addOption={addOption}
                  updateOption={updateOption}
                  removeOption={removeOption}
                  addAnswerOption={addAnswerOption}
                  updateAnswerOption={updateAnswerOption}
                  removeAnswerOption={removeAnswerOption}
                />
              )}
            </div>

            <div className="mt-6 mb-2 flex justify-center flex-shrink-0">
              <Button
                label="Thêm nhóm nội dung"
                icon="pi pi-plus"
                onClick={addGroup}
                className="bg-primary-50 text-primary-700 border-dashed border-2 border-primary-300 hover:bg-primary-100 hover:border-primary-500 font-bold px-8 py-3 rounded-xl shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <Button
              label="Hủy bỏ & Quay lại"
              icon="pi pi-arrow-left"
              onClick={handleCancel}
              className="p-button-text text-slate-600 hover:bg-slate-200 font-semibold"
            />
            <div className="flex items-center gap-3">
              <Button
                label="Lưu biểu mẫu"
                icon="pi pi-save"
                loading={loading}
                onClick={handleSave}
                className="text-white bg-primary-600 border-primary-600 hover:bg-primary-700 font-bold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TemplateCreate;
