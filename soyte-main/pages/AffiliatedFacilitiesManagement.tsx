import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import AdminLayout from "../components/AdminLayout";
import AffiliatedFacilityForm from "../components/AffiliatedFacilityForm";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { TablePagination } from "../components/common/TablePagination";
import {
  getInitialPageFromUrl,
  usePageUrlSync,
} from "../hooks/usePageUrlSync";
import { Button } from "@/components/prime";
import {
  affiliatedFacilitiesService,
  type AffiliatedFacility,
} from "../services/affiliatedFacilitiesService";

const AffiliatedFacilitiesManagement = () => {
  const [facilities, setFacilities] = useState<AffiliatedFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [params, setParams] = useState({
    page: getInitialPageFromUrl(),
    limit: 30,
  });
  usePageUrlSync(params.page);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<AffiliatedFacility | null>(
    null,
  );
  const toast = useRef<Toast>(null);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const response = await affiliatedFacilitiesService.getPaged(
        params.page,
        params.limit,
        debouncedSearchTerm,
      );
      setFacilities(response.items);
      setTotalItems(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error("Error fetching affiliated facilities:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách đơn vị trực thuộc",
      });
      setFacilities([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
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
    fetchFacilities();
  }, [params.page, params.limit, debouncedSearchTerm]);

  const currentRange = useMemo(() => {
    if (totalItems === 0 || facilities.length === 0) {
      return { from: 0, to: 0 };
    }

    const from = (params.page - 1) * params.limit + 1;
    const to = from + facilities.length - 1;
    return { from, to };
  }, [facilities.length, params.limit, params.page, totalItems]);

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

  const handleDelete = async (id: number | string) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa đơn vị trực thuộc này?",
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName:
        "!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700 !text-white !font-bold !px-5 !py-2.5 !rounded-lg !text-sm",
      rejectClassName:
        "!bg-white !border !border-gray-300 hover:!bg-gray-50 !text-gray-700 !font-bold !px-5 !py-2.5 !rounded-lg !text-sm",
      accept: async () => {
        try {
          await affiliatedFacilitiesService.delete(id);
          setParams((current) => {
            if (current.page > 1 && facilities.length === 1) {
              return { ...current, page: current.page - 1 };
            }
            return current;
          });
          if (!(params.page > 1 && facilities.length === 1)) {
            fetchFacilities();
          }
        } catch (error: any) {
          console.error("Delete affiliated facility error:", error);
          if (error.message && error.message.includes("API Error")) {
            toast.current?.show({
              severity: "error",
              summary: "Lỗi",
              detail: "Không thể xóa đơn vị trực thuộc",
            });
          }
        }
      },
    });
  };

  return (
    <AdminLayout title="Hệ thống y tế trực thuộc">
      <Toast ref={toast} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 mb-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Tổng đơn vị trực thuộc
            </p>
            <h3 className="text-2xl font-black text-gray-800">
              {totalItems}
            </h3>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingFacility(null);
            setIsFormOpen(true);
          }}
          className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
        >
          <Plus size={24} /> THÊM MỚI
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm đơn vị..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
        </div>

        <ScrollableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4">Logo</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-gray-400">
                    {debouncedSearchTerm
                      ? "Không tìm thấy đơn vị trực thuộc nào."
                      : "Chưa có đơn vị trực thuộc nào."}
                  </td>
                </tr>
              ) : (
                facilities.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <h4 className="font-bold text-gray-800 text-sm">
                        {item.name}
                      </h4>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        {item.logo ? (
                          <img
                            crossOrigin="anonymous"
                            src={item.logo}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          onClick={() => {
                            setEditingFacility(item);
                            setIsFormOpen(true);
                          }}
                        />
                        <Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          onClick={() => handleDelete(item.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>

        <TablePagination
          displayInfo={
            <>
              Hiển thị <span className="font-bold">{currentRange.from}</span>
              {" - "}
              <span className="font-bold">{currentRange.to}</span> trên{" "}
              <span className="font-bold">{totalItems}</span> đơn vị
            </>
          }
          pageSize={params.limit}
          onPageSizeChange={(size) =>
            setParams((current) => ({ ...current, limit: size }))
          }
          currentPage={params.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {isFormOpen && (
        <AffiliatedFacilityForm
          initialData={editingFacility}
          onClose={() => setIsFormOpen(false)}
          onSave={() => {
            setIsFormOpen(false);
            fetchFacilities();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AffiliatedFacilitiesManagement;
