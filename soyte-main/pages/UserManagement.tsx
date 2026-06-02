import React, { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { TablePagination } from "../components/common/TablePagination";
import UserModal from "../components/UserModal";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  Plus,
  Shield,
  Edit3,
  Trash2,
  MailPlus,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Button, Tooltip, InputText } from "@/components/prime";
import {
  getInitialPageFromUrl,
  usePageUrlSync,
} from "../hooks/usePageUrlSync";
import { User } from "../types";

// Extract role names from a user object across the multiple shapes the API returns:
// assignedRoles[] / assigned_roles[] / roles[] / assignedRole / assigned_role
const getUserRoleNames = (user: any): string[] => {
  const sources = [user?.assignedRoles, user?.assigned_roles, user?.roles];
  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) {
      return src.map((r: any) => (typeof r === "object" ? r.name : r));
    }
  }
  const single = user?.assignedRole || user?.assigned_role;
  if (single) return [typeof single === "object" ? single.name : single];
  return [];
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [params, setParams] = useState({
    page: getInitialPageFromUrl(),
    limit: 30,
  });
  usePageUrlSync(params.page);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useRef<Toast>(null);
  const fetchSeqRef = useRef(0);
  const savingRef = useRef(false);
  const pendingFetchRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    if (savingRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    const seq = ++fetchSeqRef.current;
    try {
      setLoading(true);
      const response = await api.get("/users", {
        page: params.page,
        limit: params.limit,
        search: debouncedSearchTerm || undefined,
      });
      if (seq !== fetchSeqRef.current) return;
      const data = response?.data || response;
      const meta = response?.meta;
      const normalizedUsers = Array.isArray(data)
        ? data.map((u: any) => ({
            ...u,
            status: Number(u.status) as 0 | 1,
          }))
        : [];

      setUsers(normalizedUsers);
      setTotalUsers(Number(meta?.total ?? normalizedUsers.length));
      setTotalPages(
        Math.max(
          1,
          Number(
            meta?.totalPages ??
              Math.ceil(Number(meta?.total ?? normalizedUsers.length) / params.limit),
          ),
        ),
      );
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách người dùng",
      });
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [params.page, params.limit, debouncedSearchTerm]);

  const handleDeactivate = async (userId: string | number) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn vô hiệu hóa người dùng này?",
      header: "Xác nhận",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "XÁC NHẬN",
      rejectLabel: "HỦY BỎ",
      acceptClassName: "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all !transform hover:!-translate-y-0.5",
      rejectClassName: "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
      accept: async () => {
        try {
          const res = await api.updateUser(userId, { status: 0 });
          setUsers((currentUsers) =>
            currentUsers?.map((u) =>
              u.id === userId ? { ...u, status: 0 as 0 | 1 } : u,
            ),
          );
          if (!res?.message) {
            toast.current?.show({
              severity: "success",
              summary: "Thành công",
              detail: "Đã vô hiệu hóa người dùng",
            });
          }
        } catch (err: any) {
          if (err.message && err.message.includes("API Error")) {
            toast.current?.show({
              severity: "error",
              summary: "Lỗi",
              detail: "Không thể vô hiệu hóa người dùng.",
            });
          }
          console.error(err);
        }
      },
    });
  };

  const handleResendEmail = async (user: User) => {
    try {
      if (!user.email) return;
      const res = await api.resendVerification(user.email);
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã gửi lại email xác thực mật khẩu.",
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể gửi lại email.",
        });
      }
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setParams((current) =>
      current.page === 1 ? current : { ...current, page: 1 },
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setParams((current) => ({ ...current, page: newPage }));
    }
  };

  const currentRange = useMemo(() => {
    if (totalUsers === 0 || users.length === 0) {
      return { from: 0, to: 0 };
    }

    const from = (params.page - 1) * params.limit + 1;
    const to = from + users.length - 1;
    return { from, to };
  }, [params.page, params.limit, totalUsers, users.length]);

  const stats = useMemo(
    () => ({
      total: totalUsers,
      active: users.filter((u) => Number(u.status) === 1).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users, totalUsers],
  );

  return (
    <AdminLayout title="Quản lý Người dùng">
      <Toast ref={toast} />

      <UserModal
        visible={isModalOpen}
        onHide={() => setIsModalOpen(false)}
        user={selectedUser}
        onSaveSuccess={fetchUsers}
        onSavingChange={(saving) => {
          savingRef.current = saving;
          if (!saving && pendingFetchRef.current) {
            pendingFetchRef.current = false;
            fetchUsers();
          }
        }}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          title="Tổng số người dùng"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          title="Đang hoạt động"
          value={stats.active}
          color="green"
        />
        <StatCard
          icon={Shield}
          title="Quản trị viên"
          value={stats.admins}
          color="amber"
        />
        <div className="flex flex-col justify-center">
          <Button
            onClick={handleOpenAddModal}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-secondary-100 transition-all transform hover:-translate-y-1 !bg-secondary-600 hover:!bg-secondary-700"
          >
            <Plus size={24} /> THÊM MỚI NGƯỜI DÙNG
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 md:p-6">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <InputText
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <Loader2
                size={36}
                className="mx-auto mb-4 animate-spin text-primary-600"
              />
              <p className="text-[10px] font-bold uppercase text-gray-400">
                Đang tải dữ liệu người dùng...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <Users size={32} />
              </div>
              <p className="font-bold text-gray-400">
                {debouncedSearchTerm
                  ? "Không tìm thấy người dùng nào phù hợp."
                  : "Không có người dùng nào trong hệ thống."}
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="space-y-4 p-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded border px-2 py-1 text-[10px] font-black uppercase ${
                      user.role === "admin"
                        ? "border-amber-100 bg-amber-50 text-amber-700"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      Number(user.status) === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        Number(user.status) === 1 ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {Number(user.status) === 1 ? "Hoạt động" : "Vô hiệu hóa"}
                  </span>
                  {user.is_verified === false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase text-red-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                      Chưa kích hoạt
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const roleList = getUserRoleNames(user);

                    if (roleList.length > 0) {
                      return roleList.slice(0, 3).map((name: string, idx: number) => (
                        <span
                          key={idx}
                          className="whitespace-nowrap rounded border border-purple-100 bg-purple-50 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-700"
                        >
                          {name}
                        </span>
                      ));
                    }

                    return (
                      <span className="text-[10px] italic text-gray-400">
                        Chưa gán vai trò
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                  <Button
                    icon={<Edit3 size={18} />}
                    text
                    rounded
                    className="h-8 w-8"
                    onClick={() => handleOpenEditModal(user)}
                  />
                  {Number(user.status) === 1 && user.is_verified === true && (
                    <Button
                      icon={<Trash2 size={18} />}
                      text
                      rounded
                      severity="danger"
                      className="h-8 w-8"
                      onClick={() => handleDeactivate(user.id)}
                      disabled={Number(user.status) !== 1}
                    />
                  )}
                  {user.is_verified === false && (
                    <Button
                      icon={<MailPlus size={16} />}
                      rounded
                      className="h-9 w-9 !border !border-sky-200 !bg-sky-50 !text-sky-700 shadow-sm hover:!bg-sky-100"
                      tooltip="Gửi lại mail xác thực"
                      tooltipOptions={{ position: "top" }}
                      onClick={() => handleResendEmail(user)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <ScrollableTable className="hidden md:block">
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Tên người dùng</th>
                <th className="px-6 py-4">Loại TK</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
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
                      Đang tải dữ liệu người dùng...
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${user.role === "admin"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const roleList = getUserRoleNames(user);

                          if (roleList.length > 0) {
                            return (
                              <>
                                {roleList.slice(0, 2).map((name: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[9px] font-bold whitespace-nowrap uppercase"
                                  >
                                    {name}
                                  </span>
                                ))}
                                {roleList.length > 2 && (
                                  <>
                                    <span
                                      id={`user-role-${user.id}`}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold whitespace-nowrap cursor-help hover:bg-gray-200 transition-colors"
                                    >
                                      +{roleList.length - 2}
                                    </span>
                                    <Tooltip
                                      target={`#user-role-${user.id}`}
                                      content={roleList.slice(2).join(", ")}
                                      position="top"
                                      className="text-[10px] font-bold uppercase"
                                    />
                                  </>
                                )}
                              </>
                            );
                          }

                          return (
                            <span className="text-[10px] text-gray-400 italic">
                              Chưa gán vai trò
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${Number(user.status) === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${Number(user.status) === 1 ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        {Number(user.status) === 1
                          ? "Hoạt động"
                          : "Vô hiệu hóa"}
                      </span>

                      {user.is_verified === false ? (
                        <span
                          className={`inline-flex ml-2 items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full bg-red-500`}
                          ></div>

                          Chưa kích hoạt
                        </span>
                      ) : <></>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          className="w-8 h-8"
                          onClick={() => handleOpenEditModal(user)}
                        />
                        {Number(user.status) === 1 && user.is_verified === true && (<Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          className="w-8 h-8"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={Number(user.status) !== 1}
                        />
                        )}
                        {user.is_verified === false && (
                          <Button
                            icon={<MailPlus size={16} />}
                            rounded
                            className="w-9 h-9 !bg-sky-50 hover:!bg-sky-100 !text-sky-700 !border !border-sky-200 shadow-sm"
                            tooltip="Gửi lại mail xác thực"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => handleResendEmail(user)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Users size={32} />
              </div>
              <p className="text-gray-400 font-bold">
                {debouncedSearchTerm
                  ? "Không tìm thấy người dùng nào phù hợp."
                  : "Không có người dùng nào trong hệ thống."}
              </p>
            </div>
          )}
        </ScrollableTable>

        <TablePagination
          displayInfo={
            <>
              Hiển thị <span className="font-bold">{currentRange.from}</span>
              {" - "}
              <span className="font-bold">{currentRange.to}</span> trên{" "}
              <span className="font-bold">{totalUsers}</span> người dùng
            </>
          }
          pageSize={params.limit}
          onPageSizeChange={(size) =>
            setParams((prev) => ({ ...prev, limit: size }))
          }
          currentPage={params.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </AdminLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
  color: "blue" | "green" | "amber";
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all transform hover:-translate-y-1">
      <div
        className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
      </div>
    </div>
  );
};

export default UserManagement;
