import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  Send,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { Button, InputText, InputTextarea, Dropdown } from "@/components/prime";
import { Toast } from "primereact/toast";
import { Permission } from "../types";

const PermissionsManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: null as number | null,
  });
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const toast = useRef<Toast>(null);

  const fetchPermissions = async (search?: string) => {
    setLoading(true);
    try {
      const response = await api.getPermissions(search ? { search } : undefined);
      const data = response.permissions || response.data || response;
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách quyền",
      });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to flatten a multi-level tree into a flat array
  const flattenPermissions = (items: Permission[]): Permission[] => {
    let result: Permission[] = [];
    items.forEach((item) => {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = [...result, ...flattenPermissions(item.children)];
      }
    });
    return result;
  };

  const flatPermissions = useMemo(
    () => flattenPermissions(permissions),
    [permissions],
  );

  // Filter tree by search term recursively
  const filterTree = (items: Permission[], lowerTerm: string): Permission[] => {
    return items
      .map((item) => {
        const matchesCurrent =
          item.name.toLowerCase().includes(lowerTerm) ||
          (item.description &&
            item.description.toLowerCase().includes(lowerTerm));

        const filteredChildren = item.children
          ? filterTree(item.children, lowerTerm)
          : [];

        if (matchesCurrent || filteredChildren.length > 0) {
          if (filteredChildren.length > 0) {
            setExpandedRows((prev) => ({ ...prev, [item.id]: true }));
          }
          return { ...item, children: filteredChildren };
        }
        return null;
      })
      .filter((item): item is any => item !== null) as Permission[];
  };

  // The hierarchical display structure (server already filters by `search` param)
  const hierarchicalPermissions = permissions;

  // Options for parent selection dropdown
  const parentOptions = useMemo(() => {
    return flatPermissions
      .filter((p) => !editingPermission || p.id !== editingPermission.id)
      .map((p) => ({ label: p.name, value: p.id }));
  }, [flatPermissions, editingPermission]);

  const handleOpenForm = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        description: permission.description || "",
        parent_id: permission.parent_id || null,
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: "",
        description: "",
        parent_id: null,
      });
    }
    setErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Tên quyền không được để trống";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingPermission) {
        const res = await api.updatePermission(editingPermission.id, formData);
        if (!res?.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Cập nhật quyền thành công",
          });
        }
      } else {
        const res = await api.createPermission(formData);
        if (!res?.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Thêm mới quyền thành công",
          });
        }
      }
      setIsFormOpen(false);
      fetchPermissions(debouncedSearch || undefined);
    } catch (error: any) {
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Có lỗi xảy ra khi lưu thông tin",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderPermissionRow = (
    item: Permission,
    level = 0,
  ) => {
    const children = item.children || [];
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedRows[item.id];

    return (
      <React.Fragment key={item.id}>
        <tr className="hover:bg-gray-50 transition-colors group border-b border-gray-50 text-xs">
          <td className="px-6 py-4">
            <div
              className="flex items-center gap-3"
              style={{ paddingLeft: `${level * 24}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleRow(item.id)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <span
                className={`font-black text-gray-800 uppercase tracking-tight ${level > 0 ? "text-gray-500 font-bold" : ""}`}
              >
                {item.description || item.name}
              </span>
            </div>
          </td>
          <td className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 line-clamp-1 max-w-xs uppercase italic opacity-70">
              {item.name}
            </p>
          </td>
          <td className="px-6 py-4">
            <span className="text-[10px] text-gray-600 font-black">
              {item.created_at
                ? new Date(item.created_at).toLocaleString("vi-VN")
                : "---"}
            </span>
          </td>
          <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Button
                icon={<Edit3 size={18} />}
                text
                rounded
                onClick={() => handleOpenForm(item)}
              />
            </div>
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          children.map((child) =>
            renderPermissionRow(child, level + 1),
          )}
      </React.Fragment>
    );
  };

  return (
    <AdminLayout title="Quản lý Quyền hệ thống">
      <Toast ref={toast} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Tổng số quyền
            </p>
            <h3 className="text-2xl font-black text-gray-800">
              {flatPermissions.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm tên, mã quyền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="!bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-secondary-100 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> THÊM MỚI
          </Button>
        </div>

        <ScrollableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Tên quyền</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Ngày sửa</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : hierarchicalPermissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-gray-400"
                  >
                    Không tìm thấy quyền nào.
                  </td>
                </tr>
              ) : (
                hierarchicalPermissions.map((item) => renderPermissionRow(item))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary-700 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Shield size={20} />
                {editingPermission ? "CHỈNH SỬA QUYỀN" : "THÊM MỚI QUYỀN"}
              </h3>
              <Button
                icon={<X size={20} />}
                text
                rounded
                onClick={() => setIsFormOpen(false)}
                className="!text-white hover:!bg-white/20"
              />
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Quyền cha (Không bắt buộc)
                </label>
                <Dropdown
                  value={formData.parent_id}
                  options={parentOptions}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.value })
                  }
                  placeholder="Chọn quyền cha..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                  showClear
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Tên quyền <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Xem danh sách bài viết"
                  disabled={!!editingPermission}
                  className={`w-full p-3 ${
                    editingPermission
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 text-gray-800"
                  } border ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  } rounded-lg font-bold focus:ring-2 focus:ring-primary-100 outline-none`}
                />
                {errors.name && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Mô tả
                </label>
                <InputTextarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết về quyền này..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  autoResize
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  outlined
                  label="HỦY BỎ"
                  className="flex-1 border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-xl shadow-primary-100 flex items-center justify-center gap-2"
                >
                  {editingPermission ? <Save size={20} /> : <Send size={20} />}
                  {editingPermission ? "CẬP NHẬT" : "LƯU THÔNG TIN"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PermissionsManagement;
