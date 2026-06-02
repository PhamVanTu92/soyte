import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  Info, 
  ChevronRight, 
  Home, 
  PhoneCall,
  UserCheck,
  CreditCard,
  HeartPulse,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/prime';

const PROCEDURES = [
  {
    id: 1,
    title: "Cấp lại, đổi, điều chỉnh thông tin trên sổ BHXH, thẻ BHYT",
    description: "Áp dụng cho các trường hợp mất, hỏng hoặc cần thay đổi thông tin cá nhân trên thẻ/sổ.",
    icon: CreditCard,
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  {
    id: 2,
    title: "Đăng ký đóng, cấp thẻ BHYT đối với người chỉ tham gia BHYT",
    description: "Hỗ trợ người dân đăng ký tham gia BHYT hộ gia đình hoặc các đối tượng tự đóng.",
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100"
  },
  {
    id: 3,
    title: "Giải quyết hưởng chế độ thai sản",
    description: "Thủ tục xét duyệt và chi trả trợ cấp thai sản cho lao động nữ và nam có vợ sinh con.",
    icon: HeartPulse,
    color: "bg-pink-50 text-pink-600 border-pink-100"
  },
  {
    id: 4,
    title: "Giải quyết hưởng chế độ ốm đau",
    description: "Quy trình giải quyết trợ cấp cho người lao động nghỉ việc do ốm đau, tai nạn rủi ro.",
    icon: Stethoscope,
    color: "bg-orange-50 text-orange-600 border-orange-100"
  },
  {
    id: 5,
    title: "Giải quyết hưởng trợ cấp nghỉ DSPHSK sau ốm đau, thai sản, TNLĐ, BNN",
    description: "Chế độ dưỡng sức phục hồi sức khỏe sau khi điều trị hoặc hưởng chế độ bảo hiểm.",
    icon: ShieldCheck,
    color: "bg-violet-50 text-violet-600 border-violet-100"
  },
  {
    id: 6,
    title: "Thanh toán trực tiếp chi phí khám, chữa bệnh BHYT/Cấp giấy chứng nhận không cùng chi trả",
    description: "Giải quyết hoàn trả chi phí khi khám chữa bệnh không đúng tuyến hoặc tại cơ sở chưa kết nối.",
    icon: CreditCard,
    color: "bg-cyan-50 text-cyan-600 border-cyan-100"
  },
  {
    id: 7,
    title: "Giải quyết hưởng chế độ TNLĐ, BNN đối với trường hợp bị TNLĐ lần đầu",
    description: "Hỗ trợ thủ tục cho người lao động gặp tai nạn lao động hoặc bệnh nghề nghiệp lần đầu.",
    icon: Briefcase,
    color: "bg-red-50 text-red-600 border-red-100"
  },
  {
    id: 8,
    title: "Giải quyết hưởng chế độ TNLĐ, BNN cho trường hợp tái phát hoặc tiếp tục bị",
    description: "Quy trình cho người lao động đã từng bị và nay gặp lại sự cố lao động tương tự.",
    icon: Briefcase,
    color: "bg-slate-50 text-slate-600 border-slate-100"
  },
  {
    id: 9,
    title: "Giải quyết hưởng chế độ TNLĐ, BNN do thương tật, bệnh tật tái phát",
    description: "Giải quyết quyền lợi khi các vết thương cũ do tai nạn lao động tái phát gây ảnh hưởng sức khỏe.",
    icon: Briefcase,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100"
  }
];

const PolicyHealthInsurance = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProcedures = PROCEDURES.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans ">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
          <Link to="/" className="hover:text-primary-600 flex items-center gap-1">
            <Home size={14} /> Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <span className="text-primary-700">Chính sách - BHYT</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-primary-800 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 rotate-12">
          <ShieldCheck size={400} />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="bg-secondary-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4 inline-block shadow-lg">
                Dịch vụ công trực tuyến
              </span>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
                Chính sách & <br /> Bảo hiểm y tế
              </h1>
              <p className="text-primary-100 text-lg font-medium max-w-xl">
                Hướng dẫn thủ tục, quy trình giải quyết các chế độ bảo hiểm xã hội, bảo hiểm y tế dành cho nhân dân Thủ đô.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-2xl shrink-0 hidden lg:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-800 shadow-lg">
                  <PhoneCall size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest">Hotline hỗ trợ</p>
                  <h4 className="text-xl font-black">1900 9068</h4>
                </div>
              </div>
              <p className="text-xs text-primary-200 leading-relaxed italic">
                Giải đáp thắc mắc về BHYT <br /> 24/7 từ chuyên gia Sở Y tế.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Main List */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-4 mb-12">
          <div className="flex-grow flex items-center px-4 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-100 transition w-full">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thủ tục hành chính (Ví dụ: Thai sản, Cấp thẻ...)"
              className="w-full bg-transparent py-4 px-3 outline-none text-sm font-bold text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 px-6 py-4 bg-primary-50 rounded-2xl border border-primary-100 hidden sm:flex">
            <Info size={18} className="text-primary-600" />
            <span className="text-xs font-bold text-primary-800 uppercase tracking-tight">Có {filteredProcedures.length} thủ tục được niêm yết</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcedures.map((proc) => {
            const Icon = proc.icon;
            return (
              <div 
                key={proc.id} 
                className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-md hover:shadow-2xl hover:border-primary-100 hover:-translate-y-2 transition-all duration-500 group flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6 ${proc.color}`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight mb-3 group-hover:text-primary-700 transition-colors">
                  {proc.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-grow italic">
                  {proc.description}
                </p>
                <div className="flex gap-3 pt-6 border-t border-gray-50">
                  <Button 
                    label="Xem hướng dẫn" 
                    iconPos="right" 
                    icon={<ArrowRight size={14} />} 
                    className="flex-1 !bg-primary-600 hover:!bg-primary-700 !text-white"
                  />
                  <Button 
                    icon={<FileText size={18} />} 
                    outlined 
                    className="!border-gray-100 hover:!border-primary-600 !text-gray-400 hover:!text-primary-700"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {filteredProcedures.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] shadow-inner border border-dashed border-gray-200">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Không tìm thấy thủ tục nào phù hợp</h3>
            <p className="text-gray-500 mt-2">Vui lòng thử lại với từ khóa khác hoặc liên hệ tổng đài hỗ trợ.</p>
            <Button 
              label="Xóa tìm kiếm"
              onClick={() => setSearchTerm('')}
              text
              className="!text-primary-600"
            />
          </div>
        )}

        {/* Info Box */}
        <div className="mt-20 bg-gray-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute bottom-0 right-0 opacity-10 translate-y-1/4 translate-x-1/4">
             <Info size={300} />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
             <div className="lg:col-span-7 space-y-6">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Hệ thống tra cứu dữ liệu BHYT</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Để tra cứu giá trị sử dụng thẻ BHYT hoặc quá trình tham gia bảo hiểm xã hội, người dân có thể truy cập cổng dữ liệu quốc gia hoặc sử dụng ứng dụng VssID trên điện thoại di động.
                </p>
                <div className="flex flex-wrap gap-4">
                   <a href="#" className="bg-white text-gray-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition shadow-xl">Tra cứu thẻ BHYT</a>
                   <a href="#" className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition">Tra cứu mã số BHXH</a>
                </div>
             </div>
             <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                   <h4 className="text-3xl font-black text-secondary-500 mb-1">100%</h4>
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Cơ sở KCB nhận thẻ điện tử</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                   <h4 className="text-3xl font-black text-primary-400 mb-1">93.8%</h4>
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Tỷ lệ bao phủ BHYT Thủ đô</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyHealthInsurance;
