interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const window = 2;
  const nums: number[] = [];
  for (let p = Math.max(1, page - window); p <= Math.min(pages, page + window); p++) {
    nums.push(p);
  }

  return (
    <nav className="pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹ Prev
      </button>
      {nums[0] > 1 && <span className="dots">…</span>}
      {nums.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPage(p)}>
          {p}
        </button>
      ))}
      {nums[nums.length - 1] < pages && <span className="dots">…</span>}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next ›
      </button>
    </nav>
  );
}
