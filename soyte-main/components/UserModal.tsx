import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { User, Role } from "../types";
import { socialFacilitiesService } from "../services/socialFacilitiesService";
import {
  Users,
  Shield,
  X,
  Save,
  Loader2,
  PlusIcon,
  Edit3Icon,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { Button, InputText, Dropdown, MultiSelect } from "@/components/prime";
import { FacilityFilterDropdown } from "./feedbacks/FacilityFilterDropdown";

interface UserModalProps {
  visible: boolean;
  onHide: () => void;
  user: User | null; // null for add mode
  onSaveSuccess: () => void;
  onSavingChange?: (saving: boolean) => void;
}

// Extract role IDs from a user object across the multiple shapes the API returns:
// assignedRoles[] / assigned_roles[] / roles[] / assignedRole / assigned_role
const getUserRoleIds = (user: any): number[] => {
  const sources = [user?.assignedRoles, user?.assigned_roles, user?.roles];
  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) {
      return src
        .map((r: any) => (typeof r === "object" ? r.id : r))
        .filter((id: any) => id !== undefined && id !== null);
    }
  }
  const single = user?.assignedRole || user?.assigned_role;
  if (single?.id) return [single.id];
  return [];
};

type FacilityOption = {
  label: string;
  value: string;
};

const UserModal: React.FC<UserModalProps> = ({
  visible,
  onHide,
  user,
  onSaveSuccess,
  onSavingChange,
}) => {
  const toast = useRef<Toast>(null);
  const isEdit = !!user;

  const [formData, setFormData] = useState<any>({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    status: 0,
    type: "",
    unit: [],
    us: "",
    pass: "",
  });

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const initialRoleIdsRef = useRef<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});
  const [facilityOptionsLoading, setFacilityOptionsLoading] = useState(false);
  const shouldAutoSelectAdminUnitsRef = useRef(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const initializeForm = async () => {
      setErrors({});
      fetchRoles();

      if (isEdit && user) {
        const rawUnit = user.unit || user.facility_id || "";
        const parsedUnit = Array.isArray(rawUnit)
          ? rawUnit.map((u: any) => String(u))
          : typeof rawUnit === "string" && rawUnit
            ? rawUnit.split(",").filter(Boolean)
            : rawUnit
              ? [String(rawUnit)]
              : [];

        let resolvedType = user.type || "";

        if (!resolvedType) {
          const firstUnitId = parsedUnit[0];

          if (firstUnitId) {
            try {
              const facility = await socialFacilitiesService.getById(firstUnitId);
              resolvedType = facility?.type || "";
            } catch (error) {
              console.error("Error resolving facility type for user:", error);
            }
          }
        }

        if (cancelled) return;

        setFormData({
          full_name: user.full_name || "",
          email: user.email || "",
          role: user.role || "user",
          status: Number(user.status) as 0 | 1,
          type: resolvedType,
          unit: parsedUnit,
          us: user.us || "",
          pass: user.pass || "",
          password: "",
        });

        const currentRoleIds = getUserRoleIds(user);
        initialRoleIdsRef.current = currentRoleIds;
        setSelectedRoleIds(currentRoleIds);
      } else {
        setFormData({
          full_name: "",
          email: "",
          password: "",
          role: "user",
          status: 0,
          type: "",
          unit: [],
          us: "",
          pass: "",
        });
        setSelectedRoleIds([]);
      }
    };

    initializeForm();

    return () => {
      cancelled = true;
    };
  }, [visible, user]);

  useEffect(() => {
    if (
      !visible ||
      !formData.type ||
      formData.role !== "admin" ||
      !shouldAutoSelectAdminUnitsRef.current
    ) {
      setFacilityOptionsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchFacilitiesByType = async () => {
      setFacilityOptionsLoading(true);
      try {
        const facilities = await socialFacilitiesService.fetchAllPages(formData.type);
        if (cancelled) return;

        if (shouldAutoSelectAdminUnitsRef.current) {
          setFormData((prev: any) => ({
            ...prev,
            unit: facilities.map((facility: any) => String(facility.id)),
          }));
          shouldAutoSelectAdminUnitsRef.current = false;
        }
      } catch (error) {
        console.error("Error fetching facilities by type:", error);
      } finally {
        if (!cancelled) {
          setFacilityOptionsLoading(false);
        }
      }
    };

    fetchFacilitiesByType();

    return () => {
      cancelled = true;
    };
  }, [visible, formData.type, formData.role]);

  const fetchRoles = async () => {
    try {
      const response = await api.getRoles();
      const data = response.data || response.roles || response;
      setAvailableRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Họ và tên không được để trống.";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email không được để trống.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng.";
    }

    if (!formData.role) {
      newErrors.role = "Vui lòng chọn vai trò.";
    }

    if (formData.role === "user") {
      if (!formData.type) {
        newErrors.type = "Vui lòng chọn loại hình.";
      }
      const unitIsEmpty = Array.isArray(formData.unit)
        ? formData.unit.length === 0
        : !formData.unit;
      if (formData.type && unitIsEmpty) {
        newErrors.unit = "Vui lòng chọn đơn vị.";
      }
    }

    if (!isEdit && !formData.password) {
      newErrors.password = "Mật khẩu không được để trống.";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.current?.show({
        severity: "warn",
        summary: "Thông tin chưa hợp lệ",
        detail: "Vui lòng kiểm tra lại các trường thông tin.",
      });
      return;
    }

    setIsSaving(true);
    onSavingChange?.(true);
    try {
      const dataToSubmit = {
        ...formData,
        unit: Array.isArray(formData.unit) ? formData.unit.join(",") : formData.unit,
      };

      let res;
      if (isEdit && user) {
        res = await api.updateUser(user.id, dataToSubmit);
        const initial = new Set(initialRoleIdsRef.current);
        const current = new Set(selectedRoleIds);
        const hasChanged =
          initial.size !== current.size ||
          selectedRoleIds.some((id) => !initial.has(id));
        if (hasChanged) {
          await api.assignRoleToUser({
            user_id: user.id,
            role_ids: selectedRoleIds,
          });
        }
      } else {
        res = await api.register(dataToSubmit);
        const newUserId = res?.id || res?.data?.id || res?.user?.id;
        if (newUserId && selectedRoleIds.length > 0) {
          await api.assignRoleToUser({
            user_id: newUserId,
            role_ids: selectedRoleIds,
          });
        }
      }

      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: isEdit ? "Cập nhật người dùng thành công" : "Thêm người dùng mới thành công",
        });
      }

      onSavingChange?.(false);
      onSaveSuccess();
      onHide();
    } catch (error: any) {
      console.error("Error saving user:", error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu thông tin người dùng",
        });
      }
      onSavingChange?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="bg-white w-full max-w-[50vw] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-lg uppercase tracking-tight">
            {isEdit ? <Edit3Icon size={20} /> : <PlusIcon size={20} />}
            {isEdit ? "CẬP NHẬT THÔNG TIN" : "THÊM MỚI NGƯỜI DÙNG"}
          </h3>
          <Button icon={<X size={20} />} text rounded onClick={onHide} className="!text-white hover:!bg-white/20" />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Users size={18} className="text-primary-600" />
                THÔNG TIN CƠ BẢN
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full p-3 bg-gray-50 border ${errors.full_name ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all`}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                  {errors.full_name && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isEdit}
                    className={`w-full p-3 border ${errors.email ? "border-red-500" : "border-gray-200"} rounded-xl outline-none font-bold transition-all ${isEdit ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-700 focus:ring-2 focus:ring-primary-100"}`}
                    placeholder="example@gmail.com"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.email}</p>}
                </div>

                {!isEdit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                      Mật khẩu tài khoản <span className="text-red-500">*</span>
                    </label>
                    <InputText
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full p-3 bg-gray-50 border ${errors.password ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-bold text-gray-700 transition-all`}
                      placeholder="••••••••"
                    />
                    {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.password}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Loại tài khoản</label>
                  <Dropdown
                    value={formData.role}
                    options={[
                      { label: "Người dùng", value: "user" },
                      { label: "Quản trị viên", value: "admin" },
                    ]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.value,
                        unit: [],
                      })
                    }
                    className={`w-full !bg-gray-50 !border-${errors.role ? "red-500" : "gray-200"} !rounded-xl outline-none font-bold text-gray-700`}
                  />
                  {errors.role && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.role}</p>}
                </div>

                {isEdit && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Trạng thái</label>
                    <Dropdown
                      value={formData.status}
                      options={[
                        { label: "Hoạt động", value: 1 },
                        { label: "Vô hiệu hóa", value: 0 },
                      ]}
                      onChange={(e) => setFormData({ ...formData, status: e.value })}
                      className="w-full !bg-gray-50 !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cơ sở / Đơn vị */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                    Loại hình {formData.role === "user" ? "cơ sở" : "quản lý"}
                    {formData.role === "user" && <span className="text-red-500"> *</span>}
                  </label>
                  <Dropdown
                    value={formData.type}
                    options={[
                      { label: "Bệnh viện", value: "BV" },
                      { label: "Trung tâm y tế", value: "TT" },
                      { label: "Bảo trợ xã hội", value: "BT" },
                      { label: "Trạm y tế", value: "TYT" },
                      { label: "Cấp cứu 115", value: "CC" },
                    ]}
                    onChange={(e) => {
                      const newType = e.value;
                      if (formData.role === "admin") {
                        shouldAutoSelectAdminUnitsRef.current = true;
                      }
                      setFormData({ ...formData, type: newType, unit: [] });
                    }}
                    placeholder="-- Chọn loại hình --"
                    className={`w-full !bg-white !border-${errors.type ? "red-500" : "gray-200"} !rounded-xl outline-none font-bold text-gray-700`}
                  />
                  {errors.type && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.type}</p>}
                </div>

                {formData.type && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                      Đơn vị {formData.role === "user" ? "công tác" : "quản lý"}
                      {formData.role === "user" && <span className="text-red-500"> *</span>}
                    </label>
                    {formData.role === "admin" ? (
                      <FacilityFilterDropdown
                        value={formData.unit}
                        onChange={(ids) => setFormData({ ...formData, unit: ids })}
                        type={formData.type}
                        placeholder={facilityOptionsLoading ? "Đang tải đơn vị..." : "-- Chọn đơn vị --"}
                        disabled={facilityOptionsLoading}
                        className="w-full !bg-white !border-gray-200 !rounded-xl outline-none font-bold text-gray-700 user-modal-ms h-[48px]"
                        panelClassName="facility-ms-panel"
                      />
                    ) : (
                      <FacilityFilterDropdown
                        value={Array.isArray(formData.unit) ? formData.unit : []}
                        onChange={(ids) => setFormData({ ...formData, unit: ids })}
                        type={formData.type}
                        placeholder="-- Chọn đơn vị --"
                        className={`w-full !bg-white !border-${errors.unit ? "red-500" : "gray-200"} !rounded-xl outline-none font-bold text-gray-700 h-[48px]`}
                      />
                    )}
                    {errors.unit && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.unit}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Gán vai trò */}
            <div className="space-y-3">
              <h4 className="font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2 uppercase text-sm">
                <Shield size={18} className="text-primary-600" />
                GÁN VAI TRÒ
              </h4>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                  Vai trò được gán
                </label>
                {availableRoles.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-[10px] font-black uppercase">Đang tải danh sách vai trò...</span>
                  </div>
                ) : (
                  <MultiSelect
                    value={selectedRoleIds}
                    options={availableRoles.map((r) => ({ label: r.name, value: r.id }))}
                    onChange={(e) => setSelectedRoleIds(e.value)}
                    placeholder="-- Chọn vai trò --"
                    filter
                    filterPlaceholder="Tìm kiếm vai trò..."
                    className="w-full !bg-gray-50 !border-gray-200 !rounded-xl outline-none font-bold text-gray-700 user-modal-ms"
                    panelClassName="roles-ms-panel"
                    maxSelectedLabels={5}
                    selectedItemsLabel="{0} vai trò đã chọn"
                  />
                )}
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  Quyền hạn của người dùng được kế thừa từ các vai trò được gán.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/50">
          <Button label="HỦY BỎ" onClick={onHide} className="flex-1 py-4 border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-[11px] shadow-sm" outlined />
          <Button
            label={isEdit ? "CẬP NHẬT DỮ LIỆU" : "KHỞI TẠO NGƯỜI DÙNG"}
            icon={isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1 p-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-[11px]"
          />
        </div>
      </div>
    </div>
  );
};

export default UserModal;
