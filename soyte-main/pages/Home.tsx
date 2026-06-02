import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  Zap,
  Radio,
  List,
  Play,
} from "lucide-react";
import {
  SERVICE_CATEGORIES,
  MOCK_NEWS,
  MOCK_VIDEOS,
  CATEGORIES,
} from "../constants";
import { Button } from "@/components/prime";
import heroSlide1 from "@/assets/image/anh1-CFkqSFx4.png";
import heroSlide2 from "@/assets/image/anh2-r7WidWql.jpg";
import HospitalSlider from "../components/HospitalSlider";
import { api } from "../api";
const Home = () => {
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };
  const [activeChannel, setActiveChannel] = useState("H1");
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const spotlightPost = dbPosts[0];
  const latestTenPosts = dbPosts.slice(1, 11);
  const tieuDiem = dbPosts.slice(1, 6);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(MOCK_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  type HeroSlide = { src: string; alt: string; href?: string };
  const [bannerSlides, setBannerSlides] = useState<HeroSlide[]>([]);
  const FALLBACK_SLIDES: HeroSlide[] = [
    { src: heroSlide2, alt: "Slide" },
    { src: heroSlide1, alt: "Slide" },
  ];
  const slides: HeroSlide[] =
    bannerSlides.length > 0 ? bannerSlides : FALLBACK_SLIDES;
  const CategoryColumn = ({
    title,
    Icon,
    iconColor,
    hoverColor,
    image,
    data,
    paddingClass = "",
  }: {
    title: string;
    Icon: React.ComponentType<{ className?: string; size?: number }>;
    iconColor: string;
    hoverColor: string;
    image: string;
    data: any[];
    paddingClass?: string;
  }) => {
    if (!data || data.length === 0) return null;
    const [first, ...rest] = data;
    return (
      <div className={`pt-6 md:pt-0 ${paddingClass}`}>
        <div className="mb-4 flex items-center gap-2">
          <Icon className={iconColor} size={20} />
          <h3 className="text-md font-bold text-primary-900 uppercase">
            {title}
          </h3>
        </div>

        <div className="group mb-4 cursor-pointer">
          <div className="mb-2">
            <img
              crossOrigin="anonymous"
              src={image}
              className="object-cover group-hover:scale-105 transition h-[200px] w-full"
              alt={first.title}
            />
          </div>
          <h4
            className={`font-bold text-gray-800 leading-snug group-hover:${hoverColor}`}
          >
            {first.title}
          </h4>
        </div>
        <ul className="space-y-3">
          {rest.map((item) => (
            <li
              key={item.id}
              className={`text-sm text-gray-600 border-t border-gray-100 pt-2 cursor-pointer line-clamp-2 hover:${hoverColor}`}
            >
              <Link to={`/news/detail/${item.id}`}>• {item.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1,
    );
  };
  const goToNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1,
    );
  };
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const response = await api.get("/posts");
        if (response && response.data && Array.isArray(response.data)) {
          const mappedPosts = response.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            content: p.content,
            imageUrl: p.image_url,
            category: p.category_id || "news-events",
            createdAt: p.created_at,
            isFeatured: p.is_featured,
          }));
          setDbPosts(mappedPosts);
        } else {
          useFallbacks();
        }
      } catch (err) {
        useFallbacks();
      } finally {
        setLoading(false);
      }
    };
    const fetchCategory = async () => {
      try {
        const postData = [
          {
            category_id: 3,
            limit: 3,
          },
          {
            category_id: 4,
            limit: 3,
          },
          {
            category_id: 5,
            limit: 3,
          },
          {
            category_id: 6,
            limit: 3,
          },
          {
            category_id: 7,
            limit: 3,
          },
          {
            category_id: 8,
            limit: 3,
          },
        ];
        const response = await api.post("/posts/by-categories", postData);
        if (response && response.data && Array.isArray(response.data)) {
          const postsByCategory = response.data.reduce(
            (acc: any, item: any) => {
              acc[item.category_id] = item.posts;
              return acc;
            },
            {} as Record<number, any[]>,
          );
          CATEGORIES.forEach((category) => {
            if (postsByCategory[category.id])
              category.data = postsByCategory[category.id];
          });
        } else {
          console.error("Không lấy được dữ liệu!");
        }
      } catch (err) {
        console.error(err);
      }
    };
    const useFallbacks = () => {
      setDbPosts(
        MOCK_NEWS.map((n) => ({
          id: n.id,
          title: n.title,
          summary: n.excerpt,
          imageUrl: n.image,
          category: n.category,
          createdAt: new Date().toISOString(),
        })),
      );
    };
    fetchLatestPosts();
    fetchCategory();
  }, []);
  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    let cancelled = false;
    // Resolve possibly-relative banner image URLs against the backend host.
    const resolveUrl = (url: string): string => {
      if (!url) return "";
      if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const backendRoot = apiUrl.replace(/\/api\/?$/, "");
      return `${backendRoot}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    api
      .getBanners({ position: "top", is_active: true })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || res;
        const list = (Array.isArray(data) ? data : [])
          .filter((b: any) => b.image_url)
          .sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          )
          .map((b: any) => ({
            src: resolveUrl(b.image_url),
            alt: b.title || "Banner",
            href: b.link_url || undefined,
          }));
        setBannerSlides(list);
        setCurrentImageIndex(0);
      })
      .catch((err) => {
        console.warn("Failed to load top banners:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 relative font-sans">
      <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-2 group">
        <div className="bg-white px-4 py-2 rounded-xl shadow-xl border-l-4 border-red-600 mb-2 animate-bounce origin-bottom-right hidden md:block">
          <p className="text-red-700 font-bold text-sm uppercase">
            Trung tâm Cấp cứu 115
          </p>
        </div>
        <Link
          to="/emergency"
          className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-red-600 rounded-full shadow-lg shadow-red-600/40 hover:bg-red-700 hover:scale-110 transition-all duration-300"
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
          <div className="relative z-10 flex flex-col items-center justify-center text-white">
            <Phone size={28} className="animate-tada" strokeWidth={2.5} />
            <span className="text-[10px] md:text-xs font-black mt-1"></span>
          </div>
        </Link>
      </div>

      <section className="relative bg-primary-900 text-white h-[450px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            crossOrigin="anonymous"
            src="https://picsum.photos/seed/banner/1920/600"
            alt="Medical Banner"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-900/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 z-10 relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="bg-secondary-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded">
              Thông điệp tuần
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Chăm sóc sức khỏe toàn dân <br />
              <span className="text-secondary-500">
                Nâng cao chất lượng cuộc sống
              </span>
            </h2>
            <p className="text-gray-300 text-lg max-w-xl">
              Hệ thống y tế thủ đô không ngừng đổi mới, áp dụng công nghệ số vào
              khám chữa bệnh và quản lý hồ sơ sức khỏe.
            </p>
            <div className="flex space-x-4 pt-4">
              <Link
                to="/health-records"
                className="bg-white text-primary-900 px-6 py-3 rounded font-bold hover:bg-gray-100 transition shadow-lg flex items-center"
              >
                Tra cứu Hồ sơ sức khỏe <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-lg shadow-2xl">
              <div className="font-bold mb-4 flex gap-2 items-center">
                <Activity className="text-secondary-500" />
                <span className="text-xl"> Số liệu hôm nay</span>
                <span className="text-sm"> (Số liệu giả lập)</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>Lượt khám bệnh</span>
                  <span className="font-bold text-2xl">12,450</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>Hồ sơ mới lập</span>
                  <span className="font-bold text-2xl text-secondary-400">
                    842
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span>Xe cấp cứu đang chạy</span>
                  <span className="font-bold text-2xl text-orange-400">45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative container p-0 h-[150px] overflow-hidden  mt-2  shadow-xl">
        {(() => {
          const slide = slides[currentImageIndex] || slides[0];
          if (!slide) return null;
          const img = (
            <img
              src={slide.src}
              alt={slide.alt}
              className="object-cover transition-opacity duration-1000 ease-in-out w-full h-full object-fill"
              onError={(e) => {
                console.warn("Banner image failed to load:", slide.src);
                e.currentTarget.style.opacity = "0";
              }}
            />
          );
          return slide.href ? (
            <a
              href={slide.href}
              target={slide.href.startsWith("http") ? "_blank" : "_self"}
              rel="noreferrer"
              className="block w-full h-full"
            >
              {img}
            </a>
          ) : (
            img
          );
        })()}
        {slides.length > 1 && (
          <div className=" absolute inset-0 flex items-center justify-between p-4">
            <Button
              icon={<ChevronLeft />}
              onClick={goToPrevious}
              text
              rounded
              className="!bg-black/50 !text-white w-10 h-10 rounded-full hover:!bg-black/75 transition ml-2 flex items-center justify-center"
            />
            <Button
              icon={<ChevronRight />}
              onClick={goToNext}
              text
              rounded
              className="!bg-black/50 !text-white w-10 h-10 rounded-full hover:!bg-black/75 transition mr-2 flex items-center justify-center"
            />
          </div>
        )}
      </section>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-primary-900 uppercase tracking-tight mb-4">
              Dịch vụ & Tiện ích
            </h3>
            <div className="w-24 h-1.5 bg-secondary-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={category.path}
                  className={`group p-6 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 ${category.containerClass}`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${category.iconBoxClass}`}
                  >
                    <Icon size={28} />
                  </div>
                  <h4
                    className={`font-bold text-sm uppercase leading-tight ${category.titleClass}`}
                  >
                    {category.title}
                  </h4>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-1 bg-red-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  <Zap className="text-red-600 fill-current" size={24} /> TIÊU
                  ĐIỂM Y TẾ
                </h3>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="bg-gray-200 aspect-video rounded-2xl w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-200 rounded w-full"></div>
                </div>
              ) : (
                spotlightPost && (
                  <Link
                    to={`/news/detail/${spotlightPost.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl mb-6">
                      <img
                        crossOrigin="anonymous"
                        src={spotlightPost.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={spotlightPost.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest mb-3 inline-block">
                          {SERVICE_CATEGORIES.find(
                            (c) => c.id === spotlightPost.category,
                          )?.title || "TIN TỨC"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
                          {spotlightPost.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed line-clamp-3 italic">
                      {spotlightPost.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs font-bold text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />{" "}
                        {new Date(spotlightPost.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                      <span className="text-red-600 hover:underline flex items-center gap-1">
                        Xem chi tiết <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                )
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">
                  MỚI CẬP NHẬT
                </h3>
                <Link
                  to="/news/events"
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  Tất cả bài viết
                </Link>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {loading
                  ? [...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                      <div className="flex-grow space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                  : latestTenPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/news/detail/${post.id}`}
                      className="flex gap-4 group border-b border-gray-50 pb-4 last:border-0 last:pb-0 items-start"
                    >
                      <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          crossOrigin="anonymous"
                          src={post.imageUrl}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          alt=""
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-red-600 line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <Clock size={12} />{" "}
                            {new Date(post.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-8 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4">
              <div className="mb-4 border-b-2 border-red-600 pb-1">
                <h3 className="text-xl font-bold text-red-600 uppercase flex items-center">
                  <span className="mr-2">★</span> Tiêu điểm
                </h3>
              </div>

              <div className="flex flex-col gap-5">
                {tieuDiem.map((news, idx) => (
                  <Link
                    key={news.id}
                    to={`/news/detail/${news.id}`}
                    className="flex gap-4 group items-start border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="w-24 h-16 flex-shrink-0 overflow-hidden rounded bg-gray-200 shadow-sm relative">
                      <img
                        crossOrigin="anonymous"
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 bg-red-600 text-white text-[10px] px-1 font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-gray-800 group-hover:text-red-600 leading-snug line-clamp-3 mb-1">
                        {news.title}
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        {news.date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: TRUYỀN HÌNH - PHÁT THANH - 8 Columns (2/3 Width) */}
            <div className="xl:col-span-8">
              <div className="mb-4 border-b-2 border-red-600 pb-1 flex justify-between items-end">
                <h3 className="text-xl font-bold text-red-600 uppercase flex items-center">
                  <Radio className="mr-2" size={20} /> Truyền hình - Phát thanh
                </h3>
                <Link
                  to="/media"
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Xem tất cả {">>"}
                </Link>
              </div>

              <div className="bg-[#0f172a] rounded-lg overflow-hidden shadow-xl border border-gray-800">
                <div className="flex bg-[#1e293b] border-b border-gray-700">
                  <div className="px-4 py-3 flex items-center text-white font-bold text-sm bg-gray-800 border-r border-gray-700">
                    <List size={16} className="mr-2" /> KÊNH
                  </div>
                  {["H1", "H2", "FM90", "JOYFM"].map((channel) => (
                    <Button
                      key={channel}
                      label={channel}
                      onClick={() => setActiveChannel(channel)}
                      className={`px-6 py-3 text-sm font-bold uppercase transition-colors relative
                              ${activeChannel === channel
                          ? "!text-red-500 !bg-[#0f172a]"
                          : "!text-gray-400 hover:!text-white hover:!bg-gray-800"
                        }`}
                    >
                      {activeChannel === channel && (
                        <span className="absolute top-0 left-0 right-0 h-0.5 bg-red-600"></span>
                      )}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row h-[450px]">
                  {/* Main Video Player (Wider) */}
                  <div
                    className="md:w-3/4 bg-black relative group cursor-pointer border-r border-gray-800"
                    onClick={() => !isPlaying && setIsPlaying(true)}
                  >
                    {isPlaying ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`${getEmbedUrl(currentVideo.videoUrl)}?autoplay=1`}
                        title={currentVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    ) : (
                      <>
                        <img
                          crossOrigin="anonymous"
                          src={currentVideo.thumbnail}
                          alt="Video cover"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Button
                            icon={
                              <Play
                                size={40}
                                fill="currentColor"
                                className="ml-1"
                              />
                            }
                            rounded
                            text
                            className="w-20 h-20 rounded-full !bg-red-600/90 !text-white flex items-center justify-center group-hover:scale-110 transition shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
                              Trực tiếp
                            </span>
                            <span className="text-gray-300 text-sm">
                              {currentVideo.date}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-2xl leading-tight line-clamp-2">
                            {currentVideo.title}
                          </h3>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Playlist Sidebar (Narrower) */}
                  <div className="md:w-1/4 bg-[#1e293b] overflow-y-auto no-scrollbar">
                    <div className="p-3">
                      {MOCK_VIDEOS.map((video, idx) => (
                        <div
                          key={video.id}
                          onClick={() => {
                            setCurrentVideo(video);
                            setIsPlaying(false);
                          }}
                          className={`flex flex-col gap-2 p-2 rounded cursor-pointer mb-2 transition border border-transparent
                                       ${currentVideo.id === video.id
                              ? "bg-gray-700 border-gray-600"
                              : "hover:bg-gray-800"
                            }
                                    `}
                        >
                          <div className="w-full aspect-video bg-gray-900 rounded overflow-hidden flex-shrink-0 relative">
                            <img
                              crossOrigin="anonymous"
                              src={video.thumbnail}
                              className="w-full h-full object-cover opacity-80"
                              alt=""
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded">
                              {video.duration}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h5
                              className={`text-xs font-bold leading-snug line-clamp-3 ${currentVideo.id === video.id
                                  ? "text-red-400"
                                  : "text-gray-300"
                                }`}
                            >
                              {video.title}
                            </h5>
                          </div>
                        </div>
                      ))}

                      <Link
                        to="/media"
                        className="block text-center text-xs text-gray-400 hover:text-white py-2 border-t border-gray-700 mt-2"
                      >
                        Xem tất cả
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {CATEGORIES.map((item) => (
              <CategoryColumn
                key={item.id}
                title={item.title}
                Icon={item.icon}
                iconColor={item.iconColor}
                hoverColor={item.hoverColor}
                image={item.image}
                data={item.data}
                paddingClass={item.paddingClass}
              />
            ))}
          </div>
        </div>
      </section>
      <HospitalSlider />
    </div>
  );
};

export default Home;
