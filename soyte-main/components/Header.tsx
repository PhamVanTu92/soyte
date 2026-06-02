import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  Phone,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Key,
} from "lucide-react";
import { TieredMenu } from "primereact/tieredmenu";
import UserInfoModal from "./UserInfoModal";
import { MAIN_MENU } from "../constants";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/prime";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const [currentTime] = useState(new Date());
  const { user, logout } = useAuth(); // Use the context
  const navigate = useNavigate();
  const menu = useRef<TieredMenu>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

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
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-bold tracking-tight">{item.label}</span>
        {item.description && (
          <span className="text-[10px] text-slate-400 font-medium uppercase">
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

  const location = useLocation();

  useEffect(() => {
    // When the route changes, close the mobile menu
    setIsMenuOpen(false);
    setOpenSubMenu(null);
  }, [location.pathname]);

  const getFormattedDateTime = (date: Date) => {
    const days = [
      "Chủ nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    return `${days[date.getDay()]}, ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.toLocaleTimeString("vi-VN")}`;
  };

  const MobileMenu = () => {
    const activeMenuItem = MAIN_MENU.find((item) => item.id === openSubMenu);

    return (
      <div className="lg:hidden">
        {openSubMenu && activeMenuItem ? (
          // Sub-menu view
          <div className="animate-in slide-in-from-right-5 duration-300">
            <Button
              onClick={() => setOpenSubMenu(null)}
              className="flex items-center gap-2 px-3 py-3.5 text-left font-bold text-gray-100 hover:bg-white/10 w-full"
            >
              <ChevronLeft size={16} />
              <span>{activeMenuItem.title}</span>
            </Button>
            <ul className="flex flex-col">
              {activeMenuItem.children?.map((child: any) => (
                <li key={child.id}>
                  <Link
                    to={!child.linkUrl ? child.path : child.linkUrl}
                    className="block px-3 py-3.5 pl-10 text-sm font-medium text-gray-300 hover:bg-white/5"
                  >
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Main menu view
          <ul className="flex flex-col animate-in fade-in duration-200">
            {MAIN_MENU.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              return (
                <li key={item.id}>
                  {hasChildren ? (
                    <button
                      onClick={() => setOpenSubMenu(item.id)}
                      className="flex items-center justify-between w-full px-3 py-3.5 text-left text-[13px] uppercase font-bold text-gray-100 hover:bg-white/10"
                    >
                      <span className="tracking-wide">{item.title}</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className="block px-3 py-3.5 text-[13px] uppercase font-bold text-gray-100 tracking-wide hover:bg-white/10"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md font-sans">
      {/* Top Bar */}
      <div className="bg-primary-700 text-white py-2 text-[11px] md:text-xs border-b border-primary-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium text-primary-100 hidden md:inline-block">
              {getFormattedDateTime(currentTime)}
            </span>
            <span className="opacity-30 hidden md:inline-block">|</span>
            <span className="flex items-center font-bold text-white hover:text-yellow-300 transition-colors cursor-pointer text-[10px] md:text-xs">
              <Phone size={14} className="mr-1.5 animate-pulse" />
              ĐƯỜNG DÂY NÓNG SỞ Y TẾ: 02439985765/ 0967981616
            </span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 font-medium">
            {user ? (
              <div className="relative flex items-center gap-3">
                <TieredMenu
                  model={profileMenuItems}
                  popup
                  ref={menu}
                  breakpoint="767px"
                  className="rounded-2xl shadow-2xl border-none ring-1 ring-black/5 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                />

                <button
                  onClick={(e) => menu.current?.toggle(e)}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-white transition-all border border-white/10 group shadow-inner"
                >
                  <div className="w-6 h-6 rounded-full bg-secondary-500 flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">
                    {user.full_name?.charAt(0) || "A"}
                  </div>
                  <span className="text-xs font-bold tracking-tight">
                    {user.full_name || "Quản trị viên"}
                  </span>
                  <ChevronDown
                    size={12}
                    className="opacity-50 group-hover:rotate-180 transition-transform"
                  />
                </button>

                {user?.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-1.5 bg-secondary-500 hover:bg-secondary-600 px-3.5 py-1.5 rounded-full font-bold text-white transition-all shadow-lg text-[10px] md:text-xs hover:-translate-y-0.5"
                  >
                    <LayoutDashboard size={14} /> QUẢN TRỊ
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary-200 transition">
                  Đăng nhập cán bộ
                </Link>
                <span className="opacity-30">|</span>
                <Link
                  to="/citizen"
                  className="hover:text-primary-200 transition"
                >
                  Cổng công dân
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white py-6 md:py-8 shadow-sm relative z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-4 group">
              <img
                crossOrigin="anonymous"
                src="https://storage-vnportal.vnpt.vn/gov-hni/6749/soyte.png"
                alt="Logo Sở Y Tế"
                className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <h2 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">
                  TRANG THÔNG TIN ĐIỆN TỬ CHUYÊN NGÀNH Y TẾ
                </h2>
                <h1 className="text-xl md:text-3xl font-black text-[#d32f2f] uppercase leading-none py-1 group-hover:text-red-700 transition-colors">
                  SỨC KHỎE THỦ ĐÔ
                </h1>
                <p className="text-[11px] md:text-sm text-primary-800 font-bold italic">
                  Kết nối thông tin, bảo vệ sức khỏe cộng đồng
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center flex-1 max-w-sm justify-end">
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Tìm kiếm thông tin..."
                  className="w-full pl-5 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all text-sm"
                />
                <Button
                  className="absolute right-1 top-1 bottom-1 px-4 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                  aria-label="Search"
                >
                  <Search size={16} />
                </Button>
              </div>
            </div>

            <Button
              className="lg:hidden absolute top-4 right-4 !text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              text
              rounded
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>
      <nav
        className={`${
          isMenuOpen ? "block" : "hidden"
        } lg:block bg-gradient-to-r from-primary-800 to-primary-900 text-white transition-all duration-300 shadow-lg border-t border-primary-600`}
      >
        <div className="container mx-auto px-4">
          {/* Desktop Menu */}
          <ul className="hidden lg:flex lg:items-center justify-between py-2 lg:py-0">
            {MAIN_MENU.map((item) => {
              const isActive =
                location.pathname.startsWith(item.path) && item.path !== "/";
              const isHomeActive =
                item.path === "/" && location.pathname === "/";
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li
                  key={item.id}
                  className="relative group lg:static xl:relative"
                >
                  {hasChildren ? (
                    <>
                      <div
                        className={`
                                flex items-center justify-between cursor-pointer px-3 py-3.5 text-[13px] uppercase font-bold border-b-4 border-transparent hover:bg-white/10 hover:border-secondary-400 transition-all
                                ${
                                  isActive || isHomeActive
                                    ? "bg-white/10 border-secondary-500 text-secondary-300"
                                    : "text-gray-100"
                                }
                            `}
                      >
                        <Link
                          to={item.path}
                          className="flex-grow tracking-wide"
                        >
                          {item.title}
                        </Link>
                        <ChevronDown
                          size={14}
                          className="ml-1 lg:block hidden group-hover:rotate-180 transition-transform duration-200 opacity-70"
                        />
                      </div>

                      <div className="hidden lg:group-hover:block absolute left-0 top-full bg-white shadow-2xl rounded-b-lg w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200 border-t-4 border-secondary-500 ring-1 ring-black/5">
                        <ul className="py-2">
                          {item.children?.map((child: any) => (
                            <li key={child.id}>
                              <Link
                                to={!child.linkUrl ? child.path : child.linkUrl}
                                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 border-l-4 border-transparent hover:border-primary-500 transition-all"
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`block px-3 py-3.5 text-[13px] uppercase font-bold border-b-4 border-transparent hover:bg-white/10 hover:border-secondary-400 transition-all tracking-wide
                        ${
                          isActive || isHomeActive
                            ? "bg-white/10 border-secondary-500 text-secondary-300"
                            : "text-gray-100"
                        }
                        `}
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </nav>
      {/* Modals */}
      <UserInfoModal
        visible={showUserInfo}
        onHide={() => setShowUserInfo(false)}
        user={user}
      />
    </header>
  );
};

export default Header;
