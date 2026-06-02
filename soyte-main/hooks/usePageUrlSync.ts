import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const getInitialPageFromUrl = (defaultPage = 1): number => {
  if (typeof window === "undefined") return defaultPage;
  const params = new URLSearchParams(window.location.search);
  const raw = Number(params.get("page"));
  return Number.isInteger(raw) && raw > 0 ? raw : defaultPage;
};

export const usePageUrlSync = (page: number, defaultPage = 1): void => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (page === defaultPage) {
      next.delete("page");
    } else {
      next.set("page", String(page));
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [page, searchParams, setSearchParams, defaultPage]);
};
