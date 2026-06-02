import React from "react";
import { Facebook, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/prime";

const Footer = () => {
  return (
    <footer className="bg-primary-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Column 1: Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 uppercase text-primary-100">
              Sở Y Tế Hà Nội
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <p className="flex items-start">
                <MapPin size={18} className="mr-2 mt-1 flex-shrink-0" />
                <span>Số 4, Sơn Tây, Ba Đình, Hà Nội</span>
              </p>
              <p className="flex items-center">
                <Phone size={18} className="mr-2 flex-shrink-0" />
                <span>0243 998 5765</span>
              </p>
              <p className="flex items-center">
                <Mail size={18} className="mr-2 flex-shrink-0" />
                <span>vanthu_soyt@hanoi.gov.vn</span>
              </p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  Bộ Y Tế
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Cổng thông tin Chính phủ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  UBND Thành phố Hà Nội
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Bảo hiểm xã hội Việt Nam
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Topics */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100">
              Chủ đề quan tâm
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  Lịch tiêm chủng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Danh sách nhà thuốc GPP
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Bác sĩ gia đình
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Phản ánh kiến nghị
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100">
              Đăng ký nhận tin
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Nhận thông báo về dịch bệnh và chính sách y tế mới nhất.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="px-3 py-2 text-gray-900 text-sm rounded-l focus:outline-none w-full"
              />
              <Button label="Gửi" className="!bg-secondary-600 hover:!bg-secondary-500 px-4 py-2 rounded-r !text-sm font-bold" />
            </div>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Youtube size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
