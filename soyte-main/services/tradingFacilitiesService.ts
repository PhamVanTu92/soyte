import { api } from "../api";

export type TradingFacilityTradingType = "wholesale" | "retail";

export type TradingFacility = {
  id: number | string;
  certificate_number: string;
  name: string;
  person_in_charge: string;
  practice_certificate: string;
  facility_type: string;
  trading_type: TradingFacilityTradingType;
  address: string;
  issue_date: string;
  gps_number: string;
  gps_issue_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TradingFacilityStats = {
  total: number;
  wholesale: number;
  retail: number;
  active: number;
  inactive: number;
  byType: Array<{
    facility_type: string;
    count: number;
  }>;
};

type TradingFacilitiesMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TradingFacilitiesPagedResponse = {
  items: TradingFacility[];
  meta: TradingFacilitiesMeta;
};

export type TradingFacilitiesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  trading_type?: TradingFacilityTradingType;
  facility_type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
};

export type TradingFacilityPayload = Omit<
  TradingFacility,
  "id" | "created_at" | "updated_at"
>;

const normalizeItem = (item: any): TradingFacility => ({
  id: item?.id,
  certificate_number: item?.certificate_number || "",
  name: item?.name || "",
  person_in_charge: item?.person_in_charge || "",
  practice_certificate: item?.practice_certificate || "",
  facility_type: item?.facility_type || "",
  trading_type:
    item?.trading_type === "retail" ? "retail" : "wholesale",
  address: item?.address || "",
  issue_date: item?.issue_date || "",
  gps_number: item?.gps_number || "",
  gps_issue_date: item?.gps_issue_date || "",
  is_active:
    typeof item?.is_active === "boolean"
      ? item.is_active
      : String(item?.is_active).toLowerCase() === "true",
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

const normalizeList = (response: any): TradingFacility[] => {
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : [];

  return rawItems.map(normalizeItem).filter((item) => item.id);
};

const normalizeMeta = (
  response: any,
  fallback: { page?: number; limit?: number; total?: number } = {},
): TradingFacilitiesMeta => {
  const metaSource = response?.pagination || response?.meta || {};
  const total = Number(metaSource.total ?? fallback.total ?? 0);
  const limit = Number(metaSource.limit ?? fallback.limit ?? 10);
  const page = Number(metaSource.page ?? fallback.page ?? 1);
  const totalPages = Math.max(
    1,
    Number(metaSource.totalPages ?? Math.ceil(total / (limit || 10)) ?? 1),
  );

  return {
    total,
    page,
    limit,
    totalPages,
  };
};

const normalizeStats = (response: any): TradingFacilityStats => {
  const stats = response?.data || response || {};

  return {
    total: Number(stats.total ?? 0),
    wholesale: Number(stats.wholesale ?? 0),
    retail: Number(stats.retail ?? 0),
    active: Number(stats.active ?? 0),
    inactive: Number(stats.inactive ?? 0),
    byType: Array.isArray(stats.byType)
      ? stats.byType.map((item: any) => ({
          facility_type: item?.facility_type || "Khác",
          count: Number(item?.count ?? 0),
        }))
      : [],
  };
};

export const tradingFacilitiesService = {
  async getPaged(
    query: TradingFacilitiesQuery = {},
  ): Promise<TradingFacilitiesPagedResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const response = await api.get("/trading-facilities", {
      page,
      limit,
      search: query.search || undefined,
      trading_type: query.trading_type || undefined,
      facility_type: query.facility_type || undefined,
      is_active:
        typeof query.is_active === "boolean" ? query.is_active : undefined,
      sort_by: query.sort_by || undefined,
      sort_order: query.sort_order || undefined,
    });

    const items = normalizeList(response);

    return {
      items,
      meta: normalizeMeta(response, { page, limit, total: items.length }),
    };
  },

  async getStats(): Promise<TradingFacilityStats> {
    const response = await api.get("/trading-facilities/stats");
    return normalizeStats(response);
  },

  async getById(id: number | string): Promise<TradingFacility> {
    const response = await api.get(`/trading-facilities/${id}`);
    return normalizeItem(response?.data || response);
  },

  async create(payload: TradingFacilityPayload) {
    const response = await api.post("/trading-facilities", payload);
    return response?.data || response;
  },

  async update(id: number | string, payload: TradingFacilityPayload) {
    const response = await api.put(`/trading-facilities/${id}`, payload);
    return response?.data || response;
  },

  async delete(id: number | string) {
    const response = await api.delete(`/trading-facilities/${id}`);
    return response?.data || response;
  },
};
