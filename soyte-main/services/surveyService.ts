import { api } from '../api';

const fetchCache = new Map<string, Promise<any>>();

export const surveyService = {
  async fetchSurveys(page: number = 1, limit: number = 10, type?: string, status?: boolean, search?: string) {
    const cacheKey = `${page}-${limit}-${type || ""}-${status || ""}-${search || ""}`;

    if (fetchCache.has(cacheKey)) {
      return fetchCache.get(cacheKey);
    }

    const promise = api
      .get("/surveys", {
        page,
        limit,
        ...(type ? { type } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(search ? { search } : {}),
      })
      .then((res) => res.data);

    fetchCache.set(cacheKey, promise);

    // Xóa cache sau 2 giây để tránh dữ liệu cũ
    setTimeout(() => {
      fetchCache.delete(cacheKey);
    }, 2000);

    return promise;
  },

    async fetchSurveyById(id: string) {
        return api.get(`/surveys/${id}`);
    },

    async createSurvey(data: any) {
        return api.post('/surveys', data);
    },

    async updateSurvey(id: string, data: any) {
        return api.put(`/surveys/${id}`, data);
    },

    async deleteSurvey(id: string) {
        return api.delete(`/surveys/${id}`);
    }
};
