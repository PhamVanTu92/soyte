import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Siren, X, Home as HomeIcon, ChevronLeft } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/prime";
import { capcuu } from "@/constants";

// --- Types ---
interface AmbulanceUnit {
  id: string;
  plateNumber: string;
  status: "AVAILABLE" | "BUSY" | "RETURNING";
  coords: [number, number];
  driver: string;
  phone: string;
  hospital: string;
  speed: number;
}

interface Facility {
  id: string;
  name: string;
  type: "BV" | "TTYT";
  coords: [number, number];
}
 
const HANOI_CENTER: [number, number] = [21.005, 105.8];
const HANOI_BOUNDS: L.LatLngBoundsExpression = [
  [20.53, 105.28],
  [21.39, 106.02],
];

const createAmbulanceIcon = (status: string, rotation: number) => {
  let colorClass = "bg-blue-600";
  if (status === "BUSY") colorClass = "bg-red-600 animate-pulse";
  if (status === "RETURNING") colorClass = "bg-yellow-500";

  return L.divIcon({
    className: "amb-marker",
    html: `<div class="${colorClass} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="transform: rotate(${rotation}deg)">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 19-7-7 7-7"/><path d="M16 12H2"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const hospitalIcon = L.divIcon({
  className: "hospital-marker",
  html: `<div class="bg-white w-8 h-8 rounded-full border-2 border-red-500 shadow-md flex items-center justify-center text-red-600 font-bold">H</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const HOSPITALS: Facility[] = [
  { id: "H1", name: "BV Bạch Mai", type: "BV", coords: [21.0031, 105.8402] },
  { id: "H2", name: "BV Việt Đức", type: "BV", coords: [21.0315, 105.8465] },
  { id: "H3", name: "BV Xanh Pôn", type: "BV", coords: [21.0318, 105.8396] },
];


const generateAmbulances = (): AmbulanceUnit[] => {
  const units: AmbulanceUnit[] = [];
  for (let i = 1; i <= 20; i++) {
    const lat = HANOI_CENTER[0] + (Math.random() - 0.5) * 0.5;
    const lng = HANOI_CENTER[1] + (Math.random() - 0.5) * 0.6;
    units.push({
      id: `AMB-${i}`,
      plateNumber: `29A-${11500 + i}`,
      status: Math.random() > 0.7 ? "BUSY" : "AVAILABLE",
      coords: [lat, lng],
      driver: `Nguyễn Văn ${i}`,
      phone: `098.xxx.xxx`,
      hospital: "BV Bạch Mai",
      speed: Math.floor(Math.random() * 60),
    });
  }
  for (let i = 21; i <= 50; i++) {
    const lat = 21.001 + (Math.random() - 0.5) * 0.1;
    const lng = 105.8 + (Math.random() - 0.5) * 0.2;
    units.push({
      id: `AMB-${i}`,
      plateNumber: `29A-${11500 + i}`,
      status: Math.random() > 0.7 ? "BUSY" : "AVAILABLE",
      coords: [lat, lng],
      driver: `Nguyễn Văn ${i}`,
      phone: `098.xxx.xxx`,
      hospital: "BV Bạch Mai",
      speed: Math.floor(Math.random() * 60),
    });
  }  
  let index = 1
  if(index ==  1){
    console.log(units);
    index++
    
  } 
  return units;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const EmergencyCenter = () => {
  generateAmbulances()
  const [selectedUnit, setSelectedUnit] = useState<AmbulanceUnit | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Dashboard Header with Back Button */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all group"
          >
            <ChevronLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <HomeIcon size={16} />
            <span className="hidden md:inline">Trang chủ</span>
          </Link>
          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-red-200 shadow-lg">
              <Siren size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase text-gray-800 tracking-tight">
                Cấp cứu 115 Hà Nội
              </h1>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                TRỰC TUYẾN THỦ ĐÔ • {currentTime.toLocaleTimeString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="text-gray-700">
                {capcuu.filter((a) => a.status === "AVAILABLE").length} Rảnh
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              <span className="text-gray-700">
                {capcuu.filter((a) => a.status === "BUSY").length} Nhiệm vụ
              </span>
            </div>
          </div>
          <Button
            icon={<Phone size={18} />}
            className="!bg-red-600 hover:!bg-red-700 !text-white px-4 h-8"
          >
            <span className="ml-2 font-bold">Gọi 115</span>
          </Button>
        </div>
      </div>

      <div className="flex-grow flex relative overflow-hidden">
        <div className="relative w-full h-full bg-[#e5e7eb] z-10">
          <MapContainer
            center={HANOI_CENTER}
            zoom={13}
            minZoom={10}
            maxZoom={18}
            maxBounds={HANOI_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
          >
            <MapResizer />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {HOSPITALS.map((hospital) => (
              <Marker
                key={hospital.id}
                position={hospital.coords}
                icon={hospitalIcon}
              />
            ))}
            {capcuu.map((amb) => (
              <Marker
                key={amb.id}
                position={amb.coords as [number, number]}
                icon={createAmbulanceIcon(amb.status, 0)}
                eventHandlers={{ click: () => setSelectedUnit(amb) }}
              />
            ))}
          </MapContainer>

          {selectedUnit && (
            <div className="absolute top-4 right-4 w-72 bg-white rounded-xl shadow-2xl overflow-hidden z-[1001] border border-gray-100 animate-in slide-in-from-right-4">
              <div className="bg-blue-600 p-3 text-white flex justify-between items-center">
                <span className="font-bold">{selectedUnit.plateNumber}</span>
                <Button
                  icon={<X size={18} />}
                  text
                  rounded
                  onClick={() => setSelectedUnit(null)}
                  className="!text-white hover:!bg-white/20"
                />
              </div>
              <div className="p-4 space-y-3 text-sm">
                <p>
                  <strong>Tài xế:</strong> {selectedUnit.driver}
                </p>
                <p>
                  <strong>Bệnh viện:</strong> {selectedUnit.hospital}
                </p>
                <p>
                  <strong>Tốc độ:</strong> {selectedUnit.speed} km/h
                </p>
                <Button label="LIÊN LẠC" className="w-full !bg-blue-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyCenter;
