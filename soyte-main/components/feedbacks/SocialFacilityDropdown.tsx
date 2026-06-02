import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown, DropdownProps } from "primereact/dropdown";
import { socialFacilitiesService } from "@/services/socialFacilitiesService";

export type SocialFacilityOption = {
  key: number | string;
  value: string;
};

interface SocialFacilityDropdownProps {
  value?: SocialFacilityOption | string | number | null;
  onChange: (option: SocialFacilityOption | null) => void;
  type?: string;
  initialOptions?: SocialFacilityOption[];
  placeholder?: string;
  filterPlaceholder?: string;
  className?: string;
  panelClassName?: string;
  disabled?: boolean;
  pt?: DropdownProps["pt"];
  emptyMessage?: string;
  emptyFilterMessage?: string;
  resetFilterOnHide?: boolean;
  restrictToValueId?: string | number | null;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const BASE_PANEL_CLASS = "social-facility-dropdown-panel";

export const SocialFacilityDropdown: React.FC<SocialFacilityDropdownProps> = ({
  value,
  onChange,
  type,
  initialOptions = [],
  placeholder = "Chọn",
  filterPlaceholder = "Tìm kiếm...",
  className,
  panelClassName,
  disabled,
  pt,
  emptyMessage = "Không có dữ liệu",
  emptyFilterMessage = "Không tìm thấy kết quả",
  resetFilterOnHide = true,
  restrictToValueId,
}) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [apiOptions, setApiOptions] = useState<SocialFacilityOption[]>([]);
  const [selectedOption, setSelectedOption] =
    useState<SocialFacilityOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const panelElRef = useRef<HTMLElement | null>(null);
  const onScrollRef = useRef<((event: Event) => void) | null>(null);

  const valueAsOption = useMemo(() => {
    if (value && typeof value === "object" && "key" in value) {
      return value as SocialFacilityOption;
    }
    return null;
  }, [value]);

  const selectedId = useMemo(() => {
    if (valueAsOption?.key !== undefined) return valueAsOption.key;
    if (value !== undefined && value !== null && typeof value !== "object") {
      return value;
    }
    return null;
  }, [value, valueAsOption]);

  const displayValueId = restrictToValueId ?? selectedId;
  const resolvedPanelClassName = [BASE_PANEL_CLASS, panelClassName]
    .filter(Boolean)
    .join(" ");

