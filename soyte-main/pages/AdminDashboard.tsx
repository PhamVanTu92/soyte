import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle,
  FileEdit,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Delete,
} from "lucide-react";
import { api } from "../api";
import { SERVICE_CATEGORIES_FILTER } from "../constants";
import PostForm from "../components/PostForm";
import AdminLayout from "../components/AdminLayout"; // Import the new layout
import { ScrollableTable } from "../components/common/ScrollableTable";
import { TablePagination } from "../components/common/TablePagination";
import {
  getInitialPageFromUrl,
  usePageUrlSync,
} from "../hooks/usePageUrlSync";
import { Dropdown, Button } from "@/components/prime";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";

const AdminDashboard = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [param, setParam] = useState({
    page: getInitialPageFromUrl(),
    limit: 30,
  });
  usePageUrlSync(param.page);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useRef<Toast>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let endpoint = `/posts?page=${param.page}&limit=${param.limit}`;
      if (filterCategory !== "all") {
        endpoint += `&category_id=${filterCategory}`;
      }
      if (debouncedSearchTerm) {
        endpoint += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      const response = await api.get(endpoint);
      if (response && response.data && Array.isArray(response.data)) {
        const { data, meta } = response;
        const mapped = data.map((p: any) => ({
          ...p,
          imageUrl: p.image_url,
          createdAt: p.created_at,
          category: p.category_id,
        }));
        setPosts(mapped);
        setTotalPosts(meta.total);
        setTotalPages(Math.ceil(meta.total / param.limit));
      } else {
        setPosts([]);
        setTotalPosts(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error fetching posts",
      });
      setPosts([]);
      setTotalPosts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Debounce search term

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setParam((p) => ({ ...p, page: 1 }));
  }, [filterCategory, debouncedSearchTerm]);

  useEffect(() => {
    fetchPosts();
  }, [param, filterCategory, debouncedSearchTerm]);

  const handleDelete = async (id: string) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa bài viết này?",
      header: "Xác nhận",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const res = await api.delete(`/posts/${id}`);
          if (!res?.message) {
            toast.current?.show({
              severity: "success",
              summary: "Thành công",
              detail: "Bài viết đã được xóa",
            });
          }
          setPosts(posts.filter((p) => p.id !== id));
        } catch (error: any) {
          if (error.message && error.message.includes("API Error")) {
            toast.current?.show({
              severity: "error",
              summary: "Lỗi",
              detail: "Lỗi khi xóa bài viết",
            });
          }
          console.error(error);
        }
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setParam((p) => ({ ...p, page: newPage }));
    }
  };

  // Client-side filtering is no longer needed as search is server-side.
  const filteredPosts = posts;

  return (
    <AdminLayout title="Bài viết">
      <Toast ref={toast} />
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all transform hover:-translate-y-1 md:p-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Tổng bài viết
            </p>
            <h3 className="text-2xl font-black text-gray-800">{totalPosts}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all transform hover:-translate-y-1 md:p-6">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Đã xuất bản
            </p>
            <h3 className="text-2xl font-black text-gray-800">{totalPosts}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all transform hover:-translate-y-1 md:p-6">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <FileEdit size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Bản nháp
            </p>
            <h3 className="text-2xl font-black text-gray-800">
              {posts.filter((p) => p.status === "draft").length}
            </h3>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {/* <Button
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white shadow-xl shadow-secondary-100 transition-all transform hover:-translate-y-1 !bg-secondary-600 hover:!bg-secondary-700"
            label="SOẠN BÀI MỚI"
            icon={<Plus size={24} />}
          /> */}

          <Button
            onClick={() => {
              setEditingPost(null);
              setIsFormOpen(true);
            }}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
          >
            <Plus size={24} /> SOẠN BÀI MỚI
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-4 md:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 font-medium text-sm"
            />
          </div>
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <Filter className="text-gray-400" size={18} />
            <Dropdown
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={SERVICE_CATEGORIES_FILTER}
              optionLabel="title"
              optionValue="id"
              placeholder="Lọc danh mục"
              className="w-full lg:w-14rem"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <Loader2
                size={36}
                className="mx-auto mb-4 animate-spin text-primary-600"
              />
              <p className="text-[10px] font-bold uppercase text-gray-400">
                Đang tải dữ liệu bài viết...
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <FileText size={32} />
              </div>
              <p className="font-bold text-gray-400">
                Không tìm thấy bài viết nào phù hợp.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const category = SERVICE_CATEGORIES_FILTER.find(
                (c) => c.id === post.category,
              );

              return (
                <div key={post.id} className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      {post.imageUrl ? (
                        <img
                          crossOrigin="anonymous"
                          src={post.imageUrl}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      ) : (
                        <ImageIcon size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-bold text-gray-800">
                        {post.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs italic text-gray-400">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded border border-primary-100 bg-primary-50 px-2 py-1 text-[10px] font-black uppercase text-primary-700">
                      {category?.title || post.category || "Tin tức"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        post.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          post.status === "published"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      {post.status === "published" ? "Công khai" : "Bản nháp"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(post.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                    <Button
                      icon={<Edit3 size={18} />}
                      text
                      rounded
                      onClick={() => {
                        setEditingPost(post);
                        setIsFormOpen(true);
                      }}
                    />
                    <Button
                      icon={<Trash2 size={18} />}
                      text
                      rounded
                      severity="danger"
                      onClick={() => handleDelete(post.id)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <ScrollableTable className="hidden md:block">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Bài viết</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu bài viết...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const category = SERVICE_CATEGORIES_FILTER.find(
                    (c) => c.id === post.category,
                  );
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {post.imageUrl ? (
                              <img
                                crossOrigin="anonymous"
                                src={post.imageUrl}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate max-w-xs">
                              {post.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 truncate max-w-xs italic">
                              {post.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-primary-50 text-primary-700 border border-primary-100">
                          {category?.title || post.category || "Tin tức"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${post.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${post.status === "published"
                              ? "bg-green-500"
                              : "bg-gray-400"
                              }`}
                          ></div>
                          {post.status === "published"
                            ? "Công khai"
                            : "Bản nháp"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[11px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />{" "}
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5">
                            <Clock size={12} />{" "}
                            {new Date(post.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            icon={<Edit3 size={18} />}
                            text
                            rounded
                            onClick={() => {
                              setEditingPost(post);
                              setIsFormOpen(true);
                            }}
                          />
                          <Button
                            icon={<Trash2 size={18} />}
                            text
                            rounded
                            severity="danger"
                            onClick={() => handleDelete(post.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loading && filteredPosts.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FileText size={32} />
              </div>
              <p className="text-gray-400 font-bold">
                Không tìm thấy bài viết nào phù hợp.
              </p>
            </div>
          )}
        </ScrollableTable>

        {/* Pagination Controls */}
        <TablePagination
          displayInfo={
            <>
              Hiển thị <span className="font-bold">{posts.length}</span> trên{" "}
              <span className="font-bold">{totalPosts}</span> kết quả
            </>
          }
          pageSize={param.limit}
          onPageSizeChange={(size) =>
            setParam((prev) => ({ ...prev, limit: size }))
          }
          currentPage={param.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {isFormOpen && (
        <PostForm
          initialData={editingPost}
          onClose={() => setIsFormOpen(false)}
          onSave={() => {
            setIsFormOpen(false);
            fetchPosts();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
