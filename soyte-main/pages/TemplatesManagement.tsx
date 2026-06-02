import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { formService } from "../services/formService";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { surveyService } from "../services/surveyService";

import { Toast } from "@/components/prime";
import { Plus, QrCode } from "lucide-react";
const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];
const statusOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Đang tắt", value: "inactive" },
];

const TemplatesManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    //return <Navigate to="/404" replace />;
    return <Navigate to="/admin" replace />;
  }
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 30,
    page: 1,
  });

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // QR Dialog states
  const [qrDialogVisible, setQrDialogVisible] = useState(false);
  const [selectedFormForQr, setSelectedFormForQr] = useState<any>(null);
  const [qrSurveys, setQrSurveys] = useState<any[]>([]);
  const [selectedSurveyKey, setSelectedSurveyKey] = useState<string | null>(null);
  const [loadingQrSurveys, setLoadingQrSurveys] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const page = lazyParams.page;
      const limit = lazyParams.rows;

      const data = await formService.fetchForms(
        page,
        limit,
        type,
        debouncedSearch.trim() || undefined,
      );

      let list: any[] = [];
      let total = 0;

      if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items;
        total = data.data.total || list.length;
      } else if (Array.isArray(data)) {
        list = data;
        total = data.length;
      }

      setTemplates(list);
      setTotalRecords(total);
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách biểu mẫu",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [lazyParams.page, lazyParams.rows, type, debouncedSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchText]);

  useEffect(() => {
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  }, [debouncedSearch]);

  const onPage = (event: any) => {
    setLazyParams({
      first: event.first,
      rows: event.rows,
      page: event.page + 1,
    });
  };

  const handleAddNew = () => {
    navigate(`/admin/templates/create/${type}`);
  };

  const editTemplate = (rowData: any) => {
    const formId = rowData.id || rowData._id;
    navigate(`/admin/templates/edit/${formId}`);
  };

  // const confirmDeleteTemplate = (rowData: any) => {
  //   confirmDialog({
  //     message: (
  //       <div className="flex flex-col items-center justify-center text-center pt-4">
  //         <i className="pi pi-exclamation-circle text-red-500 text-5xl mb-4"></i>
  //         <p className="text-lg font-bold text-slate-800">Cảnh báo xóa biểu mẫu</p>
  //         <p className="text-sm text-slate-500 mt-2">
  //           Bạn có chắc chắn muốn xóa biểu mẫu <span className="font-bold text-primary-600">"{rowData.name || rowData.name}"</span> không?<br />
  //           Dữ liệu đã xóa sẽ không thể phục hồi.
  //         </p>
  //       </div>
  //     ),
  //     header: 'Xác nhận xóa',
  //     icon: 'hidden',
  //     acceptClassName: 'bg-red-600 border-red-600 hover:bg-red-700 text-white font-bold ml-2',
  //     rejectClassName: 'p-button-text text-slate-600 hover:bg-slate-100 font-bold',
  //     acceptLabel: 'Đồng ý xóa',
  //     rejectLabel: 'Hủy bỏ',
  //     className: 'w-[400px]',
  //     accept: async () => {
  //       try {
  //         const formId = rowData.id || rowData._id;
  //         await formService.deleteForm(formId);
  //         toast.current?.show({ severity: 'success', summary: 'Thành công', detail: `Đã xóa biểu mẫu ${rowData.name || rowData.name}` });
  //         fetchTemplates();
  //       } catch (error) {
  //         console.error(error);
  //         toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa biểu mẫu' });
  //       }
  //     },
  //     reject: () => { },
  //   });
  // };

  const sttBodyTemplate = (rowData: any, options: { rowIndex: number }) => {
    return options.rowIndex + lazyParams.first + 1;
  };

  const showQr = async (rowData: any) => {
    const formId = rowData.id || rowData._id;
    setSelectedFormForQr(rowData);
    setSelectedSurveyKey(null);
    setQrDialogVisible(true);
    
    try {
      setLoadingQrSurveys(true);
      const data = await surveyService.fetchSurveys(1, 1000, type, true);
      const surveyList = data?.items || data || [];
      
      const relatedSurveys = surveyList.filter((survey: any) => {
        return (survey.form_ids || []).some((f: any) => {
          const fId = f.form_id || f.id || f;
          return fId === formId;
        });
      });
      
      const mappedSurveys = relatedSurveys.map((s: any) => ({
        label: s.name,
        value: s.key || s.id
      }));
      setQrSurveys(mappedSurveys);
      if (mappedSurveys.length > 0) {
          setSelectedSurveyKey(mappedSurveys[0].value);
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Không thể lấy danh sách cuộc khảo sát" });
    } finally {
      setLoadingQrSurveys(false);
    }
  };

  const handleConfirmQr = () => {
    if (!selectedFormForQr) return;
    const formId = selectedFormForQr.id || selectedFormForQr._id;
    
    let url = `/templates/qr/${formId}`;
    if (selectedSurveyKey) {
      url += `?survey_key=${selectedSurveyKey}`;
    }
    
    navigate(url);
    setQrDialogVisible(false);
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50"
          onClick={() => editTemplate(rowData)}
        />
        <Button
          icon={<QrCode size={14} />}
          rounded
          outlined
          className="w-8 h-8 p-0 text-secondary-600 border-secondary-600 hover:bg-secondary-50"
          onClick={() => showQr(rowData)}
          title="Xem mã QR"
        />
        {/* <Button icon="pi pi-trash" rounded outlined severity="danger" className="w-8 h-8 p-0 hover:bg-red-50" onClick={() => confirmDeleteTemplate(rowData)} /> */}
      </div>
    );
  };

  const statusBodyTemplate = (rowData: any) => {
    const isActive =
      rowData.status === true ||
      rowData.status === "active" ||
      rowData.status === "true";
    return (
      <span
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          isActive
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-slate-100 text-slate-800 border border-slate-200"
        }`}
      >
        {isActive ? "Hoạt động" : "Đang tắt"}
      </span>
    );
  };

  const descriptionBodyTemplate = (rowData: any) => {
    return (
      <div
        title={rowData.description}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          lineHeight: "1.5em",
          maxHeight: "3em",
          wordBreak: "break-word",
        }}
      >
        {rowData.description || "—"}
      </div>
    );
  };

  const stats = useMemo(() => {
    // Note: Since data is paginated, these counts reflect the current page/local view
    // In a real app, you might want a separate API for global counts
    const total = totalRecords;
    let active = 0;
    let inactive = 0;

    templates.forEach((t) => {
      const isA =
        t.status === true || t.status === "active" || t.status === "true";
      if (isA) active++;
      else inactive++;
    });

    return { total, active, inactive };
  }, [templates, totalRecords]);

  // Status filter still applied client-side (server doesn't expose it for forms)
  const filteredTemplates = templates.filter((t) => {
    const isActive =
      t.status === true || t.status === "active" || t.status === "true";
    return statusFilter === "all"
      ? true
      : statusFilter === "active"
        ? isActive
        : !isActive;
  });

  const handleResetFilter = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  return (
    <AdminLayout title="Quản lý biểu mẫu">
      <Toast ref={toast} />
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ 1: Tổng số biểu mẫu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <i className="pi pi-file text-lg"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Tổng biểu mẫu
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {stats.total}
            </h3>
          </div>
        </div>

        {/* Thẻ 2: Đang hoạt động */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <i className="pi pi-check-circle text-lg"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Hoạt động
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {stats.active}
            </h3>
          </div>
        </div>

        {/* Thẻ 3: Đang tắt */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
            <i className="pi pi-eye-slash text-lg"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Đang ẩn
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {stats.inactive}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Button
            onClick={() => handleAddNew()}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} /> Thêm biểu mẫu
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-primary-900">
            Danh sách biểu mẫu
          </h2>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: "12px",
            marginBottom: "20px",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Search input */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <i
                className="pi pi-search"
                style={{ marginRight: "5px", fontSize: "10px" }}
              />
              Tìm kiếm theo tên
            </label>
            <InputText
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nhập tên biểu mẫu..."
              style={{
                width: "100%",
                fontSize: "13.5px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                padding: "9px 14px",
                background: "#fff",
                color: "#1e293b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Status dropdown */}
          <div style={{ minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <i
                className="pi pi-filter"
                style={{ marginRight: "5px", fontSize: "10px" }}
              />
              Trạng thái
            </label>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder="Tất cả"
              style={{
                width: "100%",
                fontSize: "13.5px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            />
          </div>

          {/* Reset button */}
          <Button
            label="Đặt lại"
            icon="pi pi-refresh"
            onClick={handleResetFilter}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#475569",
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              padding: "9px 18px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable
            value={filteredTemplates}
            loading={loading}
            lazy
            paginator
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={totalRecords}
            onPage={onPage}
            rowsPerPageOptions={[30, 50, 100]}
            tableStyle={{ minWidth: "50rem" }}
            emptyMessage="Không có dữ liệu phù hợp"
            scrollable
            scrollHeight="640px"
          >
            <Column
              header="STT"
              body={sttBodyTemplate}
              style={{ width: "5rem" }}
            ></Column>
            <Column
              field="name"
              header="Tên biểu mẫu"
              style={{ width: "25rem" }}
            ></Column>
            <Column
              field="description"
              header="Mô tả"
              body={descriptionBodyTemplate}
            ></Column>
            <Column
              field="status"
              header="Trạng thái"
              body={statusBodyTemplate}
              style={{ width: "10rem" }}
            ></Column>
            <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ width: "8rem" }}
              header="Thao tác"
            ></Column>
          </DataTable>
        </div>
      </div>

      <Dialog 
        header="Sinh mã QR biểu mẫu"
        visible={qrDialogVisible} 
        onHide={() => setQrDialogVisible(false)}
        style={{ width: '450px' }}
        footer={
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button 
              label="Hủy" 
              className="p-button-text text-slate-500 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors" 
              onClick={() => setQrDialogVisible(false)} 
            />
            <Button 
                label="Sinh mã QR" 
                icon="pi pi-qrcode"
                className="bg-primary-600 hover:bg-primary-700 border-none text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-primary-200 transition-all" 
                onClick={handleConfirmQr} 
                disabled={qrSurveys.length > 0 && !selectedSurveyKey} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2 pt-4">
          <p className="text-sm text-slate-600">
            Mã QR sinh ra sẽ tự động liên kết với cuộc khảo sát tương ứng (nếu có).
          </p>
          
          {loadingQrSurveys ? (
            <div className="flex flex-col items-center justify-center my-6 gap-3">
                <i className="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải cuộc khảo sát...</span>
            </div>
          ) : qrSurveys.length === 0 ? (
            <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-[1rem] border border-amber-100 flex items-start gap-3 shadow-sm">
              <i className="pi pi-exclamation-triangle mt-0.5 text-lg"></i>
              <div>
                <p className="font-bold mb-1">Không tìm thấy cuộc khảo sát</p>
                <p className="opacity-90 italic">Biểu mẫu này hiện không nằm trong cuộc khảo sát nào đang hoạt động. Bạn vẫn có thể tạo mã QR dùng chung.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Thuộc cuộc khảo sát <span className="text-red-500">*</span></label>
               <Dropdown 
                  value={selectedSurveyKey}
                  options={qrSurveys}
                  onChange={(e) => setSelectedSurveyKey(e.value)}
                  placeholder="-- Chọn cuộc khảo sát --"
                  className="w-full border-slate-200 rounded-[1rem] shadow-sm"
               />
            </div>
          )}
        </div>
      </Dialog>
    </AdminLayout>
  );
};

export default TemplatesManagement;
