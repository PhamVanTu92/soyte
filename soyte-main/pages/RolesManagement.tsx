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
  ChevronDown,
  Key,
} from "lucide-react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { Button, InputText, InputTextarea } from "@/components/prime";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Role, Permission } from "../types";

const RolesManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermNames, setSelectedPermNames] = useState<string[]>([]);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  const [savingPerms, setSavingPerms] = useState(false);

  const toast = useRef<Toast>(null);

  const fetchRoles = async (search?: string) => {
    setLoading(true);
    try {
      const res = await api.getRoles(search ? { search } : undefined);
      const data = res.data || res.roles || res;
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.getPermissions();
      const data = res.permissions || res.data || res;
      setAvailablePermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchRoles(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const hierarchicalPermissions = useMemo(() => {
    const filterCategories = (items: Permission[], depth = 0): Permission[] => {
      if (depth >= 2) return [];
      return items
        .filter((p) => {
          // Depth 0 (root): show all
          if (depth === 0) return true;
          // Depth 1: only show category nodes (nodes that have sub-children), not leaf actions
          return p.children && p.children.length > 0;
        })
        .map((p) => ({
          ...p,
          children: p.children ? filterCategories(p.children, depth + 1) : [],
        }));
    };

    const hasNested = availablePermissions.some(
      (p) => p.children && p.children.length > 0,
    );

    if (hasNested) {
      const filtered = filterCategories(availablePermissions);
      const allIds = new Set(filtered.map((p) => p.id));
      return filtered.filter((p) => !p.parent_id || !allIds.has(p.parent_id));
    }

    // Flat API response — build tree, then keep only roots (no children to show at depth 1)
    const map: Record<number, Permission & { children: Permission[] }> = {};
    availablePermissions.forEach((p) => {
      map[p.id] = { ...p, children: [] };
    });
    const roots: (Permission & { children: Permission[] })[] = [];
    availablePermissions.forEach((p) => {
      if (p.parent_id && map[p.parent_id]) {
        map[p.parent_id].children.push(map[p.id]);
      } else {
        roots.push(map[p.id]);
      }
    });
    // After building tree, apply same depth-1 category filter
    return roots.map((r) => ({
      ...r,
      children: r.children.filter((c) => c.children && c.children.length > 0),
    }));
  }, [availablePermissions]);

  const handleTogglePermission = (permission: any) => {
    const permName = permission.name;
    const isSelected = selectedPermNames.includes(permName);
    let newSelected = [...selectedPermNames];

    const getAllDescendants = (p: any): string[] => {
      let names: string[] = [p.name];
      if (p.children?.length > 0) {
        p.children.forEach((c: any) => {
          names = [...names, ...getAllDescendants(c)];
        });
      }
      return names;
    };

    const getAncestors = (pName: string): string[] => {
      const p = availablePermissions.find((x) => x.name === pName);
      if (!p || !p.parent_id) return [];
      const parent = availablePermissions.find((x) => x.id === p.parent_id);
      if (!parent) return [];
      return [parent.name, ...getAncestors(parent.name)];
    };

    if (isSelected) {
      const toDeselect = getAllDescendants(permission);
      newSelected = newSelected.filter((p) => !toDeselect.includes(p));
    } else {
      const toSelect = getAllDescendants(permission);
      newSelected = Array.from(new Set([...newSelected, ...toSelect]));
      const ancestors = getAncestors(permName);
      newSelected = Array.from(new Set([...newSelected, ...ancestors]));
      if (permission.children?.length > 0) {
        setExpandedParents((prev) => ({ ...prev, [permission.id]: true }));
      }
    }
    setSelectedPermNames(newSelected);
  };

  const handleOpenPermissions = (role: Role) => {
    setSelectedRoleForPerms(role);
    const existing =
      role.permissions?.map((p: any) =>
        typeof p === "string" ? p : p.name,
      ) || [];
    setSelectedPermNames(existing);
    setExpandedParents({});
    setIsPermDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleForPerms) return;
    setSavingPerms(true);
    try {
      const flattenPerms = (perms: Permission[]): Permission[] =>
        perms.reduce(
          (acc, p) => [...acc, p, ...flattenPerms(p.children || [])],
          [] as Permission[],
        );
      const allPerms = flattenPerms(availablePermissions);
      const permIds = selectedPermNames
        .map((name) => allPerms.find((p) => p.name === name)?.id)
        .filter((id): id is number => id !== undefined);
      await api.assignPermissionsToRole(
        selectedRoleForPerms.id,
        permIds,
      );
      setIsPermDialogOpen(false);
      fetchRoles(debouncedSearch || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleOpenForm = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || "", is_active: role.is_active ?? true });
      setSelectedPermNames(role.permissions?.map((p) => p.name) || []);
    } else {
      setEditingRole(null);
      setFormData({ name: "", description: "", is_active: true });
      setSelectedPermNames([]);
    }
    setExpandedParents({});
    setErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim())
      newErrors.name = "Tên vai trò không được để trống";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const flattenPerms = (perms: Permission[]): Permission[] =>
        perms.reduce(
          (acc, p) => [...acc, p, ...flattenPerms(p.children || [])],
          [] as Permission[],
        );
      const allPerms = flattenPerms(availablePermissions);
      const permIds = selectedPermNames
        .map((name) => allPerms.find((p) => p.name === name)?.id)
        .filter((id): id is number => id !== undefined);
      if (editingRole) {
        await api.updateRole(editingRole.id, { ...formData, permission_ids: permIds });
      } else {
        await api.createRole({ ...formData, permission_ids: permIds });
      }
      setIsFormOpen(false);
      fetchRoles(debouncedSearch || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (role: Role) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "XÓA",
      rejectLabel: "HỦY",
      acceptClassName:
        "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all",
      rejectClassName:
        "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
      accept: async () => {
        try {
          await api.deleteRole(role.id);
          fetchRoles(debouncedSearch || undefined);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const filteredRoles = roles;

  const renderPermissionItem = (item: Permission, level = 0) => {
    const isSelected = selectedPermNames.includes(item.name);
    const children = item.children || [];
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedParents[item.id] || isSelected;

    return (
      <React.Fragment key={item.id}>
        <div
          className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer border mb-2 ${
            isSelected
              ? "bg-primary-50 border-primary-200 shadow-sm"
              : "bg-white border-gray-100 hover:border-gray-300"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => handleTogglePermission(item)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary-600 border-primary-600 shadow-primary-100 shadow-lg"
                  : "bg-gray-50 border-gray-200 group-hover:border-primary-300"
              }`}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
            <div
              className={`text-[11px] font-black tracking-tight leading-tight uppercase transition-colors ${
                isSelected ? "text-primary-800" : "text-gray-600"
              }`}
            >
              {item.description}
            </div>
          </div>
          {hasChildren && (
            <div
              className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            >
              <ChevronDown
                size={14}
                className={isSelected ? "text-primary-500" : "text-gray-400"}
              />
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-300">
            {children.map((child) => renderPermissionItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <AdminLayout title="Quản lý Vai trò">
      <Toast ref={toast} />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Tổng số vai trò
            </p>
            <h3 className="text-2xl font-black text-gray-800">{roles.length}</h3>
          </div>
        </div>
        <div className="flex flex-col justify-center xl:col-start-4">
          <Button
            onClick={() => handleOpenForm()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-secondary-100 transition-all transform hover:-translate-y-1 !bg-secondary-600 hover:!bg-secondary-700"
          >
            <Plus size={24} /> THÊM MỚI VAI TRÒ
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 md:p-6">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <InputText
              placeholder="Tìm kiếm vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
        </div>

        <ScrollableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Tên vai trò</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Số quyền</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center text-gray-400 font-bold"
                  >
                    {searchTerm
                      ? "Không tìm thấy vai trò nào."
                      : "Chưa có vai trò nào trong hệ thống."}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">
                        {role.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">
                        {role.description || "---"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-primary-50 text-primary-700 border border-primary-100">
                        {role.permissions?.length ?? 0} quyền
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          icon={<Key size={16} />}
                          text
                          rounded
                          tooltip="Phân quyền cho vai trò"
                          tooltipOptions={{ position: "top" }}
                          className="w-8 h-8 !text-purple-600 hover:!bg-purple-50"
                          onClick={() => handleOpenPermissions(role)}
                        />
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          className="w-8 h-8"
                          onClick={() => handleOpenForm(role)}
                        />
                        <Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          className="w-8 h-8"
                          onClick={() => handleDelete(role)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </div>

      {/* Role Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Shield size={20} />
                {editingRole ? "CHỈNH SỬA VAI TRÒ" : "THÊM MỚI VAI TRÒ"}
              </h3>
              <Button
                icon={<X size={20} />}
                text
                rounded
                onClick={() => setIsFormOpen(false)}
                className="!text-white hover:!bg-white/20"
              />
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Tên vai trò <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Quản lý bệnh viện"
                  className={`w-full p-3 bg-gray-50 border ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  } rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-100`}
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
                  placeholder="Mô tả chi tiết về vai trò này..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  autoResize
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Kích hoạt
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? "bg-primary-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={`text-xs font-bold ${formData.is_active ? "text-green-600" : "text-gray-400"}`}>
                  {formData.is_active ? "Đang hoạt động" : "Vô hiệu hóa"}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Gán quyền{" "}
                  <span className="text-primary-500 font-black">
                    ({selectedPermNames.length} đã chọn)
                  </span>
                </label>
                <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 max-h-60 overflow-y-auto custom-scrollbar">
                  {availablePermissions.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-[10px] font-black uppercase">Đang tải...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {hierarchicalPermissions.map((p) => renderPermissionItem(p))}
                    </div>
                  )}
                </div>
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
                  className="flex-1 !bg-primary-600 hover:!bg-primary-700 text-white font-bold py-3 rounded-xl shadow-xl shadow-primary-100 flex items-center justify-center gap-2"
                >
                  {editingRole ? <Save size={18} /> : <Send size={18} />}
                  {editingRole ? "CẬP NHẬT" : "TẠO VAI TRÒ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Assignment Dialog */}
      {isPermDialogOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2 uppercase">
                <Key size={20} />
                PHÂN QUYỀN: {selectedRoleForPerms?.name}
              </h3>
              <Button
                icon={<X size={20} />}
                text
                rounded
                onClick={() => setIsPermDialogOpen(false)}
                className="!text-white hover:!bg-white/20"
              />
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-xs text-gray-500 mb-4 font-bold uppercase">
                Đã chọn: {selectedPermNames.length} quyền
              </p>
              <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200">
                {availablePermissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Đang kết nối...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {hierarchicalPermissions.map((p) =>
                      renderPermissionItem(p),
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/50">
              <Button
                label="HỦY BỎ"
                onClick={() => setIsPermDialogOpen(false)}
                outlined
                className="flex-1 py-4 border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-[11px] shadow-sm"
              />
              <Button
                label="LƯU PHÂN QUYỀN"
                icon={
                  savingPerms ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )
                }
                onClick={handleSavePermissions}
                disabled={savingPerms}
                loading={savingPerms}
                className="flex-1 p-4 !bg-primary-600 hover:!bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 uppercase tracking-widest text-[11px]"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RolesManagement;
