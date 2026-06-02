import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Phone,
  Navigation,
  Activity,
  Info,
  HeartPulse,
  Users,
  Building,
  Home as HomeIcon,
  ChevronLeft,
  Ambulance,
  Hospital,
  SlidersHorizontal,
  List,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/prime";
import { socialFacilitiesService } from "@/services/socialFacilitiesService";
import { Sidebar } from "primereact/sidebar";
import { Dialog } from "primereact/dialog";
import "../styles/index.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HANOI_CENTER: [number, number] = [21.0285, 105.8542];
const HANOI_BOUNDS: L.LatLngBoundsExpression = [
  [20.53, 105.28],
  [21.39, 106.02],
];

const createCustomIcon = (type: string, isSelected = false) => {
  let colorClass = "bg-gray-500";
  if (type === "BV") colorClass = "bg-red-600";
  if (type === "TT") colorClass = "bg-blue-600";
  if (type === "BT") colorClass = "bg-emerald-600";
  if (type === "PB") colorClass = "bg-violet-600";
  if (type === "CC") colorClass = "bg-amber-600";
  if (type === "TYT") colorClass = "bg-cyan-600";

  const size = isSelected ? "w-10 h-10" : "w-8 h-8";
  const ring = isSelected
    ? "ring-4 ring-white shadow-[0_0_20px_rgba(0,0,0,0.4)]"
    : "border-2 border-white shadow-lg";

  return L.divIcon({
    className: `custom-map-marker ${isSelected ? "z-[1000]" : "z-10"}`,
    html: `<div class="${colorClass} ${size} ${ring} rounded-full flex items-center justify-center transition-all duration-300 ease-in-out">
            <div class="w-2 h-2 bg-white rounded-full ${isSelected ? "animate-ping" : ""}"></div>
           </div>`,
    iconSize: isSelected ? [40, 40] : [32, 32],
    iconAnchor: isSelected ? [20, 20] : [16, 16],
    popupAnchor: [1, -34],
  });
};

interface Facility {
  id: string;
  name: string;
  type: "BV" | "TT" | "BT" | "PB" | "CC" | "TYT";
  address: string;
  phone: string;
  coords: [number, number];
  description: string;
  category: string;
}

const mapItem = (item: any): Facility => ({
  id: String(item.id),
  name: item.name,
  type: item.type as Facility["type"],
  address: item.address,
  phone: item.phone || "",
  coords:
    item.latitude && item.longitude
      ? [Number(item.latitude), Number(item.longitude)]
      : (null as any),
  description: item.description || "",
  category: item.category || "",
});

const getTypeStyle = (type: string) => {
  switch (type) {
    case "BV": return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <HeartPulse size={14} /> };
    case "TT": return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: <Activity size={14} /> };
    case "BT": return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Users size={14} /> };
    case "PB": return { color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", icon: <Building size={14} /> };
    case "CC": return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <Ambulance size={14} /> };
    case "TYT": return { color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", icon: <Hospital size={14} /> };
    default: return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: <Info size={14} /> };
  }
};

