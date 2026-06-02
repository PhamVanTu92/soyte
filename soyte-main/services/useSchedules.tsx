import { useState, useCallback } from "react";
import { api } from "../api";
import { WorkSchedule } from "../types";

interface UseSchedulesResult {
  schedules: WorkSchedule[];
  loading: boolean;
  error: any;
  totalRecords: number;
  fetchSchedules: (filters?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  getScheduleById: (id: number) => Promise<WorkSchedule | null>;
  createSchedule: (
    schedule: Omit<WorkSchedule, "id" | "status" | "createdAt" | "updatedAt">,
  ) => Promise<WorkSchedule | null>;
  updateSchedule: (
    id: number,
    schedule: Partial<Omit<WorkSchedule, "id" | "createdAt" | "updatedAt">>,
  ) => Promise<WorkSchedule | null>;
  deleteSchedule: (id: number) => Promise<boolean>;
}

export const useSchedules = (): UseSchedulesResult => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchSchedules = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/schedules", filters); 
      setSchedules(data.data.schedules || []);
      setTotalRecords(data.data.totalItems || 0);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getScheduleById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data: WorkSchedule = await api.get(`/schedules/${id}`);
      return data;
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch schedule with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(
    async (
      schedule: Omit<WorkSchedule, "id" | "status" | "createdAt" | "updatedAt">,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data: WorkSchedule = await api.post("/schedules", schedule);
        setSchedules((prev) => [...prev, data]); // Add new schedule to the list
        return data;
      } catch (err) {
        setError(err);
        console.error("Failed to create schedule:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateSchedule = useCallback(
    async (
      id: number,
      schedule: Partial<Omit<WorkSchedule, "id" | "createdAt" | "updatedAt">>,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data: WorkSchedule = await api.put(`/schedules/${id}`, schedule);
        setSchedules((prev) => prev.map((s) => (s.id === id ? data : s))); // Update schedule in the list
        return data;
      } catch (err) {
        setError(err);
        console.error(`Failed to update schedule with ID ${id}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteSchedule = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id)); // Remove schedule from the list
      return true;
    } catch (err) {
      setError(err);
      console.error(`Failed to delete schedule with ID ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    schedules,
    loading,
    error,
    totalRecords,
    fetchSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
};
