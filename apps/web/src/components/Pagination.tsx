import { useMemo, useState } from "react";
import { SelectMenu } from "./SelectMenu";

export type PageItem = { id: string };

interface PaginationProps<T extends PageItem> {
  items: T[];
  searchKeys?: (keyof T)[];
  sortKey?: keyof T;
  sortDir?: "asc" | "desc";
  className?: string;
  label?: string;
  children: (pageItems: T[]) => React.ReactNode;
}

const PER_PAGE_OPTIONS = [5, 10, 15, 20];
const DEFAULT_PER_PAGE = 10;

export function Pagination<T extends PageItem>({
  items,
  searchKeys = [],
  sortKey,
  sortDir = "asc",
  className = "",
  label = "items",
  children,
}: PaginationProps<T>) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [query, setQuery] = useState("");
  const [editingPage, setEditingPage] = useState(false);
  const [pageDraft, setPageDraft] = useState("1");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q && searchKeys.length) {
      list = list.filter((item) =>
        searchKeys.some((k) => String(item[k] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === bv) return 0;
        const cmp = av < bv ? -1 : 1;
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return list;
  }, [items, query, searchKeys, sortKey, sortDir]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, maxPage);
  const start = (safePage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  function commitPage(raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
      setPageDraft(String(safePage));
      setEditingPage(false);
      return;
    }
    setPage(Math.min(Math.floor(n), maxPage));
    setPageDraft(String(Math.min(Math.floor(n), maxPage)));
    setEditingPage(false);
  }

  return (
    <div className={`pagination ${className}`}>
      <div className="pagination-toolbar">
        <input
          className="pagination-search"
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
            setPageDraft("1");
          }}
          aria-label={`Search ${label}`}
        />
        <div className="pagination-perpage">
          <SelectMenu
            value={perPage}
            options={PER_PAGE_OPTIONS}
            onChange={(n) => {
              setPerPage(n);
              setPage(1);
              setPageDraft("1");
            }}
            ariaLabel="Items per page"
          />
        </div>
      </div>

      {children(pageItems)}

      <div className="pagination-footer">
        <span className="pagination-range">
          {total === 0 ? "0" : `${start + 1}–${Math.min(start + perPage, total)}`} of {total}
        </span>
        <div className="pagination-nav">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage(1);
              setPageDraft("1");
            }}
            aria-label="First page"
          >
            «
          </button>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage(safePage - 1);
              setPageDraft(String(safePage - 1));
            }}
            aria-label="Previous page"
          >
            ‹
          </button>
          {editingPage ? (
            <input
              className="pagination-input pagination-page-input"
              autoFocus
              inputMode="numeric"
              value={pageDraft}
              onChange={(e) => setPageDraft(e.target.value)}
              onBlur={() => commitPage(pageDraft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPage(pageDraft);
                if (e.key === "Escape") {
                  setPageDraft(String(safePage));
                  setEditingPage(false);
                }
              }}
              aria-label="Page number"
            />
          ) : (
            <button
              type="button"
              className="pagination-inline-btn pagination-page-btn"
              onClick={() => {
                setPageDraft(String(safePage));
                setEditingPage(true);
              }}
              title="Go to page"
            >
              {safePage} / {maxPage}
            </button>
          )}
          <button
            type="button"
            disabled={safePage >= maxPage}
            onClick={() => {
              setPage(safePage + 1);
              setPageDraft(String(safePage + 1));
            }}
            aria-label="Next page"
          >
            ›
          </button>
          <button
            type="button"
            disabled={safePage >= maxPage}
            onClick={() => {
              setPage(maxPage);
              setPageDraft(String(maxPage));
            }}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
