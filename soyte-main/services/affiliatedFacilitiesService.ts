import { api } from "../api";

export type AffiliatedFacility = {
  id: number | string;
  name: string;
  logo: string;
};

type AffiliatedFacilitiesMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AffiliatedFacilitiesPagedResponse = {
  items: AffiliatedFacility[];
  meta: AffiliatedFacilitiesMeta;
};

const normalizeFacilities = (response: any): AffiliatedFacility[] => {
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

  return rawItems
    .map((item: any) => ({
      ...item,
      id: item.id,
      name: item.name || item.title || "",
      logo: item.logo || item.logo_url || item.image_url || "",
    }))
    .filter((item: AffiliatedFacility) => item.id && item.name);
};

const normalizeMeta = (
  response: any,
  fallback: { page?: number; limit?: number; total?: number } = {},
): AffiliatedFacilitiesMeta => {
  const total = Number(response?.meta?.total ?? fallback.total ?? 0);
  const limit = Number(response?.meta?.limit ?? fallback.limit ?? 10);
  const page = Number(response?.meta?.page ?? fallback.page ?? 1);
  const totalPages = Math.max(
    1,
    Number(
      response?.meta?.totalPages ?? Math.ceil(total / (limit || 10)) ?? 1,
    ),
  );

  return {
    total,
    page,
    limit,
    totalPages,
  };
};

export const affiliatedFacilitiesService = {
  getAll: async () => {
    const response = await api.get("/affiliated-facilities", { page: 1, limit: 1000 });
    return normalizeFacilities(response);
  },

  getPaged: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<AffiliatedFacilitiesPagedResponse> => {
    const response = await api.get("/affiliated-facilities", {
      page,
      limit,
      search: search || undefined,
    });
    const items = normalizeFacilities(response);

    return {
      items,
      meta: normalizeMeta(response, { page, limit, total: items.length }),
    };
  },

  create: async (data: Pick<AffiliatedFacility, "name" | "logo">) => {
    const response = await api.post("/affiliated-facilities", data);
    return response.data;
  },

  update: async (
    id: number | string,
    data: Pick<AffiliatedFacility, "name" | "logo">,
  ) => {
    const response = await api.put(`/affiliated-facilities/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await api.delete(`/affiliated-facilities/${id}`);
    return response.data;
  },
};
