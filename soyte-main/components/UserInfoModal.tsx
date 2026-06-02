import React from "react";
import { Dialog } from "primereact/dialog";
import { User, Mail, Shield, Calendar, Phone, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/prime";

interface UserInfoModalProps {
  visible: boolean;
  onHide: () => void;
  user: any;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ visible, onHide, user }) => {
  if (!user) return null;

  const infoItems = [
    { icon: <User size={18} />, label: "Họ và tên", value: user.full_name || "N/A" },
    { icon: <Mail size={18} />, label: "Email", value: user.email || "N/A" },
    { icon: <Shield size={18} />, label: "Vai trò", value: user.role === "admin" ? "Quản trị viên hệ thống" : "Người dùng" },
    { icon: <Phone size={18} />, label: "Số điện thoại", value: user.phone || "Chưa cập nhật" },
    { icon: <MapPin size={18} />, label: "Đơn vị", value: user.department || "Sở Y tế Hà Nội" },
    { icon: <Calendar size={18} />, label: "Ngày tham gia", value: user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A" },
  ];

  return (
    <Dialog
      header={<h2 className="text-2xl font-black text-[#003366] mt-2">Thông tin tài khoản</h2>}
      visible={visible}
      style={{ width: "500px" }}
      onHide={onHide}
      draggable={false}
      resizable={false}
      className="font-sans rounded-[32px] overflow-hidden shadow-2xl"
      headerClassName="px-10 pt-10 pb-4 border-none relative"
      contentClassName="px-10 pb-10"
      closable={true}
      closeIcon={<XCircle size={28} className="text-blue-500" />}
    >
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-28 h-28 bg-[#f0f9ff] rounded-full flex items-center justify-center shadow-inner border-4 border-white mb-4 relative">
             <div className="absolute inset-0 bg-blue-500/5 rounded-full animate-pulse"></div>
            <User size={56} className="text-[#0088cc] relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            {user.full_name || "Quản trị viên"}
          </h2>
          <p className="text-[11px] font-black text-[#0088cc] uppercase tracking-[0.2em] mt-2 bg-blue-50 px-4 py-1.5 rounded-full">
            {user.role === "admin" ? "Cán bộ quản trị" : "Nhân viên hệ thống"}
          </p>
        </div>

        <div className="bg-[#f8fafc] rounded-[28px] p-8 border border-gray-50 space-y-5 shadow-sm">
          {infoItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-5 group">
              <div className="bg-white p-3 rounded-2xl text-[#0088cc] shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-[15px] font-bold text-gray-700">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Button
            label="ĐÓNG CỬA SỔ"
            className="w-full !h-[64px] !bg-[#0088cc] !text-white font-black text-sm tracking-widest rounded-2xl hover:!bg-[#0077bb] transition-all shadow-xl shadow-blue-100 transform hover:-translate-y-0.5 border-none"
            onClick={onHide}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default UserInfoModal;
