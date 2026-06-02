import { api } from '../api';

/** Service cho các endpoint /api/surveys-new và /api/feedbacks-new */
export const surveyNewService = {
  // ── Surveys CRUD ─────────────────────────────────────────────────
  async fetchSurveys(
    page = 1,
    limit = 10,
    type?: string,
    status?: boolean,
    search?: string,
  ) {
    const res = await api.get('/surveys-new', {
      page,
      limit,
      ...(type ? { type } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(search ? { search } : {}),
    });
    // Normalise: backend trả { data: { items, total } } hoặc { items, total }
    return res?.data ?? res;
  },

  async createSurvey(data: {
    name: string;
    description?: string;
    status?: boolean;
    type?: string;
    dateFrom?: string | null;
    dateTo?: string | null;
    form_ids?: number[];
    facility_ids?: string[];
  }) {
    return api.post('/surveys-new', data);
  },

  async updateSurvey(
    id: number | string,
    data: {
      name?: string;
      description?: string;
      status?: boolean;
      dateFrom?: string | null;
      dateTo?: string | null;
      form_ids?: number[];
      facility_ids?: string[];
    },
  ) {
    return api.put(`/surveys-new/${id}`, data);
  },

  async deleteSurvey(id: number | string) {
    return api.delete(`/surveys-new/${id}`);
  },

  // ── Facilities of a survey ────────────────────────────────────────
  async getSurveyFacilities(surveyId: number | string) {
    const res = await api.get(`/surveys-new/${surveyId}/facilities`);
    return res?.data ?? res;
  },

  async setSurveyFacilities(surveyId: number | string, facilityIds: string[]) {
    return api.post(`/surveys-new/${surveyId}/facilities`, {
      facility_ids: facilityIds,
    });
  },

  // ── Facility submission status ───────────────────────────────────
  /** Trả về danh sách cơ sở + submitted: true/false cho 1 survey */
  async getSurveyFacilityStatus(surveyId: number | string): Promise<
    Array<{
      facility_id: string;
      name: string;
      category: string;
      address: string;
      submitted: boolean;
      feedback_count: number;
    }>
  > {
    const res = await api.get(
      `/feedbacks-new/survey/${surveyId}/facility-status`,
    );
    // backend trả { data: [...] } hoặc [...]
    const raw = res?.data ?? res;
    return Array.isArray(raw) ? raw : [];
  },
};
