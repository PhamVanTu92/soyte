import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { surveyService } from "../services/surveyService";
import { formService } from "../services/formService";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Calendar } from "primereact/calendar";
import { Toast } from "@/components/prime";
import { Plus, ListChecks } from "lucide-react";

const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];

const SurveysManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const { type } = useParams<{ type?: string }>();
  const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    return <Navigate to="/admin" replace />;
  }

  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 30, page: 1 });

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [surveyDialog, setSurveyDialog] = useState(false);
    const [survey, setSurvey] = useState<any>({
        name: "",
        description: "",
        status: true,
        form_ids: [],
        dateFrom: null,
        dateTo: null,
    });
  const [allForms, setAllForms] = useState<any[]>([]);
  const [selectedForms, setSelectedForms] = useState<any[]>([]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const status =
        statusFilter === "all"
          ? undefined
          : statusFilter === "active";
      const data = await surveyService.fetchSurveys(
        lazyParams.page,
        lazyParams.rows,
        type,
        status,
        debouncedSearch.trim() || undefined,
      );
      let list = data?.items || data || [];
      setSurveys(list);
      setTotalRecords(data?.total || list.length);
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách cuộc khảo sát",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const data = await formService.fetchForms(1, 100, type);
      setAllForms(data.data?.items || data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [lazyParams.page, lazyParams.rows, type, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchForms();
  }, [type]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchText]);

  useEffect(() => {
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  }, [debouncedSearch, statusFilter]);

  const onPage = (event: any) => {
    setLazyParams({
      first: event.first,
      rows: event.rows,
      page: event.page + 1,
    });
  };

  const openNew = () => {
    setSurvey({ name: "", description: "", status: true, form_ids: [], dateFrom: null, dateTo: null });
    setSelectedForms([]);
    setSurveyDialog(true);
  };

  const hideDialog = () => {
    setSurveyDialog(false);
  };

  const saveSurvey = async () => {
    if (!survey.name.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Vui lòng nhập tên cuộc khảo sát",
      });
      return;
    }

    const formatDate = (date: any) => {
        if (!date) return null;
        if (typeof date === 'string') return date;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const payload = {
      ...survey,
      type: type,
      dateFrom: formatDate(survey.dateFrom),
      dateTo: formatDate(survey.dateTo),
      form_ids: selectedForms.map((f) => f.id),
    };

    try {
      const surveyId = survey.key || survey.id;
      if (surveyId) {
        const res = await surveyService.updateSurvey(surveyId, payload);
        if (!res?.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã cập nhật cuộc khảo sát",
          });
        }
      } else {
        const res = await surveyService.createSurvey(payload);
        if (!res?.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã tạo cuộc khảo sát mới",
          });
        }
      }
      setSurveyDialog(false);
      fetchSurveys();
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu cuộc khảo sát",
        });
      }
    }
  };

  const editSurvey = (rowData: any) => {
    setSurvey({ ...rowData });
    // Handle form_ids as array of objects with form_id field
    const selected = allForms.filter((f) =>
      (rowData.form_ids || []).some((item: any) => item.form_id === f.id),
    );
    setSelectedForms(selected);
    setSurveyDialog(true);
  };

  const toggleStatus = async (rowData: any) => {
    try {
      const newStatus = !rowData.status;
      const res = await surveyService.updateSurvey(rowData.id, {
        ...rowData,
        status: newStatus,
      });
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã cập nhật trạng thái",
        });
      }
      fetchSurveys();
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể cập nhật trạng thái",
        });
      }
    }
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="w-8 h-8 p-0 text-primary-600"
          onClick={() => editSurvey(rowData)}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: any) => {
    return (
      <div
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${rowData.status ? "bg-green-50 text-green-600 border border-green-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}
      >
        {rowData.status ? "Hoạt động" : "Không hoạt động"}
      </div>
    );
  };

  const stats = useMemo(() => {
    const total = totalRecords;
    const active = surveys.filter((s) => s.status).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [surveys, totalRecords]);

  const filteredSurveys = surveys;

  const statusOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Hoạt động", value: "active" },
    { label: "Đang tắt", value: "inactive" },
  ];

  return (
    <AdminLayout title="Quản lý cuộc khảo sát">
      <Toast ref={toast} />
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <i className="pi pi-list text-lg"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Tổng cuộc khảo sát
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {stats.total}
            </h3>
          </div>
        </div>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
            <i className="pi pi-eye-slash text-lg"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Đang tắt
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {stats.inactive}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Button
            onClick={openNew}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} /> Thêm cuộc khảo sát
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 relative">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-primary-900">
            Danh sách cuộc khảo sát
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex-1 min-w-[280px] relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Tìm kiếm theo tên
            </label>
            <div className="relative">
              <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10"></i>
              <InputText
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập tên cuộc khảo sát bạn muốn tìm..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border-slate-200 bg-white hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 px-4 text-sm transition-all shadow-sm shadow-slate-100/50"
              />
            </div>
          </div>
          <div className="w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Trạng thái
            </label>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder="Tất cả trạng thái"
              className="w-full h-12 rounded-xl border-slate-200 bg-white hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm shadow-slate-100/50 flex items-center"
            />
          </div>
          <div className="pt-6">
            <Button
              label="Đặt lại"
              icon="pi pi-refresh"
              onClick={() => {
                setSearchText("");
                setStatusFilter("all");
              }}
              className="h-12 px-6 p-button-outlined p-button-secondary rounded-xl font-bold border-slate-200 hover:bg-slate-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
            <DataTable
              value={filteredSurveys}
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
                body={(rowData, options) =>
                  options.rowIndex + lazyParams.first + 1
                }
                style={{ width: "5rem" }}
              ></Column>
              <Column
                field="name"
                header="Tên cuộc khảo sát"
                style={{ width: "20rem" }}
              ></Column>
              <Column 
                header="Thời hạn" 
                style={{ width: "15rem" }}
                body={(rowData) => {
                    if (!rowData.dateFrom && !rowData.dateTo) return <span className="text-slate-400">Không giới hạn</span>;
                    return (
                        <div className="text-xs">
                            {rowData.dateFrom && <div>Từ: <span className="font-bold">{rowData.dateFrom}</span></div>}
                            {rowData.dateTo && <div>Đến: <span className="font-bold">{rowData.dateTo}</span></div>}
                        </div>
                    );
                }}
              ></Column>
              <Column field="description" header="Mô tả"></Column>
              <Column
                header="Trạng thái"
                body={statusBodyTemplate}
                style={{ width: "8rem" }}
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
        visible={surveyDialog}
        style={{ width: "600px" }}
        header={
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-800">
              Thông tin cuộc khảo sát
            </span>
          </div>
        }
        modal
        className="p-fluid rounded-3xl overflow-hidden"
        onHide={hideDialog}
        footer={
          <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-100">
            <Button
              label="Hủy"
              icon="pi pi-times"
              onClick={hideDialog}
              className="p-button-text text-slate-500 font-bold px-6"
            />
            <Button
              label="Lưu thông tin"
              icon="pi pi-check"
              onClick={saveSurvey}
              className="!bg-primary-600 hover:!bg-primary-700 border-none px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-primary-100"
            />
          </div>
        }
        contentClassName="p-0"
      >
        <div className="p-6 space-y-5">
          <div className="field">
            <label
              htmlFor="name"
              className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"
            >
              Tên cuộc khảo sát <span className="text-red-500">*</span>
            </label>
            <InputText
              id="name"
              value={survey.name}
              onChange={(e) => setSurvey({ ...survey, name: e.target.value })}
              required
              autoFocus
              className="w-full h-12 rounded-xl border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 px-4 transition-all"
              placeholder="VD: Khảo sát hài lòng người bệnh 2026"
            />
          </div>

          <div className="field">
            <label
              htmlFor="description"
              className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"
            >
              Mô tả
            </label>
            <InputTextarea
              id="description"
              value={survey.description}
              onChange={(e) =>
                setSurvey({ ...survey, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 p-4 transition-all"
              placeholder="Mô tả ngắn gọn về mục đích khảo sát..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Từ ngày</label>
                <Calendar value={survey.dateFrom ? new Date(survey.dateFrom) : null} onChange={(e) => setSurvey({...survey, dateFrom: e.value})} dateFormat="yy-mm-dd" showIcon className="w-full rounded-xl" placeholder="Chọn ngày bắt đầu" />
            </div>
            <div className="field">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Đến ngày</label>
                <Calendar value={survey.dateTo ? new Date(survey.dateTo) : null} onChange={(e) => setSurvey({...survey, dateTo: e.value})} dateFormat="yy-mm-dd" showIcon className="w-full rounded-xl" placeholder="Chọn ngày kết thúc" />
            </div>
          </div>

          <div className="field">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">
                  Trạng thái hoạt động
                </span>
                <span className="text-xs text-slate-400">
                  Cho phép người dùng tham gia khảo sát
                </span>
              </div>
              <InputSwitch
                checked={survey.status}
                onChange={(e) => setSurvey({ ...survey, status: e.value })}
                className="scale-90"
              />
            </div>
          </div>

          <div className="field pt-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2 ml-1">
              <ListChecks size={16} className="text-primary-500" /> Chọn biểu
              mẫu áp dụng <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <DataTable
                value={allForms}
                responsiveLayout="scroll"
                selection={selectedForms}
                onSelectionChange={(e) => setSelectedForms(e.value as any[])}
                dataKey="id"
                emptyMessage="Không tìm thấy biểu mẫu nào"
                scrollable
                scrollHeight="260px"
                className="survey-form-table text-sm"
                size="small"
                rowClassName={() => "border-b border-slate-50"}
              >
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem", background: "#f8fafc" }}
                  className="px-4 py-3"
                ></Column>
                <Column
                  field="name"
                  header="Tên biểu mẫu"
                  headerStyle={{
                    background: "#f8fafc",
                    fontWeight: "bold",
                    color: "#64748b",
                  }}
                  className="px-4 py-3 font-medium text-slate-700"
                  body={(rowData) => (
                    <div className="flex items-center gap-2">
                      <span className="leading-relaxed">{rowData.name}</span>
                    </div>
                  )}
                ></Column>
              </DataTable>
            </div>
            {selectedForms.length > 0 && (
              <div className="mt-3 flex justify-end">
                <span className="text-[10px] font-black text-white bg-primary-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary-100">
                  Đã chọn {selectedForms.length} biểu mẫu
                </span>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
};

export default SurveysManagement;
