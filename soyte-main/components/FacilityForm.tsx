import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Save,
  Building2,
  MapPin,
  Phone,
  Info,
} from "lucide-react";
import { api } from "../api";
import {
  Dropdown,
  InputText,
  InputTextarea,
  Button,
} from "@/components/prime";
import { Toast } from "primereact/toast";

interface FacilityFormProps {
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}

const FACILITY_TYPES = [
  { id: "BV", title: "Bệnh viện" },
  { id: "BT", title: "Cơ sở bảo trợ" },
  { id: "TT", title: "Trung tâm" },
  { id: "CC", title: "Chi cục" },
  { id: "TYT", title: "Trạm y tế" },
];

const CATEGORY_OPTIONS_BV = [
  { id: "Cơ sở y tế tư nhân", title: "Cơ sở y tế tư nhân" },
  { id: "Cơ sở y tế thuộc Trung ương và Bộ Ngành", title: "Cơ sở y tế thuộc Trung ương và Bộ Ngành" },
];

const FacilityForm: React.FC<FacilityFormProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    category: "",
    address: "",
    phone: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (formData.type && formData.type !== "BV") {
      const selectedType = FACILITY_TYPES.find((t) => t.id === formData.type);
      if (selectedType) {
        setFormData((prev) => ({ ...prev, category: selectedType.title }));
      }
    }
  }, [formData.type]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        type: initialData.type || "",
        category: initialData.category || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        latitude: initialData.latitude ?? "",
        longitude: initialData.longitude ?? "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Tên cơ sở không được để trống";
    if (!formData.type) newErrors.type = "Vui lòng chọn loại cơ sở";
    if (!formData.category) newErrors.category = "Vui lòng chọn danh mục";
    if (!formData.address.trim()) newErrors.address = "Địa chỉ không được để trống";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng điền đầy đủ các thông tin bắt buộc",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
      };

      let res;
      if (initialData?.id) {
        res = await api.put(`/social-facilities/${initialData.id}`, payload);
      } else {
        res = await api.post("/social-facilities", payload);
      }
      
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: initialData ? "Cập nhật thành công" : "Thêm mới thành công",
        });
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving facility:", error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu thông tin cơ sở",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <Building2 size={20} />
            {initialData ? "CHỈNH SỬA CƠ SỞ Y TẾ" : "THÊM MỚI CƠ SỞ Y TẾ"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] no-scrollbar">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Tên cơ sở y tế <span className="text-red-500">*</span>
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Bệnh viện Đa khoa Hà Nội..."
              className={`w-full p-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-primary-100 outline-none`}
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>}
          </div>

          <div className={`grid ${formData.type === "BV" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Loại cơ sở <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.type}
                options={FACILITY_TYPES}
                optionLabel="title"
                optionValue="id"
                onChange={(e) => setFormData({ ...formData, type: e.value, category: e.value === 'BV' ? "" : formData.category })}
                placeholder="Chọn loại"
                className={`w-full ${errors.type ? "p-invalid" : ""}`}
              />
              {errors.type && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.type}</p>}
            </div>
            {formData.type === "BV" && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Loại hình bệnh viện <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={formData.category}
                  options={CATEGORY_OPTIONS_BV}
                  optionLabel="title"
                  optionValue="id"
                  onChange={(e) => setFormData({ ...formData, category: e.value })}
                  placeholder="Chọn loại hình"
                  className={`w-full ${errors.category ? "p-invalid" : ""}`}
                />
                {errors.category && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.category}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={14} />
                </span>
                <InputText
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ cụ thể..."
                  className={`w-full pl-10 p-3 bg-gray-50 border ${errors.address ? "border-red-500" : "border-gray-200"} rounded-lg text-sm focus:ring-2 focus:ring-primary-100 outline-none`}
                />
              </div>
              {errors.address && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone size={14} />
                </span>
                <InputText
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Số điện thoại liên hệ..."
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Kinh độ (Longitude)
              </label>
              <InputText
                type="number"
                step="any"
                value={String(formData.longitude)}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="105.xxxx"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Vĩ độ (Latitude)
              </label>
              <InputText
                type="number"
                step="any"
                value={String(formData.latitude)}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="21.xxxx"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Mô tả thêm
            </label>
            <InputTextarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Thông tin giới thiệu, giờ làm việc..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              autoResize
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              outlined
              label="HỦY BỎ"
              className="flex-1 border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-xl shadow-primary-100 flex items-center justify-center gap-2"
            >
              {initialData ? <Save size={20} /> : <Send size={20} />}
              {initialData ? "CẬP NHẬT" : "LƯU THÔNG TIN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacilityForm;