const MapEventHandler = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1.5 });
  }, [coords, map]);
  return null;
};

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const HanoiSystem = () => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "BV" | "TT" | "BT" | "PB" | "CC" | "TYT">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isMobile = useResponsive();
  const [sheetVisible, setSheetVisible] = useState(true);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Refs cho scroll containers (stable DOM elements)
  const desktopListRef = useRef<HTMLDivElement>(null);
  const mobileListRef = useRef<HTMLDivElement>(null);

  // Ref để đọc state mới nhất trong scroll handler mà không cần recreate listener
  const stateRef = useRef({ hasMore, loadingMore, loading, page });
  stateRef.current = { hasMore, loadingMore, loading, page };
  const queryRef = useRef({ filterType, debouncedSearch });
  queryRef.current = { filterType, debouncedSearch };

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchFacilities = useCallback(async (pageNum: number, reset: boolean, ft: string, ds: string) => {
    if (reset) {
      stateRef.current.loading = true;
      setLoading(true);
    } else {
      stateRef.current.loadingMore = true;
      setLoadingMore(true);
    }

    try {
      const result = await socialFacilitiesService.fetchPaginated(
        pageNum,
        20,
        ft !== "ALL" ? ft : undefined,
        ds.trim() || undefined,
      );
      const mapped = result.items.map(mapItem);
      setFacilities((prev) => (reset ? mapped : [...prev, ...mapped]));
      setHasMore(pageNum < result.totalPages);
      setPage(pageNum);
      setTotal(result.total);
      stateRef.current.hasMore = pageNum < result.totalPages;
      stateRef.current.page = pageNum;
    } catch (err) {
      console.error("Error fetching facilities:", err);
    } finally {
      if (reset) {
        stateRef.current.loading = false;
        setLoading(false);
      } else {
        stateRef.current.loadingMore = false;
        setLoadingMore(false);
      }
    }
  }, []);

  // Reset và fetch lại khi filter hoặc search thay đổi
  useEffect(() => {
    fetchFacilities(1, true, filterType, debouncedSearch);
  }, [filterType, debouncedSearch, fetchFacilities]);

  // Hàm load more — đọc state qua ref để tránh stale closure
  const tryLoadMore = useCallback(() => {
    const { hasMore, loadingMore, loading, page } = stateRef.current;
    if (hasMore && !loadingMore && !loading) {
      const { filterType: currentFilter, debouncedSearch: currentSearch } =
        queryRef.current;
      fetchFacilities(page + 1, false, currentFilter, currentSearch);
    }
  }, [fetchFacilities]);

  const ensureScrollableContent = useCallback(() => {
    const listEl = isMobile ? mobileListRef.current : desktopListRef.current;
    if (!listEl) return;

    const { hasMore, loadingMore, loading } = stateRef.current;
    const contentShorterThanViewport =
      listEl.scrollHeight <= listEl.clientHeight + 20;

    if (hasMore && !loadingMore && !loading && contentShorterThanViewport) {
      tryLoadMore();
    }
  }, [isMobile, tryLoadMore]);

  // Scroll listener cho desktop list
  useEffect(() => {
    const el = desktopListRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
        tryLoadMore();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [tryLoadMore]);

  // Scroll listener cho mobile list
  useEffect(() => {
    const el = mobileListRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
        tryLoadMore();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [tryLoadMore]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(ensureScrollableContent);
    return () => window.cancelAnimationFrame(frame);
  }, [facilities, hasMore, isMobile, loading, loadingMore, ensureScrollableContent]);

  const handleMarkerClick = useCallback(
    (facility: Facility) => {
      setSelectedFacility(facility);
      if (isMobile) setSheetVisible(true);
    },
    [isMobile],
  );

  const FilterButtons = ({ inDialog = false }: { inDialog?: boolean }) => (
    <div className={inDialog ? "grid grid-cols-2 gap-2" : "flex gap-1.5 overflow-x-auto no-scrollbar pb-1"}>
      {[
        { id: "ALL", label: "Tất cả" },
        { id: "CC", label: "Chi cục" },
        { id: "TYT", label: "Trạm Y Tế" },
        { id: "BV", label: "Bệnh viện" },
        { id: "TT", label: "Trung tâm" },
        { id: "BT", label: "Trợ giúp" },
      ].map((btn) => (
        <Button
          key={btn.id}
          label={btn.label}
          onClick={() => {
            setFilterType(btn.id as any);
            if (inDialog) setFilterDialogVisible(false);
          }}
          className={`p-2 rounded-lg text-xs font-black uppercase tracking-tighter border transition-all w-full
            ${filterType === btn.id
              ? "!bg-primary-900 !text-white !border-primary-900 shadow-md"
              : "!bg-white !text-gray-600 !border-gray-200 hover:!bg-gray-100"
            }`}
        />
      ))}
    </div>
  );

  const renderFacilityItem = (fac: Facility) => {
    const style = getTypeStyle(fac.type);
    return (
      <div
        key={fac.id}
        onClick={() => handleMarkerClick(fac)}
        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-primary-50 transition-all flex gap-4 ${
          selectedFacility?.id === fac.id
            ? "bg-primary-50 border-l-4 border-l-primary-600"
            : "border-l-4 border-l-transparent"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300 ${
            selectedFacility?.id === fac.id ? "scale-110 shadow-lg" : ""
          } ${style.bg} ${style.color}`}
        >
          {style.icon}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-[13px] font-black text-gray-800 leading-tight mb-1">{fac.name}</h3>
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 italic leading-tight">{fac.address}</p>
          <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter border ${style.color} ${style.border} ${style.bg}`}>
            {fac.category}
          </span>
        </div>
      </div>
    );
  };

  const LoadingMore = () => (
    <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
      <Loader2 size={18} className="animate-spin text-primary-600" />
      <span className="text-xs font-bold">Đang tải thêm...</span>
    </div>
  );

  const FacilityDetail = ({ facility }: { facility: Facility }) => (
    <div className="bg-white h-full flex flex-col">
      <div className="bg-primary-900 p-4 text-white">
        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">
          {facility.category}
        </span>
        <h2 className="text-lg font-black mt-2 leading-tight uppercase">{facility.name}</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-4 text-[13px] text-gray-700">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="font-bold leading-tight text-gray-900">{facility.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-primary-600 shrink-0" />
            <span className="font-black text-primary-900 text-base">{facility.phone}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <Button
            label="Chỉ đường"
            icon={<Navigation size={16} />}
            className="!bg-primary-700 hover:!bg-primary-800 !text-white"
            onClick={() => {
              if (facility.coords) {
                const [lat, lng] = facility.coords;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
              }
            }}
          />
          <Button
            label="Gọi điện"
            icon={<Phone size={16} />}
            outlined
            className="!border-gray-200 hover:!border-primary-600 !text-gray-700"
            onClick={() => (window.location.href = `tel:${facility.phone}`)}
          />
        </div>
      </div>
      {isMobile && (
        <div className="p-4 mt-auto border-t border-gray-100">
          <Button
            label="Quay lại danh sách"
            icon={<ChevronLeft size={16} />}
            onClick={() => setSelectedFacility(null)}
            className="w-full"
            outlined
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-primary-700 hover:text-primary-800 font-bold bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition-all group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <HomeIcon size={16} />
            <span className="hidden md:inline">Trang chủ</span>
          </Link>
          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="bg-primary-700 p-1.5 rounded-lg text-white shadow-lg hidden sm:block">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-primary-900 uppercase leading-tight">
                Mạng lưới Y tế Hà Nội
              </h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                {loading ? "Đang tải dữ liệu..." : `Tổng ${total} cơ sở y tế`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden relative">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-full md:w-[420px] bg-white border-r border-gray-200 flex flex-col z-10 h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc địa chỉ..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-100 outline-none text-xs font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <FilterButtons />
            </div>

            {/* Scrollable list — ref gắn ở đây để listener ổn định */}
            <div ref={desktopListRef} className="flex-grow overflow-y-auto no-scrollbar bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 h-full text-gray-400">
                  <Loader2 size={32} className="animate-spin text-primary-600" />
                  <p className="text-xs font-bold uppercase">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <>
                  {facilities.map(renderFacilityItem)}
                  {loadingMore && <LoadingMore />}
                  {!hasMore && facilities.length > 0 && (
                    <p className="text-center text-[10px] text-gray-400 py-4 font-bold uppercase">
                      Đã hiển thị tất cả {facilities.length} cơ sở
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-grow relative bg-slate-200 overflow-hidden h-full z-0">
          <MapContainer
            center={HANOI_CENTER}
            zoom={13}
            minZoom={10}
            maxZoom={18}
            maxBounds={HANOI_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
            zoomControl={!isMobile}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEventHandler coords={selectedFacility?.coords || null} />
            {facilities
              .filter((fac) => fac.coords && fac.coords.length === 2)
              .map((fac) => (
                <Marker
                  key={fac.id}
                  position={fac.coords}
                  icon={createCustomIcon(fac.type, selectedFacility?.id === fac.id)}
                  eventHandlers={{ click: () => handleMarkerClick(fac) }}
                />
              ))}
          </MapContainer>

          {!isMobile && selectedFacility && (
            <div className="absolute bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-[1000] animate-in slide-in-from-bottom-5 border-2 border-primary-900/50">
              <FacilityDetail facility={selectedFacility} />
            </div>
          )}

          {isMobile && (
            <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
              <Button icon={<SlidersHorizontal size={20} />} rounded className="!w-12 !h-12 !shadow-lg" onClick={() => setFilterDialogVisible(true)} />
              <Button icon={<List size={20} />} rounded className="!w-12 !h-12 !shadow-lg" onClick={() => { setSelectedFacility(null); setSheetVisible(true); }} />
            </div>
          )}
        </div>

        {/* Mobile bottom sheet */}
        {isMobile && (
          <Sidebar
            visible={sheetVisible}
            onHide={() => setSheetVisible(false)}
            position="bottom"
            className="h-[50vh] w-full"
            showCloseIcon={false}
            blockScroll
          >
            <div className="h-full flex flex-col">
              {selectedFacility ? (
                <FacilityDetail facility={selectedFacility} />
              ) : (
                <>
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-primary-900 mb-2">
                      Danh sách cơ sở ({total})
                    </h2>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tìm theo tên hoặc địa chỉ..."
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-100 outline-none text-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <FilterButtons />
                  </div>

                  {/* Mobile scrollable list */}
                  <div ref={mobileListRef} className="flex-grow overflow-y-auto no-scrollbar bg-white">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 h-full text-gray-400">
                        <Loader2 size={24} className="animate-spin text-primary-600" />
                      </div>
                    ) : (
                      <>
                        {facilities.map(renderFacilityItem)}
                        {loadingMore && <LoadingMore />}
                        {!hasMore && facilities.length > 0 && (
                          <p className="text-center text-[10px] text-gray-400 py-4 font-bold uppercase">
                            Đã hiển thị tất cả {facilities.length} cơ sở
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </Sidebar>
        )}

        {isMobile && (
          <Dialog
            header="Lọc cơ sở y tế"
            visible={filterDialogVisible}
            style={{ width: "90vw" }}
            onHide={() => setFilterDialogVisible(false)}
          >
            <FilterButtons inDialog />
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default HanoiSystem;
