import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
  Key,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { TieredMenu } from "primereact/tieredmenu";
import { Button } from "@/components/prime";
import { adminMenu, type MenuItem } from "../adminMenu";
import UserInfoModal from "./UserInfoModal";
import { useRef } from "react";
import { hasPermission } from "../utils/permissionUtils";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const menu = useRef<TieredMenu>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const itemTemplate = (item: any, options: any) => (
    <button
      onClick={options.onClick}
      className={`flex items-center w-full px-4 py-3 gap-3 hover:bg-slate-50 transition-colors group ${
        item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700"
      }`}
    >
      <span
        className={`${item.danger ? "text-red-400 group-hover:text-red-600" : "text-slate-400 group-hover:text-primary-600"} transition-colors`}
      >
        {item.icon}
      </span>
      <span className="flex flex-col items-start gap-0.5 text-left">
        <span className="text-sm font-bold tracking-tight">{item.label}</span>
        {item.description && (
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider line-clamp-1">
            {item.description}
          </span>
        )}
      </span>
    </button>
  );

  const profileMenuItems = [
    {
      label: "Thông tin cá nhân",
      description: "Xem chi tiết tài khoản",
      icon: <User size={18} />,
      template: itemTemplate,
      command: () => setShowUserInfo(true),
    },
    {
      label: "Đổi mật khẩu",
      description: "Bảo mật tài khoản",
      icon: <Key size={18} />,
      template: itemTemplate,
      command: () => navigate("/change-password"),
    },
    { separator: true },
    {
      label: "Thoát hệ thống",
      description: "Đăng xuất an toàn",
      icon: <LogOut size={18} />,
      danger: true,
      template: itemTemplate,
      command: handleLogout,
    },
  ];

  const getDefaultOpenMenus = (): Record<string, boolean> => {
    const result: Record<string, boolean> = {};

    adminMenu.forEach((item) => {
      if (item.children?.length) {
        result[item.key] = item.children.some(
          (child) => location.pathname === child.to,
        );
      }
    });

    return result;
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(
    getDefaultOpenMenus(),
  );

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const isActiveLink = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.to) return location.pathname === item.to;

    if (item.children?.length) {
      return item.children.some((child) => location.pathname === child.to);
    }

    return false;
  };

  const checkPermission = (itemPermission?: string) => {
    // if (user?.role === "admin") return true;
    if (!itemPermission) return true;
    const userPermissions = user?.permissions || [];
    return hasPermission(userPermissions, itemPermission);
  };

  const renderSidebarMenu = () => (
    <ul className="space-y-1">
      {adminMenu
        .filter((item) => checkPermission(item.permission))
        .map((item) => {
          const Icon = item.icon;
          const authorizedChildren =
            item.children?.filter(
              (child) =>
                !child.permission || checkPermission(child.permission),
            ) || [];
          const hasChildren = Boolean(item.children?.length);
          const hasAuthorizedChildren = authorizedChildren.length > 0;

          if (hasChildren && !hasAuthorizedChildren && !item.to) return null;

          const isOpen = Boolean(openMenus[item.key]);
          const parentActive = isParentActive(item);

          return (
            <li key={item.key}>
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.key)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                      parentActive
                        ? "bg-white/10 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>

                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? "mt-1 max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="ml-4 flex flex-col gap-1 border-l border-white/10 pl-3">
                      {authorizedChildren.map((child) => {
                        const childActive = isActiveLink(child.to);

                        return (
                          <li key={child.key}>
                            <Link
                              to={child.to}
                              className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ${
                                childActive
                                  ? "bg-white/10 font-semibold text-white"
                                  : "text-white/90 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <Link
                  to={item.to || "#"}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                    parentActive
                      ? "bg-white/10 text-white"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Toast />
      <ConfirmDialog />

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          className="fixed inset-0 z-40 bg-slate-950/50 xl:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[88vw] max-w-72 shrink-0 flex-col bg-primary-900 text-white shadow-2xl transition-transform duration-300 xl:sticky xl:top-0 xl:z-auto xl:w-64 xl:max-w-none ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
          <div className="rounded-lg bg-white/10 p-2">
            <LayoutDashboard size={24} className="text-secondary-400" />
          </div>

          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">
              Quản trị
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200">
              Sở Y tế Hà Nội
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3 xl:hidden">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-200">
            Điều hướng
          </p>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto p-4">{renderSidebarMenu()}</nav>
      </aside>

      <main className="flex min-w-0 flex-grow flex-col">
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6 xl:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 xl:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black text-gray-800 md:text-xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
              >
                <Home size={18} />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>

              <TieredMenu
                model={profileMenuItems}
                popup
                ref={menu}
                breakpoint="767px"
                className="rounded-2xl shadow-2xl border-none ring-1 ring-black/5 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              />

              <button
                onClick={(e) => menu.current?.toggle(e)}
                className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 md:gap-2.5 md:px-4 group"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white transition-transform group-hover:scale-110">
                  {user?.full_name?.charAt(0) || "A"}
                </div>
                <span className="max-w-[140px] truncate tracking-tight sm:max-w-[180px]">
                  {user?.full_name || user?.email?.split("@")[0]}
                </span>
                <ChevronDown
                  size={14}
                  className="shrink-0 opacity-40 transition-transform group-hover:rotate-180"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 md:p-6 xl:p-8">
          <div>{children}</div>
        </div>

        {/* Modals */}
        <UserInfoModal
          visible={showUserInfo}
          onHide={() => setShowUserInfo(false)}
          user={user}
        />
      </main>
    </div>
  );
};

export default AdminLayout;
