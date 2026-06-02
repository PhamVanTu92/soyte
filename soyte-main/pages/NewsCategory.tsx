import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { MAIN_MENU, SERVICE_CATEGORIES_FILTER } from "../constants";
import { api } from "../api";
import {
  ChevronRight,
  TrendingUp,
  Clock,
  Home as HomeIcon,
  Zap,
  ListOrdered,
  Loader2,
} from "lucide-react";

const NewsCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  // States for main stream (Infinite Scroll)
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // States for Sidebar
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [latestNews3, setLatestNews3] = useState<any[]>([]);
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [dbSpotlight, setDbSpotlight] = useState<any>(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Initial fetch for sidebar and spotlight
  useEffect(() => {
    const fetchSidebarData = async () => {
      setLoadingSidebar(true);
      try {
        // 1. Fetch Latest News (10 posts)
        const latestData = await api.get("/posts", {
          status: "published",
          limit: 10,
          order: "createdAt.desc",
        });
        const latestItems = Array.isArray(latestData.data)
          ? latestData.data
          : latestData.data?.data || [];
        setLatestNews(latestItems);
        setLatestNews3([...latestItems].sort(() => 0.5 - Math.random()).slice(0, 3));

        // 2. Fetch Spotlight (1 post)
        if (latestItems.length > 0) {
          setDbSpotlight(latestItems[0]);
        }

        // 3. Fetch Trending News (Random 5) 
        const trendingData = await api.get("/posts", {
          status: "published",
          limit: 30,
        });
        const allPosts = Array.isArray(trendingData.data)
          ? trendingData.data
          : trendingData.data?.data || [];
        const shuffled = [...allPosts].sort(() => 0.5 - Math.random());
        setTrendingNews(shuffled.slice(0, 5));
      } catch (err) {
        console.error("Error fetching sidebar data:", err);
      } finally {
        setLoadingSidebar(false);
      }
    };

    fetchSidebarData();
  }, []);

  // Fetch main news stream (Infinite Scroll)
  useEffect(() => {
    const fetchStreamPosts = async () => {
      setLoading(true);
      try {
        // Map category path to ID if needed
        const category = SERVICE_CATEGORIES_FILTER.find((c) =>
          c.path.includes(categoryId || ""),
        );
        const params: any = {
          status: "published",
          limit: 6,
          page: page,
          order: "createdAt.desc",
        };
        console.log(category);

        if (category) params.category_id = category.id;

        const response = await api.get("/posts", params);
        const newPosts = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        if (newPosts.length === 0) {
          setHasMore(false);
        } else {
          setNewsPosts((prev) => [...prev, ...newPosts]);
        }
      } catch (err) {
        console.error("Error fetching stream posts:", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamPosts();
  }, [page, categoryId]);

  // Reset stream when category changes
  useEffect(() => {
    setNewsPosts([]);
    setPage(1);
    setHasMore(true);
  }, [categoryId]);

  const categoryTitle =
    MAIN_MENU.find((m) => m.path.includes(categoryId || ""))?.title ||
    MAIN_MENU.flatMap((m) => m.children || []).find((c) =>
      c?.path.includes(categoryId || ""),
    )?.title ||
    "Tin tức y tế";

  const spotlightItem = dbSpotlight || [];

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800 pb-12">
      {/* 1. Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-xs text-gray-500 font-medium uppercase tracking-tight">
            <Link
              to="/"
              className="hover:text-primary-700 flex items-center gap-1"
            >
              <HomeIcon size={14} /> TRANG CHỦ
            </Link>
            <ChevronRight size={14} className="mx-2 text-gray-400" />
            <span className="text-red-700 font-bold">{categoryTitle}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        {categoryId === "events" && (
          <div className="space-y-10 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tin ảnh lớn bên trái */}
              <div className="lg:col-span-5 group cursor-pointer">
                <Link to={`/news/detail/${spotlightItem.id}`}>
                  <div className="overflow-hidden rounded-sm mb-4 relative bg-gray-100 shadow-sm">
                    <img
                      crossOrigin="anonymous"
                      src={spotlightItem.image_url || spotlightItem.image}
                      alt={spotlightItem.title}
                      className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight hover:text-red-700 mb-3 transition-colors">
                    {spotlightItem.title}
                  </h2>
                </Link>
              </div>

              {/* Tin mới nhận ở giữa */}
              <div className="lg:col-span-3 flex flex-col divide-y divide-gray-100">
                <div className="bg-gray-900 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest mb-4">
                  Tin Mới Nhận
                </div>
                {latestNews.slice(0, 4).map((item, idx) => (
                  <Link
                    key={idx}
                    to={`/news/detail/${item.id}`}
                    className="group py-4 flex flex-col gap-2 first:pt-0"
                  >
                    <h3 className="text-[13px] font-bold text-gray-800 line-clamp-3 group-hover:text-red-700 transition-colors">
                      • {item.title}
                    </h3>
                  </Link>
                ))}
              </div>

              {/* Tin đọc nhiều bên phải (Random) */}
              <div className="lg:col-span-4 bg-gray-50 border border-gray-200 rounded-sm overflow-hidden h-fit">
                <div className="bg-red-700 px-4 py-2.5">
                  <h3 className="text-white text-xs font-black uppercase flex items-center gap-2">
                    <TrendingUp size={16} /> Tin đọc nhiều
                  </h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  {loadingSidebar ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 bg-gray-200 rounded w-full"
                        ></div>
                      ))}
                    </div>
                  ) : (
                    trendingNews.map((item, idx) => (
                      <Link
                        key={idx}
                        to={`/news/detail/${item.id}`}
                        className="group flex gap-3 items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-[11px] font-black italic ${idx < 3 ? "text-red-600 bg-red-50" : "text-gray-400 bg-white"}`}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="text-[13px] font-bold text-gray-800 group-hover:text-red-600 leading-snug">
                          {item.title}
                        </h4>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {latestNews3.map((item) => (
                    <Link
                      key={item.id}
                      to={`/news/detail/${item.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded-sm shadow-sm bg-gray-100 mb-2">
                        <img
                          crossOrigin="anonymous"
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-red-700 transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. DANH SÁCH TIN TỨC CHÍNH BÊN DƯỚI (Infinite Scroll) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cột trái: Stream tin chính */}
          <div className="lg:col-span-8">
            <div className="mb-4 border-b-2 border-red-700 pb-1 flex justify-between items-end">
              <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter">
                {categoryTitle}
              </h2>
            </div>
            <div className="space-y-8">
              {newsPosts.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  ref={idx === newsPosts.length - 1 ? lastPostElementRef : null}
                  className="flex flex-col md:flex-row gap-6 pb-8 border-b border-gray-100 last:border-0 group cursor-pointer"
                >
                  <Link
                    to={`/news/detail/${item.id}`}
                    className="w-full md:w-[280px] aspect-[16/10] flex-shrink-0 overflow-hidden rounded-sm shadow-sm"
                  >
                    <img
                      crossOrigin="anonymous"
                      src={
                        item.image_url ||
                        "https://picsum.photos/seed/" + item.id + "/400/250"
                      }
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-red-700 transition-colors mb-3">
                      <Link to={`/news/detail/${item.id}`}>{item.title}</Link>
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {item.summary || item.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-gray-400 uppercase">
                      <Clock size={12} />{" "}
                      {new Date(
                        item.created_at || item.createdAt,
                      ).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-red-700" size={32} />
                </div>
              )}

              {!hasMore && newsPosts.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-bold uppercase tracking-widest">
                  --- Hết danh sách bài viết ---
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Sidebar bổ sung */}
          <div className="lg:col-span-4 space-y-10">
            <div>
              <div className="border-b-2 border-red-600 pb-1 mb-4">
                <h3 className="text-xl font-black text-red-600 uppercase flex items-center gap-2">
                  <Zap size={18} className="fill-current" /> Tiêu điểm y tế
                </h3>
              </div>
              {loadingSidebar ? (
                <div className="animate-pulse space-y-2">
                  <div className="bg-gray-200 h-32 w-full rounded"></div>
                  <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                </div>
              ) : (
                dbSpotlight && (
                  <Link
                    to={`/news/detail/${dbSpotlight.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-video rounded-sm overflow-hidden mb-3 shadow-md">
                      <img
                        crossOrigin="anonymous"
                        src={dbSpotlight.image_url || dbSpotlight.image}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt=""
                      />
                    </div>
                    <h4 className="text-[14px] font-black text-gray-900 group-hover:text-red-700 leading-tight">
                      {dbSpotlight.title}
                    </h4>
                  </Link>
                )
              )}
            </div>

            <div>
              <div className="border-b-2 border-slate-800 pb-1 mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                  <ListOrdered size={18} /> Tin mới nhất
                </h3>
              </div>
              <div className="space-y-4">
                {loadingSidebar ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 bg-gray-200 rounded w-full"
                      ></div>
                    ))}
                  </div>
                ) : (
                  latestNews.map((post, idx) => (
                    <Link
                      key={post.id}
                      to={`/news/detail/${post.id}`}
                      className="flex gap-3 group border-b border-gray-50 pb-3 last:border-0 last:pb-0 items-start"
                    >
                      <span className="text-[10px] font-black italic mt-1 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-sm bg-gray-50 text-gray-400">
                        {idx + 1}
                      </span>
                      <h4 className="text-[13px] font-bold text-gray-700 group-hover:text-primary-700 leading-snug">
                        {post.title}
                      </h4>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCategory;