  const loadPage = useCallback(
    async (page: number, replace = false, search = debouncedSearch) => {
      if (loadingRef.current && !replace) return;
      if (!replace && !hasMoreRef.current) return;

      const requestId = ++requestIdRef.current;
      loadingRef.current = true;
      setLoading(true);

      try {
        const response = await socialFacilitiesService.fetchPaginated(
          page,
          PAGE_SIZE,
          type || undefined,
          search || undefined,
        );

        if (requestId !== requestIdRef.current) return;

        const nextItems = (response.items || []).map((facility: any) => ({
          key: facility.id,
          value: facility.name,
        }));
        const more = response.page < response.totalPages;

        pageRef.current = response.page;
        hasMoreRef.current = more;
        setHasMore(more);
        setApiOptions((prev) => {
          const merged = new Map<string, SocialFacilityOption>();
          (replace ? nextItems : [...prev, ...nextItems]).forEach((item) => {
            merged.set(String(item.key), item);
          });
          return Array.from(merged.values());
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error("Không thể tải danh sách đơn vị:", error);
        hasMoreRef.current = false;
        setHasMore(false);
        if (replace) {
          setApiOptions([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [debouncedSearch, type],
  );

  const handlePanelScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isNearBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 40;

      if (isNearBottom && hasMoreRef.current && !loadingRef.current) {
        loadPage(pageRef.current + 1, false);
      }
    },
    [loadPage],
  );

  const attachPanelScroll = useCallback(() => {
    window.setTimeout(() => {
      const overlay = document.querySelector(
        `.p-dropdown-panel.${BASE_PANEL_CLASS} .p-dropdown-items-wrapper`,
      ) as HTMLElement | null;

      if (!overlay) return;

      if (panelElRef.current && onScrollRef.current) {
        panelElRef.current.removeEventListener("scroll", onScrollRef.current);
      }

      panelElRef.current = overlay;
      onScrollRef.current = handlePanelScroll;
      overlay.addEventListener("scroll", handlePanelScroll);
    }, 0);
  }, [handlePanelScroll]);

  const detachPanelScroll = useCallback(() => {
    if (panelElRef.current && onScrollRef.current) {
      panelElRef.current.removeEventListener("scroll", onScrollRef.current);
    }
    panelElRef.current = null;
    onScrollRef.current = null;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);
    loadPage(1, true, debouncedSearch);
  }, [debouncedSearch, loadPage, type]);

  useEffect(() => {
    const targetId = displayValueId;

    if (!targetId) {
      setSelectedOption(null);
      return;
    }

    const mergedOptions = [...initialOptions, ...apiOptions];
    const matchedOption = mergedOptions.find(
      (option) => String(option.key) === String(targetId),
    );

    if (matchedOption) {
      setSelectedOption(matchedOption);
      return;
    }

    if (selectedOption && String(selectedOption.key) === String(targetId)) {
      return;
    }

    if (valueAsOption && String(valueAsOption.key) === String(targetId)) {
      setSelectedOption(valueAsOption);
    }

    let cancelled = false;

    socialFacilitiesService
      .getById(String(targetId))
      .then((facility) => {
        if (cancelled || !facility?.id) return;
        setSelectedOption({ key: facility.id, value: facility.name });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Không thể tải thông tin đơn vị đã chọn:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiOptions, displayValueId, initialOptions, selectedOption, valueAsOption]);

  useEffect(() => {
    return () => {
      detachPanelScroll();
    };
  }, [detachPanelScroll]);

  const options = useMemo(() => {
    const merged = new Map<string, SocialFacilityOption>();
    [...initialOptions, ...apiOptions].forEach((option) => {
      merged.set(String(option.key), option);
    });
    if (selectedOption) {
      merged.set(String(selectedOption.key), selectedOption);
    }
    if (valueAsOption) {
      merged.set(String(valueAsOption.key), valueAsOption);
    }

    const allOptions = Array.from(merged.values());

    if (restrictToValueId !== undefined && restrictToValueId !== null) {
      const matchedOption = allOptions.find(
        (option) => String(option.key) === String(restrictToValueId),
      );
      return matchedOption ? [matchedOption] : [];
    }

    return allOptions;
  }, [apiOptions, initialOptions, restrictToValueId, selectedOption, valueAsOption]);

  const panelFooter = (
    <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
      {loading ? (
        <span>
          <i className="pi pi-spin pi-spinner mr-2" />
          Đang tải...
        </span>
      ) : hasMore ? (
        <span>Cuộn xuống để tải thêm</span>
      ) : (
        <span>Đã tải hết danh sách</span>
      )}
    </div>
  );

  return (
    <Dropdown
      value={displayValueId ?? null}
      options={options}
      optionLabel="value"
      optionValue="key"
      placeholder={placeholder}
      filter
      disabled={disabled}
      filterPlaceholder={filterPlaceholder}
      panelClassName={resolvedPanelClassName}
      className={className}
      pt={pt}
      resetFilterOnHide={resetFilterOnHide}
      onShow={attachPanelScroll}
      onHide={() => {
        detachPanelScroll();
        setSearchText("");
      }}
      onFilter={(event) => setSearchText(event.filter)}
      panelFooterTemplate={panelFooter}
      emptyMessage={loading ? "Đang tải dữ liệu..." : emptyMessage}
      emptyFilterMessage={loading ? "Đang tìm kiếm..." : emptyFilterMessage}
      onChange={(event) => {
        const nextOption =
          options.find((option) => String(option.key) === String(event.value)) ||
          null;
        setSelectedOption(nextOption);
        onChange(nextOption);
      }}
    />
  );
};
