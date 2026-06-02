import { useState, useEffect } from 'react';
import { socialFacilitiesService } from '../services/socialFacilitiesService';

interface Facility {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
}

// Shared state outside the hook to provide data without a Provider component
let cachedFacilities: Facility[] | null = null;
let fetchPromise: Promise<Facility[]> | null = null;
const listeners = new Set<(f: Facility[]) => void>();

const notifyAll = (data: Facility[]) => {
    listeners.forEach(listener => listener(data));
};

export const useFacilities = () => {
    const [facilities, setFacilities] = useState<Facility[]>(cachedFacilities || []);
    const [loading, setLoading] = useState(!cachedFacilities);
    const [error, setError] = useState<any>(null);

    const refresh = async () => {
        try {
            setLoading(true);
            const response = await socialFacilitiesService.fetchAll();
            const data = Array.isArray(response) ? response : (response.items || response.data || []);
            cachedFacilities = data;
            setFacilities(data);
            notifyAll(data);
            setError(null);
            return data;
        } catch (err) {
            console.error('Failed to fetch facilities:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const listener = (data: Facility[]) => {
            setFacilities(data);
            setLoading(false);
        };
        listeners.add(listener);

        if (!cachedFacilities) {
            if (!fetchPromise) {
                fetchPromise = refresh();
            } else {
                fetchPromise.then(data => {
                    setFacilities(data);
                    setLoading(false);
                });
            }
        } else {
            setLoading(false);
        }

        return () => {
            listeners.delete(listener);
        };
    }, []);

    return { facilities, loading, error, refresh };
};
