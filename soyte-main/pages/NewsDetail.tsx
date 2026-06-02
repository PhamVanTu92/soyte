import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import {
  Calendar,
  Printer,
  ChevronRight,
  Home,
  ArrowLeft,
  Search,
  Eye,
  Facebook,
  Newspaper,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "../constants";
import { Button } from "@/components/prime";
// News Card for bottom grid
const BottomRelatedCard = ({ post }: { post: any }) => (
  <Link to={`/news/detail/${post.id}`} className="group flex flex-col gap-3">
    <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
      <img
        crossOrigin="anonymous"
        src={
          post.image ||
          post.image_url ||
          "https://picsum.photos/seed/" + post.id + "/400/250"
        }
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div>
      <h4 className="text-[14px] font-bold text-gray-800 leading-snug group-hover:text-red-700 transition-colors line-clamp-2">
        {post.title}
      </h4>
      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400 font-medium">
        <Clock size={12} />{" "}
        {new Date(post.date || post.created_at).toLocaleDateString("vi-VN")}
      </div>
    </div>
  </Link>
);

// Sidebar Related News Card
const RelatedNewsCard = ({ post }: { post: any }) => (
  <Link
    to={`/news/detail/${post.id}`}
    className="flex items-start gap-4 group p-3 -m-3 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <div className="w-24 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
      <img
        crossOrigin="anonymous"
        src={
          post.image ||
          post.image_url ||
          "https://picsum.photos/seed/" + post.id + "/200/150"
        }
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="flex-1">
      <h3 className="text-[13px] font-bold text-gray-800 leading-snug group-hover:text-red-700 transition-colors line-clamp-3">
        {post.title}
      </h3>
      <p className="text-[11px] text-gray-400 mt-1 font-medium italic">
        {new Date(post.date || post.created_at).toLocaleDateString("vi-VN")}
      </p>
    </div>
  </Link>
);

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const postData = await api.get(`/posts/${id}`);
        if (postData) {
          setPost(postData.data);

          // Fetch related posts by category
          if (postData.data.category_id) {
            const relatedResponse = await api.get("/posts", {
              category_id: postData.data.category_id,
              limit: 6,
              exclude: postData.id,
            });

            // Extract items correctly from API response
            const items = Array.isArray(relatedResponse.data)
              ? relatedResponse.data
              : relatedResponse.data?.data || [];
            setRelatedPosts(items);
          }
        } else {
          throw new Error("Không tìm thấy bài viết");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Không thể tải được bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);

  const category = SERVICE_CATEGORIES.find((c) => c.id === post?.category_id);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest text-center">
            Đang tải bài viết...
          </p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Search size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {error ? "Lỗi" : "Không tìm thấy"}
          </h2>
          <p className="text-gray-500">
            {error || "Bài viết bạn tìm không tồn tại hoặc đã bị xóa."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 transition-colors"
          >
            <ArrowLeft size={18} /> Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Link
              to="/"
              className="hover:text-red-600 flex items-center gap-1.5"
            >
              <Home size={14} /> Trang chủ
            </Link>
            <ChevronRight size={14} className="mx-2 text-gray-400" />
            <Link
              to={`/news/${category?.path?.split("/").pop() || "events"}`}
              className="hover:text-red-600 line-clamp-1"
            >
              {category?.title || "Tin tức"}
            </Link>
            <ChevronRight size={14} className="mx-2 text-gray-400" />
            <span className="text-red-600 line-clamp-1 max-w-[200px] md:max-w-none">
              Chi tiết
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <article>
              <header className="mb-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
                  {category && (
                    <span className="bg-red-700 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-tight">
                      {category.title}
                    </span>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 font-bold uppercase tracking-tight italic">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />{" "}
                      {new Date(post.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye size={13} /> {post.view_count || 0} lượt xem
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-6">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-gray-100 mb-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => window.print()}
                      icon={<Printer size={16} />}
                      label="In trang"
                      text
                      className="!text-xs !font-bold !text-gray-600 hover:!text-red-700"
                    />
                    <Button
                      onClick={() =>
                        window.open(
                          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                          "_blank",
                        )
                      }
                      icon={<Facebook size={16} />}
                      label="Chia sẻ"
                      text
                      className="!text-xs !font-bold !text-gray-600 hover:!text-blue-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">
                      Cỡ chữ:
                    </span>
                    <Button
                      onClick={() => setFontSize(Math.min(22, fontSize + 2))}
                      label="A+"
                      className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    />
                    <Button
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                      label="A-"
                      className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700"
                    />
                  </div>
                </div>
              </header>

              {post.summary && (
                <div className="mb-4 p-6 bg-gray-50 border-l-4 border-red-700 rounded-r-xl shadow-sm">
                  <p className="text-base md:text-lg font-bold text-gray-800 leading-relaxed italic">
                    {post.summary}
                  </p>
                </div>
              )}

              <div
                className="prose prose-lg max-w-none text-gray-900 leading-relaxed text-justify mb-12"
                style={{ fontSize: `${fontSize}px` }}
              >
                {post.image_url && (
                  <figure className="mb-4 text-center">
                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-md">
                      <img
                        crossOrigin="anonymous"
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-auto"
                      />
                    </div>
                  </figure>
                )}
                <div
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: post.content || "" }}
                />
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Nguồn:
                  </span>
                  <span className="text-sm font-black text-gray-800 uppercase">
                    Sở Y tế Hà Nội
                  </span>
                </div>
                <Link
                  to={`/news/${category?.path?.split("/").pop() || "events"}`}
                  className="flex items-center gap-2 text-red-700 font-black text-sm uppercase hover:underline"
                >
                  <ChevronLeft size={18} /> Quay lại danh mục
                </Link>
              </div>

              {/* Related Posts Grid within main content area */}
              <div className="mt-16 pt-12 border-t-2 border-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-red-700 rounded-full"></div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Bài viết cùng chuyên mục
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.slice(0, 3).map((p) => (
                    <BottomRelatedCard key={p.id} post={p} />
                  ))}
                </div>

                {relatedPosts.length > 3 && (
                  <ul className="mt-8 space-y-3 border-t border-gray-50 pt-6">
                    {relatedPosts.slice(3, 6).map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/news/detail/${p.id}`}
                          className="text-sm font-bold text-gray-700 hover:text-red-700 flex items-center gap-2 group"
                        >
                          <ChevronRight
                            size={14}
                            className="text-gray-300 group-hover:text-red-700 transition-colors"
                          />
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10 lg:sticky xl:top-64 lg:78  self-start">
            {relatedPosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-red-700">
                  <Newspaper size={20} className="text-red-700" />
                  <h3 className="font-black text-lg text-gray-900 uppercase tracking-tighter">
                    Tin mới nhận
                  </h3>
                </div>
                <div className="space-y-6">
                  {relatedPosts.slice(0, 4).map((p) => (
                    <RelatedNewsCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
