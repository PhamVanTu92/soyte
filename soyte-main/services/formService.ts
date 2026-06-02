import { api } from '../api';

export const formService = {
    async fetchForms(page: number = 1, limit: number = 10, type?: string, search?: string) {
        return api.get('/forms', {
            page,
            limit,
            ...(type ? { type } : {}),
            ...(search ? { search } : {}),
        });
    },

    async fetchFormById(id: string) {
        return api.get(`/forms/${id}`);
    },

    async createForm(data: any) {
        return api.post('/forms', data);
    },

    async updateForm(id: string, data: any) {
        return api.put(`/forms/${id}`, data);
    },

    async deleteForm(id: string) {
        return api.delete(`/forms/${id}`);
    }
};
