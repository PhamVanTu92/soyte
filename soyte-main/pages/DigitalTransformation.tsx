
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Laptop2, 
  FileText, 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  Database, 
  ShieldCheck,
  Smartphone,
  Server,
  Network,
  ChevronRight,
  Info
} from 'lucide-react';
// Standard Link import from react-router-dom
import { Link } from 'react-router-dom';

// --- Mock Data for Charts ---
const recordsByAgeData = [
  { name: '0-6 tuổi', value: 850000 },
  { name: '7-18 tuổi', value: 1200000 },
  { name: '19-35 tuổi', value: 2100000 },
  { name: '36-50 tuổi', value: 1800000 },
  { name: '51-65 tuổi', value: 1500000 },
  { name: 'Trên 65 tuổi', value: 950000 },
];

const examDataByLevel = [
  { name: 'Tuyến Thành phố', current: 12450, previous: 11200 },
  { name: 'Tuyến Quận/Huyện', current: 18600, previous: 17800 },
  { name: 'Tuyến Xã/Phường', current: 24500, previous: 21000 },
];

const digitalAdoptionData = [
  { name: 'Bệnh án điện tử', value: 85, color: '#0ea5e9' },
  { name: 'Kê đơn điện tử', value: 92, color: '#10b981' },
  { name: 'Thanh toán không tiền mặt', value: 78, color: '#f59e0b' },
  { name: 'Đặt lịch trực tuyến', value: 65, color: '#6366f1' },
];

const healthIndexProgress = [
  { month: 'T1', value: 45 },
  { month: 'T2', value: 52 },
  { month: 'T3', value: 48 },
  { month: 'T4', value: 61 },
  { month: 'T5', value: 75 },
  { month: 'T6', value: 82 },
  { month: 'T7', value: 88 },
  { month: 'T8', value: 91 },
];

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

const DigitalTransformation = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans ">
      {/* Header Section */}
      <div className="bg-primary-900 text-white pt-16 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none -translate-y-1/4 translate-x-1/4">
          <Database size={400} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-secondary-400 border border-white/20 shadow-xl">
                <Laptop2 size={36} />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Chuyển đổi số Y tế</h1>
                <p className="text-primary-200 text-lg font-medium">Hệ thống giám sát chỉ tiêu thông minh - Sở Y tế Hà Nội</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-2xl text-center">
                <p className="text-xs text-primary-300 font-bold uppercase tracking-widest mb-1">Dữ liệu cập nhật lúc</p>
                <p className="text-xl font-black text-secondary-400">10:45 • 15/01/2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          {[
            { label: 'Hồ sơ sức khỏe điện tử', value: '8.400.000', change: '+12.5%', icon: Users, label2: 'Hồ sơ sức khỏe điện tử', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Cơ sở y tế kết nối', value: '785', change: '+2.1%', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Lượt khám số hóa', value: '1.240.500', change: '+18.7%', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Tỷ lệ hài lòng', value: '94.2%', change: '+0.5%', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-5 transform hover:-translate-y-1 transition-all">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                <p className="text-xs font-bold text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp size={12} /> {kpi.change} <span className="text-gray-400 font-medium">so với tháng trước</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-primary-600" size={24} />
                Phân tích Lượt khám chữa bệnh theo tuyến
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><div className="w-2 h-2 bg-primary-500 rounded-full"></div> Kỳ này</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><div className="w-2 h-2 bg-gray-200 rounded-full"></div> Kỳ trước</span>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examDataByLevel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="current" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="previous" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Users className="text-secondary-600" size={24} />
              Hồ sơ theo độ tuổi
            </h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recordsByAgeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {recordsByAgeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <ShieldCheck className="text-amber-600" size={24} />
              Tỷ lệ triển khai hạ tầng số
            </h3>
            <div className="space-y-6">
              {digitalAdoptionData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="text-primary-600">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-primary-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  Các chỉ tiêu được tổng hợp từ báo cáo định kỳ của hơn 500 đơn vị y tế trên địa bàn Thành phố Hà Nội.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={24} />
                Tăng trưởng Hồ sơ sức khỏe (2025)
              </h3>
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                <option>Năm 2025</option>
                <option>Năm 2024</option>
              </select>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthIndexProgress}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTransformation;
