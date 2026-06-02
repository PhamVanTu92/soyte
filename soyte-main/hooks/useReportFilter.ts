import { useState, useMemo } from 'react';
import { getDefaultDates } from '@/utils/dateUtils';
import { useAuth } from '@/AuthContext';
import { useFacilities } from '@/hooks/useFacilities';

export type DateFilter = {
    startDate: string;
    endDate: string;
};

const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const useReportFilter = () => {
    const { user } = useAuth();
    const { facilities, loading: facilitiesLoading } = useFacilities();
    const [filterType, setFilterType] = useState('this_year');
    const [dateFilter, setDateFilter] = useState<DateFilter>(getDefaultDates());

    const handleFilterChange = (newType: string) => {
        setFilterType(newType);
        if (newType === 'custom') return;

        const now = new Date();
        const year = now.getFullYear();
        let start = new Date();
        let end = new Date();

        if (newType === 'this_month') {
            start = new Date(year, now.getMonth(), 1);
            end = new Date(year, now.getMonth() + 1, 0);
        } else if (newType === 'last_month') {
            start = new Date(year, now.getMonth() - 1, 1);
            end = new Date(year, now.getMonth(), 0);
        } else if (newType === 'first_half') {
            start = new Date(year, 0, 1);
            end = new Date(year, 5, 30);
        } else if (newType === 'this_year') {
            start = new Date(year, now.getMonth() - 11, 1);
            end = new Date(year, now.getMonth() + 1, 0);
        } else if (newType === 'second_half') {
            start = new Date(year, 6, 1);
            end = new Date(year, 11, 31);
        }

        setDateFilter({ startDate: formatDate(start), endDate: formatDate(end) });
    };

    const handleCustomDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
        if (date) {
            setDateFilter(prev => ({ ...prev, [field]: formatDate(date) }));
        }
    };

    const { finalUnit, finalUnitType, isFilterLoading } = useMemo(() => {
        if (!user || facilitiesLoading) {
            return { finalUnit: undefined, finalUnitType: undefined, isFilterLoading: true };
        }
        // Hỗ trợ cả unit_type và type tùy theo backend trả về
        const uTypeRaw = (user as any).unit_type || (user as any).type || "";
        const uType = uTypeRaw.toString().toUpperCase().trim() || undefined;
        const uUnit = user.unit || user.facility_id || "";

        // Luôn xử lý theo định dạng của Admin (chuỗi cách nhau dấu phẩy hoặc mảng)
        // Sử dụng Set để đảm bảo tính duy nhất khi đếm
        const unitsArray = uUnit && typeof uUnit === "string"
            ? uUnit.split(",").map(id => id.trim()).filter(id => id !== "")
            : (Array.isArray(uUnit) ? uUnit.map(id => String(id).trim()) : (uUnit ? [String(uUnit).trim()] : []));

        const uniqueUnits = Array.from(new Set(unitsArray));

        let fUnit: string | undefined = uniqueUnits.length > 0 ? uniqueUnits.join(',') : undefined;
        let fUnitType: string | undefined = uType;
        // Tính toán tổng số đơn vị thuộc loại hình này từ danh sách facilities động
        const totalUnitsForType = (uType && facilities.length > 0)
            ? facilities.filter(f => (f.type || "").toString().toUpperCase().trim() === uType).length
            : 0;
        // Nếu người dùng có quyền trên tất cả các đơn vị của loại hình đó (và danh sách hệ thống đã load) thì chỉ gửi unit_type để tối ưu hóa query
        if (uniqueUnits.length > 0 && totalUnitsForType > 0 && uniqueUnits.length >= totalUnitsForType) {
            fUnit = undefined;
        }

        return { finalUnit: fUnit, finalUnitType: fUnitType, isFilterLoading: false };
    }, [user, facilities, facilitiesLoading]);

    return {
        filterType,
        dateFilter,
        finalUnit,
        finalUnitType,
        isFilterLoading,
        handleFilterChange,
        handleCustomDateChange
    };
};
