import { api } from '../api';

export const formService = {
    async fetchForms(page: number = 1, limit: number = 10, type?: string, search?: string) {
        return api.get('/forms-new', {
            page,
            limit,
            ...(type ? { type } : {}),
            ...(search ? { search } : {}),
        });
    },

    async fetchFormById(id: string) {
        return api.get(`/forms-new/${id}`);
    },

    async createForm(data: any) {
        return api.post('/forms-new', data);
    },

    async updateForm(id: string, data: any) {
        return api.put(`/forms-new/${id}`, data);
    },

    async deleteForm(id: string) {
        return api.delete(`/forms-new/${id}`);
    }
};
