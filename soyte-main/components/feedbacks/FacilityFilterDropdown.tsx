import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import { socialFacilitiesService } from '@/services/socialFacilitiesService';

interface FacilityFilterDropdownProps {
  value: string[];
  onChange: (ids: string[]) => void;
  initialOptions?: FacilityOption[];
  onResolvedChange?: (options: FacilityOption[]) => void;
  placeholder?: string;
  filterPlaceholder?: string;
  type?: string;
  className?: string;
  panelClassName?: string;
  disabled?: boolean;
}

type FacilityItem = {
  id: string | number;
  name?: string;
  title?: string;
};

type FacilityOption = {
  label: string;
  value: string;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export const FacilityFilterDropdown: React.FC<FacilityFilterDropdownProps> = ({
  value,
  onChange,
  initialOptions = [],
  onResolvedChange,
  placeholder = 'Lọc theo đơn vị',
  filterPlaceholder = 'Tìm kiếm đơn vị...',
  type,
  className,
  panelClassName,
  disabled = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [knownOptions, setKnownOptions] = useState<Record<string, FacilityOption>>(() =>
    initialOptions.reduce<Record<string, FacilityOption>>((acc, option) => {
      acc[String(option.value)] = option;
      return acc;
    }, {}),
  );
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const panelElRef = useRef<HTMLElement | null>(null);
  const onScrollRef = useRef<((e: Event) => void) | null>(null);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (p: number, replace = false, search = debouncedSearch) => {
      if (loadingRef.current && !replace) return;
      if (!replace && !hasMoreRef.current) return;

      const requestId = ++requestIdRef.current;
      loadingRef.current = true;
      setLoading(true);

      try {
        const res = await socialFacilitiesService.fetchPaginated(
          p,
          PAGE_SIZE,
          type,
          search || undefined,
        );

        if (requestId !== requestIdRef.current) return;

        setItems((prev) => {
          const nextItems = (res.items || []) as FacilityItem[];
          const mergedItems = replace ? nextItems : [...prev, ...nextItems];
          const dedupedItems = Array.from(
            new Map<string, FacilityItem>(
              mergedItems.map((item) => [String(item.id), item]),
            ).values(),
          );

          setKnownOptions((prevOptions) => {
            const nextOptions = replace ? {} : { ...prevOptions };
            dedupedItems.forEach((item) => {
              const option = {
                label: item.name || item.title || `Đơn vị #${item.id}`,
                value: String(item.id),
              };
              nextOptions[option.value] = option;
            });
            return nextOptions;
          });

          const more = res.page < res.totalPages;
          hasMoreRef.current = more;
          setHasMore(more);
          return dedupedItems;
        });
        pageRef.current = res.page;
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('Không thể tải đơn vị:', err);
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [debouncedSearch, type],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (initialOptions.length === 0) return;

    setKnownOptions((prevOptions) => {
      const nextOptions = { ...prevOptions };
      initialOptions.forEach((option) => {
        nextOptions[String(option.value)] = option;
      });
      return nextOptions;
    });
  }, [initialOptions]);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    requestIdRef.current += 1;
    setItems([]);
    setHasMore(true);
    loadPage(1, true, debouncedSearch);
  }, [debouncedSearch, type, loadPage]);

  useEffect(() => {
    const missingIds = value.filter((id) => !knownOptions[String(id)]);

    if (missingIds.length === 0) return;

    let cancelled = false;

    Promise.all(
      missingIds.map(async (id) => {
        const facility = await socialFacilitiesService.getById(String(id));
        if (!facility?.id) return null;
        return {
          label: facility.name || facility.title || `Đơn vị #${facility.id}`,
          value: String(facility.id),
        } as FacilityOption;
      }),
    )
      .then((resolvedOptions) => {
        if (cancelled) return;
        setKnownOptions((prevOptions) => {
          const nextOptions = { ...prevOptions };
          resolvedOptions.filter(Boolean).forEach((option) => {
            nextOptions[option!.value] = option!;
          });
          return nextOptions;
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Không thể tải thông tin đơn vị đã chọn:', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [knownOptions, value]);

  const handleScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
        if (hasMoreRef.current && !loadingRef.current) {
          loadPage(pageRef.current + 1);
        }
      }
    },
    [loadPage],
  );

  const onShow = () => {
    setTimeout(() => {
      const selector = panelClassName
        ? `.p-multiselect-panel.${panelClassName} .p-multiselect-items-wrapper`
        : '.p-multiselect-panel .p-multiselect-items-wrapper';
      const overlay = document.querySelector(selector) as HTMLElement | null;
      if (overlay) {
        panelElRef.current = overlay;
        onScrollRef.current = handleScroll;
        overlay.addEventListener('scroll', handleScroll);
      }
    }, 0);
  };

  const onHide = () => {
    if (panelElRef.current && onScrollRef.current) {
      panelElRef.current.removeEventListener('scroll', onScrollRef.current);
    }
    panelElRef.current = null;
    onScrollRef.current = null;
  };

  const options = useMemo(() => {
    const selectedOptions = value
      .map((id) => knownOptions[String(id)])
      .filter(Boolean);

    const listedOptions = items
      .map((item) => knownOptions[String(item.id)])
      .filter(Boolean);

    return Array.from(
      new Map(
        [...selectedOptions, ...listedOptions].map((option) => [option.value, option]),
      ).values(),
    );
  }, [items, knownOptions, value]);

  const panelFooter = hasMore || loading ? (
    <div className="px-3 py-2 text-xs text-slate-500 text-center bg-slate-50 border-t border-slate-100">
      {loading ? (
        <span><i className="pi pi-spin pi-spinner mr-2" />Đang tải thêm...</span>
      ) : (
        <span>Cuộn xuống để tải thêm</span>
      )}
    </div>
  ) : (
    <div className="px-3 py-2 text-xs text-slate-400 text-center bg-slate-50 border-t border-slate-100">
      Đã tải hết danh sách
    </div>
  );

  return (
    <>
      <MultiSelect
        value={value || []}
        options={options}
        optionLabel="label"
      optionValue="value"
      onChange={(e) => {
        const nextIds = (e.value || []) as string[];
        const resolvedOptions = nextIds
          .map((id) => knownOptions[String(id)])
          .filter(Boolean);

        onChange(nextIds);
        onResolvedChange?.(resolvedOptions);
      }}
        placeholder={placeholder}
        panelClassName={`facility-dd-panel ${panelClassName || ''}`}
        onShow={onShow}
        onHide={onHide}
        disabled={disabled}
        filter
        onFilter={(e) => setSearchText(e.filter || '')}
        filterPlaceholder={filterPlaceholder}
        className={className}
        emptyMessage="Không có đơn vị nào"
        emptyFilterMessage="Không tìm thấy đơn vị"
        panelFooterTemplate={panelFooter}
        maxSelectedLabels={2}
        selectedItemsLabel="Đã chọn {0} đơn vị"
        display="comma"
      />
      <style>{`
        .facility-dd-panel.p-multiselect-panel {
          border-radius: 1rem !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.18), 0 8px 16px -8px rgba(15, 23, 42, 0.08) !important;
          overflow: hidden;
          margin-top: 6px;
        }
        .facility-dd-panel .p-multiselect-header {
          background: #f8fafc;
          padding: 0.75rem !important;
          border-bottom: 1px solid #e2e8f0;
          gap: 0.5rem;
        }
        .facility-dd-panel .p-multiselect-filter-container {
          position: relative;
          flex: 1;
        }
        .facility-dd-panel .p-multiselect-filter {
          width: 100%;
          height: 40px;
          border-radius: 0.625rem !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          padding: 0 2.25rem 0 0.875rem !important;
          font-size: 0.875rem;
          color: #0f172a;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .facility-dd-panel .p-multiselect-filter::placeholder {
          color: #94a3b8;
        }
        .facility-dd-panel .p-multiselect-filter:focus,
        .facility-dd-panel .p-multiselect-filter:hover {
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12) !important;
          outline: none !important;
        }
        .facility-dd-panel .p-multiselect-filter-icon {
          right: 0.875rem;
          color: #94a3b8;
        }
        .facility-dd-panel .p-multiselect-close {
          color: #64748b;
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
        }
        .facility-dd-panel .p-multiselect-close:hover {
          background: #e2e8f0;
        }
        .facility-dd-panel .p-multiselect-items-wrapper {
          max-height: 300px !important;
          padding: 0.375rem;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .facility-dd-panel .p-multiselect-items-wrapper::-webkit-scrollbar {
          width: 6px;
        }
        .facility-dd-panel .p-multiselect-items-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .facility-dd-panel .p-multiselect-items {
          padding: 0 !important;
        }
        .facility-dd-panel .p-multiselect-item {
          padding: 0.5rem 0.75rem !important;
          margin: 0.125rem 0 !important;
          border-radius: 0.625rem !important;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          line-height: 1.4;
          transition: background-color 0.15s ease, color 0.15s ease;
          white-space: normal;
          gap: 0.625rem;
        }
        .facility-dd-panel .p-multiselect-item:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .facility-dd-panel .p-multiselect-item.p-highlight {
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%) !important;
          color: #1e3a8a !important;
          font-weight: 700 !important;
        }
        .facility-dd-panel .p-checkbox .p-checkbox-box {
          border-radius: 0.375rem !important;
          border: 1.5px solid #cbd5e1 !important;
          width: 1.125rem;
          height: 1.125rem;
        }
        .facility-dd-panel .p-checkbox .p-checkbox-box.p-highlight {
          background: #2563eb !important;
          border-color: #2563eb !important;
        }
        .facility-dd-panel .p-multiselect-empty-message {
          padding: 1.5rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
};
