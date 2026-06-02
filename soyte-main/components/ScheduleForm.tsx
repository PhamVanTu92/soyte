import React, { useState, useEffect, useRef } from "react";
import { X, Info, MapPin, Building } from "lucide-react";
import { WorkSchedule, User } from "../types";
import { Dropdown, Calendar, InputText, Button } from "@/components/prime";
import { Toast } from "primereact/toast";
import { users } from "../constants";
interface ScheduleFormProps {
  initialData?: WorkSchedule;
  onClose: () => void;
  onSave: (
    schedule: Omit<WorkSchedule, "id" | "status" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
}
type Priority = "NORMAL" | "IMPORTANT" | "URGENT";
const priorityOptions: { label: string; value: Priority }[] = [
  { label: "Bình thường", value: "NORMAL" },
  { label: "Quan trọng", value: "IMPORTANT" },
  { label: "Khẩn cấp", value: "URGENT" },
];
const ScheduleForm: React.FC<ScheduleFormProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<
    Omit<WorkSchedule, "id" | "status" | "createdAt" | "updatedAt">
  >({
    title: "",
    content: "",
    start_time: "",
    end_time: "",
    location: "",
    presider_id: 0,
    coordinating_unit: "",
    priority: "NORMAL",
    attendee_ids: [],
    leader: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const toast = useRef<Toast>(null);
  const presiderOptions =
    users?.map((user) => ({
      label: user.full_name,
      value: user.id,
    })) || [];

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        leader: initialData.leader || "",
        content: initialData.content || "",
        start_time: initialData.start_time
          ? initialData.start_time.slice(0, 16)
          : "",
        end_time: initialData.end_time ? initialData.end_time.slice(0, 16) : "",
        location: initialData.location || "",
        presider_id: initialData.presider_id || 0,
        coordinating_unit: initialData.coordinating_unit || "",
        priority: initialData.priority || "NORMAL",
        attendee_ids: initialData.attendee_ids || [],
      });
    } else {
      setFormData({
        title: "",
        leader: "",
        content: "",
        start_time: "",
        end_time: "",
        location: "",
        presider_id: 0,
        coordinating_unit: "",
        priority: "NORMAL",
        attendee_ids: [],
      });
    }
  }, [initialData]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        typeof value === "string" && !isNaN(Number(value)) && value !== ""
          ? Number(value)
          : value,
    }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề không được để trống";
    if (!formData.start_time)
      newErrors.start_time = "Thời gian bắt đầu không được để trống";
    if (!formData.location.trim())
      newErrors.location = "Địa điểm không được để trống";
    if (formData.presider_id === 0)
      newErrors.presider_id = "Vui lòng chọn cán bộ";
    if (
      formData.start_time &&
      formData.end_time &&
      new Date(formData.start_time) >= new Date(formData.end_time)
    )
      newErrors.end_time = "Thời gian kết thúc phải sau thời gian bắt đầu";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng kiểm tra lại các trường bị lỗi.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const scheduleToSave = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time
          ? new Date(formData.end_time).toISOString()
          : null,
      };
      await onSave(scheduleToSave);
      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: `Lịch trình đã được ${initialData ? "cập nhật" : "tạo mới"} thành công!`,
        life: 3000,
      });
      onClose();
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: `Lỗi lưu lịch trình: ${error.message}`,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            {initialData ? "CHỈNH SỬA LỊCH TRÌNH" : "TẠO LỊCH TRÌNH MỚI"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          id="schedule-form"
          className="flex-grow p-6 space-y-4 overflow-y-auto no-scrollbar"
        >
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
            <p className="text-[11px] text-blue-700 font-bold flex items-center gap-2">
              <Info size={14} /> Vui lòng điền đầy đủ thông tin lịch trình.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Tiêu đề lịch trình <span className="text-red-500">*</span>
            </label>
            <InputText
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Nhập tiêu đề lịch trình..."
              className={`w-full p-3 bg-gray-50 border ${
                errors.title ? "border-red-500" : "border-gray-200"
              } rounded-lg font-bold text-gray-800`}
              pt={{
                root: {
                  className: "focus:ring-2 focus:ring-primary-100 outline-none",
                },
              }}
            />
            {errors.title && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Nội dung chi tiết
            </label>
            <textarea
              rows={4}
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Nội dung chi tiết về lịch trình..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm leading-relaxed"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <Calendar
                name="start_time"
                value={
                  formData.start_time ? new Date(formData.start_time) : null
                }
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "start_time",
                      value: e.value ? (e.value as Date).toISOString() : "",
                    },
                  } as any)
                }
                hideOnDateTimeSelect
                showTime
                hourFormat="12"
                showIcon
                className="w-full border border-gray-200 rounded-lg"
                inputClassName={`p-3 bg-gray-50 text-gray-800 text-sm ${
                  errors.start_time ? "p-invalid" : ""
                }`}
                dateFormat="yy-mm-dd"
              />
              {errors.start_time && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.start_time}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Thời gian kết thúc
              </label>
              <Calendar
                name="end_time"
                value={formData.end_time ? new Date(formData.end_time) : null}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "end_time",
                      value: e.value ? (e.value as Date).toISOString() : "",
                    },
                  } as any)
                }
                showTime
                hideOnDateTimeSelect
                hourFormat="12"
                showIcon
                className="w-full border border-gray-200 rounded-lg"
                inputClassName={`p-3 bg-gray-50 text-gray-800 text-sm ${
                  errors.start_time ? "p-invalid" : ""
                }`}
                dateFormat="yy-mm-dd"
              />
              {errors.end_time && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Địa điểm <span className="text-red-500">*</span>
              </label>
              <div className="w-full relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="VD: Phòng họp số 1"
                  className={`w-full p-3 pl-10 bg-gray-50 border ${
                    errors.location ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:ring-2 focus:ring-primary-100 outline-none font-medium text-gray-800`}
                />
              </div>

              {errors.location && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.location}
                </p>
              )}
            </div>
            {/* <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Đơn vị chỉ đạo
              </label>
              <div className="relative">
                <Building
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="coordinating_unit"
                  value={formData.coordinating_unit}
                  onChange={handleInputChange}
                  placeholder="VD: Văn phòng Sở"
                  className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none font-medium text-gray-800"
                />
              </div>
            </div> */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Cán bộ <span className="text-red-500">*</span>
              </label>
              <Dropdown
                name="presider_id"
                value={formData.presider_id}
                options={presiderOptions}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "presider_id",
                      value: e.value,
                    },
                  } as any)
                }
                placeholder="Chọn người công tác"
                className={`w-full ${errors.presider_id ? "p-invalid" : ""}`}
              />
              {errors.presider_id && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.presider_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Mức độ ưu tiên
              </label>
              <div className="relative">
                <Dropdown
                  name="priority"
                  value={formData.priority}
                  options={priorityOptions}
                  onChange={(e) =>
                    handleInputChange({
                      target: {
                        name: "priority",
                        value: e.value,
                      },
                    } as any)
                  }
                  className="w-full"
                  placeholder="Chọn mức độ"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
          <Button
            type="submit"
            form="schedule-form"
            loading={loading}
            className="flex-1 !bg-primary-600 hover:!bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-100"
            label={initialData ? "CẬP NHẬT LỊCH TRÌNH" : "TẠO LỊCH TRÌNH"}
          />
          <Button
            type="button"
            onClick={onClose}
            label="HỦY BỎ"
            outlined
            className="px-8 !border-gray-200 hover:!bg-gray-100 !text-gray-600 font-bold py-4 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
