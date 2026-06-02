import { api } from "../api";

const getAllCache = new Map<string, Promise<any>>();

const normalizeFacilityList = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizePaginatedMeta = (
  response: any,
  fallback: { page?: number; limit?: number; total?: number } = {},
) => {
  const meta = response?.meta || response?.pagination || {};
  const page = Number(meta.page ?? meta.current_page ?? fallback.page ?? 1);
  const pageSize = Number(
    meta.pageSize ??
      meta.page_size ??
      meta.limit ??
      meta.per_page ??
      fallback.limit ??
      20,
  );
  const total = Number(
    meta.total ?? meta.total_items ?? meta.totalItems ?? fallback.total ?? 0,
  );
  const totalPages = Number(
    meta.totalPages ??
      meta.total_pages ??
      meta.lastPage ??
      meta.last_page ??
      (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1),
  );

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, totalPages || 1),
  };
};

export const socialFacilitiesService = {
  getAll: async (
    page: number = 1,
    limit: number = 10,
    type?: string,
    search?: string,
  ) => {
    const cacheKey = `${page}-${limit}-${type || ""}-${search || ""}`;

    if (getAllCache.has(cacheKey)) {
      return getAllCache.get(cacheKey);
    }

    const promise = api
      .get("/social-facilities", {
        page,
        limit,
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
      })
      .then((res) => res.data);

    getAllCache.set(cacheKey, promise);

    // Xóa cache sau 2 giây để tránh dữ liệu cũ nhưng vẫn đảm bảo giải quyết gán song song
    setTimeout(() => {
      getAllCache.delete(cacheKey);
    }, 2000);

    return promise;
  },
  fetchAll: async (type?: string, limit: number = 20, search?: string) => {
    const response = await api.get("/social-facilities", {
      page: 1,
      limit,
      ...(type ? { type } : {}),
      ...(search ? { search } : {}),
    });
    return normalizeFacilityList(response);
  },
  fetchAllPages: async (type?: string, search?: string) => {
    const firstResponse = await api.get("/social-facilities", {
      page: 1,
      limit: 20,
      ...(type ? { type } : {}),
      ...(search ? { search } : {}),
    });
    const firstItems = normalizeFacilityList(firstResponse);
    const totalPages = Number(firstResponse?.meta?.totalPages ?? 1);

    if (totalPages <= 1) return firstItems;

    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) =>
      api.get("/social-facilities", {
        page: i + 2,
        limit: 20,
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
      }).then(normalizeFacilityList),
    );

    const remainingPages = await Promise.all(pagePromises);
    return [...firstItems, ...remainingPages.flat()];
  },
  fetchPaginated: async (
    page: number = 1,
    limit: number = 20,
    type?: string,
    search?: string,
  ) => {
    const response = await api.get("/social-facilities", {
      page,
      limit,
      ...(type ? { type } : {}),
      ...(search ? { search } : {}),
    });
    const items = normalizeFacilityList(response);
    const meta = normalizePaginatedMeta(response, {
      page,
      limit,
      total: items.length,
    });
    return {
      items,
      page: meta.page,
      pageSize: meta.pageSize,
      total: meta.total,
      totalPages: meta.totalPages,
    };
  },
  getById: async (id: string) => {
    const response = await api.get(`/social-facilities/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post(`/social-facilities`, data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/social-facilities/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/social-facilities/${id}`);
    return response.data;
  },
};
