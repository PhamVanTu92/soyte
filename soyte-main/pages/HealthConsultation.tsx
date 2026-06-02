import { useState, useEffect, useRef } from "react";
import {
  Video,
  MessageCircle,
  Calendar,
  Search,
  Star,
  MapPin,
  ShieldCheck,
  Activity,
  Stethoscope,
  Filter,
  User, 
  X, 
  ChevronRight, 
  Building2,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { Button } from "@/components/prime";

// --- Mock Data ---

interface Doctor {
  id: number;
  name: string;
  title: string; // GS, PGS, TS, BS...
  specialty: string;
  hospital: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  status: "ONLINE" | "BUSY" | "OFFLINE";
  price: string;
  experience: string;
}

const SPECIALTIES = [
  { id: "all", name: "Tất cả", icon: Activity },
  { id: "noi", name: "Nội khoa", icon: Stethoscope },
  { id: "nhi", name: "Nhi khoa", icon: User },
  { id: "san", name: "Sản phụ khoa", icon: Activity },
  { id: "tim", name: "Tim mạch", icon: Activity },
  { id: "da", name: "Da liễu", icon: ShieldCheck },
];

const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Nguyễn Thị Mai",
    title: "PGS.TS.BS",
    specialty: "Tim mạch",
    hospital: "Bệnh viện Tim Hà Nội",
    avatar:
      "https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg",
    rating: 4.9,
    reviewCount: 128,
    status: "ONLINE",
    price: "300.000đ",
    experience: "25 năm",
  },
  {
    id: 2,
    name: "Trần Văn Hùng",
    title: "TS.BS",
    specialty: "Nhi khoa",
    hospital: "Bệnh viện Xanh Pôn",
    avatar:
      "https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg",
    rating: 4.8,
    reviewCount: 85,
    status: "ONLINE",
    price: "200.000đ",
    experience: "15 năm",
  },
  {
    id: 3,
    name: "Lê Thu Hà",
    title: "ThS.BS",
    specialty: "Da liễu",
    hospital: "Bệnh viện Da Liễu Hà Nội",
    avatar:
      "https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg",
    rating: 4.7,
    reviewCount: 210,
    status: "BUSY",
    price: "250.000đ",
    experience: "10 năm",
  },
  {
    id: 4,
    name: "Phạm Quốc Khánh",
    title: "BSCKII",
    specialty: "Nội khoa",
    hospital: "Bệnh viện Thanh Nhàn",
    avatar:
      "https://img.freepik.com/free-photo/hospital-healthcare-workers-covid-19-treatment-concept-young-doctor-scrubs-making-daily-errands-clinic-listening-patient-symptoms-look-camera-professional-physician-curing-diseases_1258-57233.jpg",
    rating: 4.6,
    reviewCount: 45,
    status: "OFFLINE",
    price: "150.000đ",
    experience: "18 năm",
  },
  {
    id: 5,
    name: "Hoàng Tuấn Anh",
    title: "TS.BS",
    specialty: "Sản phụ khoa",
    hospital: "Bệnh viện Phụ Sản Hà Nội",
    avatar:
      "https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg",
    rating: 4.9,
    reviewCount: 320,
    status: "ONLINE",
    price: "350.000đ",
    experience: "22 năm",
  },
  {
    id: 6,
    name: "Vũ Thị Lan",
    title: "BSCKI",
    specialty: "Nhi khoa",
    hospital: "TTYT Đống Đa",
    avatar:
      "https://img.freepik.com/free-photo/female-doctor-hospital-with-stethoscope_23-2148827776.jpg",
    rating: 4.5,
    reviewCount: 30,
    status: "ONLINE",
    price: "Miễn phí",
    experience: "8 năm",
  },
];

