import { api } from "../api";

export type DatasetFieldDatatype =
  | "text"
  | "number"
  | "date"
  | "enum"
  | (string & {});

export type DatasetField = {
  name: string;
  datatype: DatasetFieldDatatype;
  values?: string[];
};

export type Dataset = {
  id: number;
  code: string;
  name: string;
  description: string;
  fields: DatasetField[];
  source_file?: string;
  total_records: number;
  created_at?: string;
  updated_at?: string;
};

export type DatasetRecord = {
  id: string | number;
  data: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type DatasetRecordsMeta = {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
};

export type DatasetRecordsResponse = {
  items: DatasetRecord[];
  meta: DatasetRecordsMeta;
};

export type DatasetRecordsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: "id" | "created_at" | "updated_at";
  sort_dir?: "ASC" | "DESC";
  filter?: Record<string, unknown>;
};

const normalizeDataset = (raw: any): Dataset => ({
  id: Number(raw?.id) || 0,
  code: String(raw?.code || ""),
  name: String(raw?.name || ""),
  description: String(raw?.description || ""),
  fields: Array.isArray(raw?.fields)
    ? raw.fields.map((field: any) => ({
        name: String(field?.name || ""),
        datatype: (String(field?.datatype || "text") as DatasetFieldDatatype),
        values: Array.isArray(field?.values)
          ? field.values.map((v: any) => String(v))
          : undefined,
      }))
    : [],
  source_file: raw?.source_file ? String(raw.source_file) : undefined,
  total_records: Number(raw?.total_records ?? 0),
  created_at: raw?.created_at ? String(raw.created_at) : undefined,
  updated_at: raw?.updated_at ? String(raw.updated_at) : undefined,
});

const normalizeRecord = (raw: any): DatasetRecord => ({
  id: raw?.id ?? "",
  data:
    raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)
      ? (raw.data as Record<string, unknown>)
      : {},
  created_at: raw?.created_at ? String(raw.created_at) : undefined,
  updated_at: raw?.updated_at ? String(raw.updated_at) : undefined,
});

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const datasetsService = {
  async list(): Promise<Dataset[]> {
    const response = await api.get("/datasets");
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return items.map(normalizeDataset).filter((dataset) => dataset.code);
  },

  async records(
    code: string,
    query: DatasetRecordsQuery = {},
  ): Promise<DatasetRecordsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const params: Record<string, unknown> = {
      page,
      limit,
      search: query.search || undefined,
      sort_by: query.sort_by || undefined,
      sort_dir: query.sort_dir || undefined,
    };
    if (query.filter && Object.keys(query.filter).length > 0) {
      params.filter = JSON.stringify(query.filter);
    }

    const response = await api.get(`/datasets/${code}/records`, params);
    const rawItems = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : [];

    const metaSource = response?.meta || response?.pagination || {};
    const total = toNullableNumber(metaSource.total);
    const totalPagesRaw =
      metaSource.total_pages ?? metaSource.totalPages ?? null;
    const totalPages = toNullableNumber(totalPagesRaw);

    return {
      items: rawItems.map(normalizeRecord),
      meta: {
        page: Number(metaSource.page ?? page),
        limit: Number(metaSource.limit ?? limit),
        total,
        totalPages,
      },
    };
  },

  async createRecord(code: string, data: Record<string, unknown>): Promise<any> {
    const response = await api.post(`/datasets/${code}/records`, { data });
    return response?.data || response;
  },

  async updateRecord(
    code: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<any> {
    const response = await api.put(`/datasets/${code}/records/${id}`, { data });
    return response?.data || response;
  },

  async deleteRecord(code: string, id: string | number): Promise<any> {
    const response = await api.delete(`/datasets/${code}/records/${id}`);
    return response?.data || response;
  },
};