const HealthConsultation = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] =
    useState<Doctor | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    specialty: "",
    date: "",
    reason: "",
  });
  const toast = useRef<Toast>(null);

  // Automatically show booking modal on mount
  useEffect(() => {
    setShowBookingModal(true);
  }, []);

  // Filter Logic
  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchSpecialty =
      activeTab === "all" ||
      (activeTab === "noi" && doc.specialty === "Nội khoa") ||
      (activeTab === "nhi" && doc.specialty === "Nhi khoa") ||
      (activeTab === "san" && doc.specialty === "Sản phụ khoa") ||
      (activeTab === "tim" && doc.specialty === "Tim mạch") ||
      (activeTab === "da" && doc.specialty === "Da liễu");

    const matchSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSpecialty && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONLINE":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
            Sẵn sàng tư vấn
          </span>
        );
      case "BUSY":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span> Đang bận
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span> Ngoại
            tuyến
          </span>
        );
    }
  };

  const handleOpenBooking = (doc: Doctor) => {
    setSelectedDoctorForBooking(doc);
    setBookingForm({ ...bookingForm, specialty: doc.specialty });
    setShowBookingModal(true);
  };

  const handleCloseBooking = () => {
    setShowBookingModal(false);
    setSelectedDoctorForBooking(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Toast ref={toast} />

      {/* 1. Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-800 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Kết nối Bác sĩ - Tư vấn Sức khỏe 24/7
          </h1>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto mb-4">
            Nền tảng khám bệnh từ xa chính thống của Sở Y tế Hà Nội. Kết nối
            trực tiếp qua Video Call với các bác sĩ đầu ngành.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-grow flex items-center px-4 py-2 bg-gray-50 rounded border border-transparent focus-within:bg-white focus-within:border-teal-500 transition">
              <Search className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Tìm bác sĩ, chuyên khoa, hoặc bệnh viện..."
                className="w-full bg-transparent outline-none text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              label="Tìm kiếm"
              className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded font-bold transition"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 2. Specialties Filter */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Filter size={20} className="text-teal-600" /> Chọn Chuyên khoa
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 pl-1">
            {SPECIALTIES.map((spec) => (
              <Button
                key={spec.id}
                onClick={() => setActiveTab(spec.id)}
                className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-xl border-2 transition-all duration-300
                            ${
                              activeTab === spec.id
                                ? "bg-teal-50 border-teal-600 text-teal-700 shadow-md scale-105"
                                : "bg-white border-gray-100 text-gray-500 hover:border-teal-200 hover:bg-white hover:text-teal-600"
                            }
                        `}
              >
                <div className="flex flex-col items-center">
                  <spec.icon size={28} className="mb-2" />
                  <span className="text-sm font-bold">{spec.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* 3. Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Top: Status Bar */}
              <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                {getStatusBadge(doctor.status)}
                <span className="text-xs font-bold text-gray-500 flex items-center">
                  <Star
                    size={12}
                    className="text-yellow-400 fill-current mr-1"
                  />{" "}
                  {doctor.rating} ({doctor.reviewCount})
                </span>
              </div>

              {/* Body: Info */}
              <div className="p-5 flex gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-teal-100 flex-shrink-0">
                  <img
                    crossOrigin="anonymous"
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">
                    {doctor.title} {doctor.name}
                  </h3>
                  <p className="text-teal-600 font-medium text-sm mb-1">
                    {doctor.specialty}
                  </p>
                  <p className="text-gray-500 text-xs flex items-center mb-2">
                    <MapPin size={12} className="mr-1" /> {doctor.hospital}
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block">
                    Kinh nghiệm: {doctor.experience}
                  </span>
                </div>
              </div>

              {/* Bottom: Actions */}
              <div className="mt-auto p-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleOpenBooking(doctor)}
                  label="Đặt lịch"
                  icon={<Calendar size={16} />}
                  outlined
                  className="!border-teal-600 !text-teal-700 hover:!bg-teal-50 p-2"
                />
                {doctor.status === "ONLINE" ? (
                  <Button
                    onClick={() => setSelectedDoctor(doctor)}
                    label="Tư vấn ngay"
                    icon={<Video size={16} />}
                    className="!bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-lg hover:from-teal-500 hover:to-emerald-500 animate-pulse-slow p-2"
                  />
                ) : (
                  <Button
                    label="Nhắn tin"
                    icon={<MessageCircle size={16} />}
                    disabled
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Connection Simulation Modal (Video Call) */}
      {selectedDoctor && !showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Video size={20} /> Phòng chờ Tư vấn
              </h3>
              <Button
                icon={<X size={20} />}
                text
                rounded
                onClick={() => setSelectedDoctor(null)}
                className="!text-white hover:!bg-white/20"
              />
            </div>

            <div className="p-6 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-teal-100 mx-auto mb-4 overflow-hidden relative">
                <img
                  crossOrigin="anonymous"
                  src={selectedDoctor.avatar}
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {selectedDoctor.title} {selectedDoctor.name}
              </h2>
              <p className="text-teal-600 font-medium mb-6">
                {selectedDoctor.hospital}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí tư vấn:</span>
                  <span className="font-bold text-gray-800">
                    {selectedDoctor.price} / 15 phút
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời gian chờ dự kiến:</span>
                  <span className="font-bold text-green-600">Ngay lập tức</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  label="Bắt đầu cuộc gọi"
                  icon={<Video size={20} />}
                  className="w-full px-2 !bg-teal-600 hover:!bg-teal-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-teal-500/30"
                />
                <p className="text-xs text-gray-400">
                  Bằng việc bắt đầu, bạn đồng ý với quy định khám chữa bệnh từ
                  xa của Bộ Y tế.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Booking Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-primary-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300 relative">
            {/* Close Button */}
            <Button
              icon={<X size={24} />}
              label="Đóng"
              onClick={handleCloseBooking}
              text
              className="absolute -top-12 right-0 !text-white hover:!text-secondary-400 transition"
            />

            <div className="p-8 md:p-12 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                  Đặt lịch khám{" "}
                </h2>

                {/* Display Doctor Info in Modal if selected */}
                {selectedDoctorForBooking && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-secondary-400 flex-shrink-0">
                      <img
                        crossOrigin="anonymous"
                        src={selectedDoctorForBooking.avatar}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-secondary-400 tracking-widest mb-0.5">
                        Bạn đang đặt với
                      </p>
                      <h4 className="text-sm font-bold">
                        {selectedDoctorForBooking.title}{" "}
                        {selectedDoctorForBooking.name}
                      </h4>
                      <p className="text-[10px] text-gray-300 flex items-center gap-1">
                        <Building2 size={10} />{" "}
                        {selectedDoctorForBooking.hospital}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Họ và tên */}
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-80">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Vui lòng nhập tên bạn tại đây"
                    className="w-full bg-white px-5 py-4 rounded-md text-gray-800 outline-none focus:ring-4 focus:ring-secondary-500/30 transition placeholder:text-gray-400 font-medium shadow-inner"
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-80">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Vui lòng nhập số điện thoại"
                    className="w-full bg-white px-5 py-4 rounded-md text-gray-800 outline-none focus:ring-4 focus:ring-secondary-500/30 transition placeholder:text-gray-400 font-medium shadow-inner"
                  />
                </div>

                {/* Chuyên khoa */}
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-80">
                    Chuyên khoa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white px-5 py-4 rounded-md text-gray-800 outline-none appearance-none focus:ring-4 focus:ring-secondary-500/30 transition font-medium shadow-inner"
                      value={bookingForm.specialty}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          specialty: e.target.value,
                        })
                      }
                    >
                      <option value="">Vui lòng chọn chuyên khoa</option>
                      {SPECIALTIES.filter((spec) => spec.id !== "all").map(
                        (spec) => (
                          <option key={spec.id} value={spec.name}>
                            {spec.name}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Ngày đặt lịch khám */}
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-80">
                    Ngày đặt lịch khám
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-white px-5 py-4 rounded-md text-gray-800 outline-none focus:ring-4 focus:ring-secondary-500/30 transition font-medium shadow-inner"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Lý do khám */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold opacity-80">
                    Lý do khám
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Vui lòng nhập tình trạng sức khỏe/nhu cầu thăm khám (nếu có)"
                    className="w-full bg-white px-5 py-4 rounded-md text-gray-800 outline-none focus:ring-4 focus:ring-secondary-500/30 transition placeholder:text-gray-400 font-medium shadow-inner resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div></div>
                <Button
                  label="Đặt lịch khám"
                  onClick={() => {
                    toast.current?.show({
                      severity: "success",
                      summary: "Thành công",
                      detail:
                        "Hệ thống đã ghi nhận lịch hẹn của bạn. Nhân viên y tế sẽ liên hệ lại sớm nhất.",
                      life: 3000,
                    });
                    handleCloseBooking();
                  }}
                  className="w-full md:w-auto px-16 py-4 border-2 border-white rounded-full text-xl font-bold hover:bg-white hover:text-primary-900 transition-all duration-300 shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthConsultation;
